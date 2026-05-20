import type { Endpoint, Payload, PayloadRequest } from 'payload'

import { attemptAsync } from '@/shared/utils/attemptAsync'
import { parseCsvRowToSubmissionData } from '@/submissions/utils/csvTemplateUtils'
import { errorResponse } from '@/submissions/utils/errorResponse'
import { z } from 'zod'

import type { CollectionSlugs } from '../..'

/**
 * Called once after all rows in a batch import have been created successfully.
 * Use this to queue a single notification instead of one per imported record.
 */
export type OnBatchImportComplete = (args: {
  count: number
  formId: number | string
  payload: Payload
  teamId: string
}) => Promise<void>

const IdSchema = z.union([z.string().min(1), z.number()])

/** Maximum number of rows accepted in a single batch import. */
const MAX_IMPORT_ROWS = 10_000

/** Maximum character length for any single CSV cell value. */
const MAX_CELL_LENGTH = 10_000

const ImportBodySchema = z.object({
  formId: IdSchema,
  teamId: z.string().min(1).optional(),
  // Limit row count to prevent memory exhaustion from huge payloads (DoS).
  // Limit cell length to prevent oversized string injection.
  rows: z
    .array(z.record(z.string().max(255), z.string().max(MAX_CELL_LENGTH)))
    .min(1)
    .max(MAX_IMPORT_ROWS),
})

/**
 * POST /api/submissions/import-csv
 *
 * Accepts a batch of flat CSV rows keyed by form template headers and creates
 * submission documents. Stops on first creation failure and reports how many
 * succeeded. Requires team member access — access check is passed in by the
 * plugin so the host app can provide its own implementation.
 *
 * Each create call carries `context: { isBatchImport: true }` so that
 * per-record hooks (direct emails, job queuing) are suppressed. If
 * `onBatchComplete` is provided it is called once after the full batch
 * succeeds, giving the caller a single point to fire notifications.
 */
export function makeSubmissionImportEndpoint(
  isAuthorised: (req: PayloadRequest) => boolean,
  onBatchComplete: OnBatchImportComplete | undefined,
  slugs: CollectionSlugs,
): Endpoint {
  return {
    handler: async (req: PayloadRequest) => {
      if (!isAuthorised(req)) {
        return errorResponse('Forbidden', 403)
      }

      const [parseErr, rawBody] = await attemptAsync(async () => {
        if (!req.json) {
          throw new Error('json() not available')
        }
        return req.json() as Promise<unknown>
      })

      if (parseErr || !rawBody) {
        return errorResponse('Invalid JSON body', 400)
      }

      const parsed = ImportBodySchema.safeParse(rawBody)
      if (!parsed.success) {
        return Response.json(
          {
            error: 'Invalid request body',
            issues: parsed.error.issues,
            success: false,
          },
          { status: 422 },
        )
      }

      const { formId, rows, teamId } = parsed.data

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

      // form.pages is a JSON field — typed as JsonValue | null in generated types.
      // Cast to unknown[] so parseCsvRowToSubmissionData can narrow it internally.
      const pages = form.pages
      const formTitle = form.title

      let created = 0
      for (const row of rows) {
        const submissionData = parseCsvRowToSubmissionData(row, pages)

        const [createErr] = await attemptAsync(() =>
          req.payload.create({
            collection: slugs.submissions as 'submissions',
            // Suppress per-record hooks (email, job queuing) during a batch.
            // onBatchComplete fires once below when the full import succeeds.
            context: { isBatchImport: true },
            data: {
              from: row['from'] ?? '',
              title: formTitle,
              // Payload generated types expect string; PostgreSQL adapter accepts numbers too.
              form: formId as string,
              formSnapshot: form as unknown as Record<string, unknown>,
              submissionData,
            },
          }),
        )

        if (createErr) {
          req.payload.logger.error(
            { created, err: createErr, formId },
            'submission import: failed to create submission',
          )
          return Response.json(
            { created, error: 'Creation failed', success: false },
            { status: 500 },
          )
        }

        created++
      }

      if (onBatchComplete) {
        const [notifyErr] = await attemptAsync(() =>
          onBatchComplete({
            count: created,
            formId,
            payload: req.payload,
            teamId: teamId ?? '',
          }),
        )

        if (notifyErr) {
          req.payload.logger.error(
            { created, err: notifyErr, formId, teamId },
            'submission import: onBatchComplete callback failed',
          )
        }
      }

      return Response.json({ count: created, success: true })
    },
    method: 'post',
    path: '/import-csv',
  }
}
