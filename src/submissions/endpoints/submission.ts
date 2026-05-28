import type { FileUploadEntry, FormUpload } from '@/shared/types'
import type { Endpoint, PayloadRequest } from 'payload'

import { getAllFields } from '@/form-builder/utils/formTree'
import { attemptAsync } from '@/shared/utils/attemptAsync'
import { camelCase } from '@/shared/utils/camelCase'
import { replaceDataPlaceholders } from '@/shared/utils/replaceDataPlaceholders'
import { errorResponse } from '@/submissions/utils/errorResponse'
import {
  MAX_FILE_SIZE_BYTES,
  prepareFileForUpload,
  SUBMISSION_SCALAR_KEYS,
} from '@/submissions/utils/fileUpload'
import type { CollectionSlugs } from '../..'
import type { FormPage } from '@/form-builder/utils/formTree'

// Skip timing check in test or non-production environments
const MIN_SUBMISSION_TIME_MS =
  process.env.TEST_ENV === 'true' || process.env.NODE_ENV !== 'production' ? 0 : 2000

/**
 * Caps on the public submission endpoint. This route runs with
 * `overrideAccess: true` and accepts unauthenticated input, so it bounds the
 * size/shape of every request to prevent memory-exhaustion / storage abuse.
 */
/** Maximum byte length of the JSON-encoded `submissionData` payload (1 MB). */
const MAX_SUBMISSION_DATA_BYTES = 1024 * 1024
/** Maximum number of file attachments accepted in a single submission. */
const MAX_FILES_PER_SUBMISSION = 20
/** Maximum combined size of all file attachments in a single submission (25 MB). */
const MAX_TOTAL_UPLOAD_BYTES = 25 * 1024 * 1024

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
 * File size is capped at MAX_FILE_SIZE_BYTES per file.
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
      const submissionDataStr = formData.get('submissionData') as null | string
      const honeypot = formData.get('_hp') as null | string
      const userAgent =
        (formData.get('_userAgent') as null | string) ?? req.headers.get('user-agent') ?? ''
      const ipAddress =
        (formData.get('_ipAddress') as null | string) ??
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        ''

      // Honeypot — return fake success to not alert bots.
      // Log to structured logger (not console) so we don't leak IP to stdout logs
      // without a documented legal basis for retention.
      if (honeypot) {
        req.payload.logger.info(
          { event: 'spam.honeypot', userAgent },
          'Form submission rejected: honeypot field filled',
        )
        return Response.json({ id: null, success: true })
      }

      const timestamp = formData.get('_ts') as null | string

      // Timing check — return fake success to not alert bots
      if (timestamp && Date.now() - Number(timestamp) < MIN_SUBMISSION_TIME_MS) {
        req.payload.logger.info(
          { event: 'spam.timing', userAgent },
          'Form submission rejected: submitted too quickly',
        )
        return Response.json({ id: null, success: true })
      }

      // Reject oversized payloads before parsing to avoid memory exhaustion.
      if (
        submissionDataStr &&
        Buffer.byteLength(submissionDataStr, 'utf8') > MAX_SUBMISSION_DATA_BYTES
      ) {
        return errorResponse('Submission data exceeds the maximum allowed size', 413)
      }

      // Parse submissionData — must be a JSON object (or empty). Unknown keys
      // are stripped below once the form's field set is known; field-level
      // value validation remains the form renderer's responsibility.
      const [parseErr, submissionData = {}] = await attemptAsync(() => {
        if (!submissionDataStr) {
          return Promise.resolve({} as Record<string, unknown>)
        }
        const parsed: unknown = JSON.parse(submissionDataStr)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          return Promise.reject(new Error('submissionData must be a JSON object'))
        }
        return Promise.resolve(parsed as Record<string, unknown>)
      })

      if (parseErr) {
        return errorResponse('submissionData must be a valid JSON object', 400)
      }

      // Collect File entries, excluding reserved scalar keys.
      // Bound per-file size, file count, and total upload size before reading
      // anything into memory.
      const filesToUpload: { fieldName: string; file: File }[] = []
      let totalUploadBytes = 0
      for (const [key, value] of formData.entries()) {
        if (!(value instanceof File) || SUBMISSION_SCALAR_KEYS.has(key)) {
          continue
        }

        if (value.size > MAX_FILE_SIZE_BYTES) {
          return errorResponse(
            `File "${key}" exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
            413,
          )
        }

        if (filesToUpload.length >= MAX_FILES_PER_SUBMISSION) {
          return errorResponse(
            `A submission may include at most ${MAX_FILES_PER_SUBMISSION} files`,
            413,
          )
        }

        totalUploadBytes += value.size
        if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
          return errorResponse(
            `Total upload size exceeds the maximum allowed size of ${MAX_TOTAL_UPLOAD_BYTES / (1024 * 1024)} MB`,
            413,
          )
        }

        filesToUpload.push({ fieldName: key, file: value })
      }

      const [formErr, form] = await attemptAsync(() =>
        payload.findByID({
          id: formId,
          collection: slugs.forms as 'forms',
          depth: 0,
          select: {
            confirmationMessage: true,
            confirmationType: true,
            identifierField: true,
            pages: true,
            title: true,
          },
        }),
      )

      if (formErr || !form) {
        payload.logger.error({ err: formErr, formId }, 'submission: form not found')
        return errorResponse('Form not found', 404)
      }

      // Build a fieldName → file field config map from the form's pages.
      // Used to look up per-field relationTo (upload collection slug).
      const allFields = getAllFields((form.pages as FormPage[] | null) ?? [])
      const fileFieldMap = new Map(
        allFields.filter((f) => f.type === 'file').map((f) => [f.name, f]),
      )

      // Strip keys that don't correspond to a real form field. The client can
      // POST arbitrary JSON, so we only persist values for known fields (keyed
      // by camelCase name, matching the form renderer). File-field values are
      // populated from uploads on read, so they're not expected here.
      const allowedKeys = new Set<string>()
      for (const f of allFields) {
        if (f.type !== 'message' && f.name) {
          allowedKeys.add(camelCase(f.name))
        }
      }
      const cleanData: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(submissionData)) {
        if (allowedKeys.has(key)) {
          cleanData[key] = value
        }
      }

      // Derive the submission identifier from the nominated form field.
      const identifierFieldName = (form.identifierField as null | string) ?? null
      let identifier: null | string = null
      if (identifierFieldName) {
        const raw = cleanData[identifierFieldName]
        if (raw !== null && raw !== undefined) {
          identifier = Array.isArray(raw) ? raw.join(', ') : String(raw as string)
        }
      }

      // Upload files to their target collection (per-field relationTo or default)
      const uploadedFiles: {
        fieldName: string
        fileId: string
        targetCollection: string
        uploaded: FormUpload
      }[] = []

      for (const { fieldName, file } of filesToUpload) {
        const fieldConfig = fileFieldMap.get(fieldName)
        const targetCollection = fieldConfig?.relationTo ?? slugs.formUploads

        const [prepErr, prepared] = await attemptAsync(() => prepareFileForUpload(fieldName, file))

        if (prepErr || !prepared) {
          payload.logger.error(
            { err: prepErr, fieldName, formId },
            'submission: failed to prepare file for upload',
          )
          return errorResponse('Failed to process file upload', 500)
        }

        const [uploadErr, uploaded] = await attemptAsync(() =>
          payload.create({
            collection: targetCollection as 'form-uploads',
            data: { fieldName, form: formId as unknown as number },
            file: {
              name: prepared.uniqueFileName,
              data: prepared.buffer,
              mimetype: prepared.mimetype,
              size: prepared.size,
            },
          }),
        )

        if (uploadErr || !uploaded) {
          payload.logger.error(
            { err: uploadErr, fieldName, formId },
            'submission: failed to upload file',
          )
          return errorResponse('Failed to upload file', 500)
        }

        const { form: _form, ...data } = uploaded

        uploadedFiles.push({
          fieldName,
          fileId: String(uploaded.id),
          targetCollection,
          uploaded: data as unknown as FormUpload,
        })
      }

      // Group uploads by field into the fileUploads structure.
      // afterRead hook uses this to populate submissionData at read time.
      const fileUploadMap = new Map<string, FileUploadEntry>()
      for (const { fieldName, fileId, targetCollection } of uploadedFiles) {
        const fieldConfig = fileFieldMap.get(fieldName)
        const existing = fileUploadMap.get(fieldName)
        if (existing) {
          existing.ids.push(fileId)
        } else {
          fileUploadMap.set(fieldName, {
            fieldName,
            ids: [fileId],
            maxFiles: fieldConfig?.maxFiles ?? 1,
            relationTo: targetCollection,
          })
        }
      }
      const fileUploads = Array.from(fileUploadMap.values())

      // Coerce the string URL param to the correct ID type for the relationship validator.
      // Payload's isValidID requires typeof === 'number' when defaultIDType is 'number' (SQLite).
      const parsedFormId = Number.isNaN(Number(formId)) ? formId : Number(formId)

      const [createErr, submission] = await attemptAsync(() =>
        payload.create({
          collection: slugs.submissions as 'submissions',
          data: {
            fileUploads,
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
