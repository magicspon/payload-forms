import type { Endpoint, PayloadRequest, Where } from 'payload'

import { attemptAsync } from '@/shared/utils/attemptAsync'
import { generateSubmissionsCSV } from '@/submissions/utils/csvTemplateUtils'
import { errorResponse } from '@/submissions/utils/errorResponse'

import type { CollectionSlugs } from '../..'

/**
 * GET /api/submissions/export-csv?formId=<id>[&ids=<id1>,<id2>]
 *
 * Streams all submissions for a form as a CSV file download. Pass `ids` as a
 * comma-separated list to export a specific subset. Requires the access check
 * passed in by the plugin — defaults to open access if not overridden.
 */
export function makeSubmissionExportEndpoint(
  isAuthorised: (req: PayloadRequest) => boolean,
  slugs: CollectionSlugs,
): Endpoint {
  return {
    handler: async (req: PayloadRequest) => {
      if (!isAuthorised(req)) {
        return errorResponse('Forbidden', 403)
      }

      const { searchParams } = new URL(req.url ?? '/')
      const formId = searchParams.get('formId')
      const idsParam = searchParams.get('ids')

      if (!formId) {
        return errorResponse('formId is required', 400)
      }

      const [formErr, form] = await attemptAsync(() =>
        req.payload.findByID({
          id: formId,
          collection: slugs.forms as 'forms',
          depth: 0,
        }),
      )

      if (formErr || !form) {
        return errorResponse('Form not found', 404)
      }

      const formRecord = form
      const pages = formRecord.pages
      const formTitle = formRecord.title

      const where: Where = { form: { equals: formId } }

      if (idsParam) {
        const ids = idsParam.split(',').filter(Boolean)
        if (ids.length > 0) {
          where.id = { in: ids }
        }
      }

      const [findErr, result] = await attemptAsync(() =>
        req.payload.find({
          collection: slugs.submissions as 'submissions',
          depth: 0,
          pagination: false,
          where,
        }),
      )

      if (findErr || !result) {
        req.payload.logger.error(
          { err: findErr, formId },
          'submission export: failed to fetch submissions',
        )
        return errorResponse('Failed to fetch submissions', 500)
      }

      const submissions = result.docs as unknown as Array<{
        createdAt?: null | string
        from?: null | string
        submissionData: null | Record<string, unknown>
      }>

      const csv = generateSubmissionsCSV(submissions, pages)

      const safeTitle = formTitle
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
      const date = new Date().toISOString().split('T')[0]
      const filename = `${safeTitle}-submissions-${date}.csv`

      return new Response(csv, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'text/csv; charset=utf-8',
        },
      })
    },
    method: 'get',
    path: '/export-csv',
  }
}
