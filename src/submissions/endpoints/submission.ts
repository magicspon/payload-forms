import type { Endpoint, PayloadRequest } from 'payload'

import { attemptAsync } from '@/shared/utils/attemptAsync'
import { replaceDataPlaceholders } from '@/shared/utils/replaceDataPlaceholders'
import { errorResponse } from '@/submissions/utils/errorResponse'
import {
  checkSpamSignals,
  cleanSubmissionData,
  collectFiles,
  deriveIdentifier,
  loadFormContext,
  parseSubmissionData,
  uploadFiles,
} from '@/submissions/utils/submissionPipeline'
import type { CollectionSlugs } from '../..'

/**
 * Public submission endpoint: POST /api/submissions/:id
 *
 * Accepts multipart/form-data with:
 *   - `submissionData` — JSON-encoded field values
 *   - `_hp`            — honeypot field; non-empty value triggers fake-success spam response
 *   - `_ts`            — submission timestamp; too-fast responses trigger fake-success
 *   - `_userAgent`     — client user agent (falls back to request header)
 *   - `_ipAddress`     — client IP (falls back to x-forwarded-for)
 *   - any File entries — uploaded as form-uploads documents
 *
 * File size is capped at MAX_FILE_SIZE_BYTES per file. The processing pipeline
 * (spam checks, parsing, bounding, upload, persistence) lives in
 * `submissionPipeline.ts`; each step returns a short-circuit Response or its
 * value so this handler reads as a linear sequence.
 */
export function makeSubmissionEndpoint(slugs: CollectionSlugs): Endpoint {
  return {
    handler: async (req: PayloadRequest) => {
      const { payload, routeParams } = req

      if (!payload) {
        return errorResponse('Payload not available', 500)
      }

      const formData = await req.formData?.()
      if (!formData) {
        return errorResponse('No form data provided', 400)
      }

      const formId = routeParams?.id as string
      const userAgent =
        (formData.get('_userAgent') as null | string) ?? req.headers.get('user-agent') ?? ''
      const ipAddress =
        (formData.get('_ipAddress') as null | string) ??
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        ''

      // Spam checks return fake success (never an error) before any expensive work.
      const spam = checkSpamSignals(req, formData, userAgent)
      if (spam) {
        return spam
      }

      const parsed = await parseSubmissionData(formData)
      if (!parsed.ok) {
        return parsed.response
      }

      const files = collectFiles(formData)
      if (!files.ok) {
        return files.response
      }

      const context = await loadFormContext(payload, slugs, formId)
      if (!context.ok) {
        return context.response
      }
      const { allFields, fileFieldMap, form } = context.value

      const cleanData = cleanSubmissionData(parsed.value, allFields)
      const identifier = deriveIdentifier(form, cleanData)

      const uploaded = await uploadFiles(payload, slugs, files.value, fileFieldMap, formId)
      if (!uploaded.ok) {
        return uploaded.response
      }

      // Coerce the string URL param to the correct ID type for the relationship validator.
      // Payload's isValidID requires typeof === 'number' when defaultIDType is 'number' (SQLite).
      const parsedFormId = Number.isNaN(Number(formId)) ? formId : Number(formId)

      const [createErr, submission] = await attemptAsync(() =>
        payload.create({
          collection: slugs.submissions as 'submissions',
          data: {
            fileUploads: uploaded.value,
            form: parsedFormId as number,
            identifier,
            submissionData: cleanData,
            title: form.title,
            userAgent,
            // (NFR-012) IP stored for fraud investigation only; purge after 90 days
            ipAddress,
          },
          // draft: false publishes immediately on draft-enabled collections
          draft: false,
          overrideAccess: true,
        }),
      )

      if (createErr || !submission) {
        payload.logger.error(
          { err: createErr, formId },
          'submission: failed to create submission record',
        )
        return errorResponse('Failed to save submission', 500)
      }

      const message =
        form.confirmationType === 'message'
          ? replaceDataPlaceholders(cleanData)(form.confirmationMessage)
          : null

      return Response.json({ doc: submission, message, success: true }, { status: 201 })
    },
    method: 'post',
    path: '/:id',
  }
}
