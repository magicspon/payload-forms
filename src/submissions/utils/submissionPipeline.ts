import type { Field } from '@/shared/fieldSchema'
import type { FileUploadEntry } from '@/shared/types'
import type { PayloadRequest } from 'payload'
import type { CollectionSlugs } from '../..'
import type { FormPage } from '@/form-builder/utils/formTree'

import { getAllFields } from '@/form-builder/utils/formTree'
import { attemptAsync } from '@/shared/utils/attemptAsync'
import { camelCase } from '@/shared/utils/camelCase'
import { errorResponse } from '@/submissions/utils/errorResponse'
import {
  MAX_FILE_SIZE_BYTES,
  prepareFileForUpload,
  SUBMISSION_SCALAR_KEYS,
} from '@/submissions/utils/fileUpload'

/**
 * Result of a pipeline step that may short-circuit the request with an HTTP
 * response. `ok: true` carries the step's value; `ok: false` carries the
 * `Response` the handler should return immediately.
 */
export type StepResult<T> = { ok: false; response: Response } | { ok: true; value: T }

/** File-typed form field, narrowed from the field union. */
type FileField = Extract<Field, { type: 'file' }>

/** Subset of the form document the submission pipeline reads. */
export type SubmissionForm = {
  confirmationMessage?: null | string
  confirmationType?: null | string
  identifierField?: null | string
  pages?: FormPage[] | null
  title?: null | string
}

/** Resolved form plus the field lookups derived from it. */
export type FormContext = {
  allFields: Field[]
  fileFieldMap: Map<string, FileField>
  form: SubmissionForm
}

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
 * Detect spam signals (honeypot field or too-fast submission).
 *
 * Returns a fake-success `200` Response — never an error — so bots cannot
 * distinguish a rejected submission from an accepted one. Returns `null` to
 * continue processing. Logs via the structured logger so the client IP /
 * user-agent never reaches stdout.
 */
export function checkSpamSignals(
  req: PayloadRequest,
  formData: FormData,
  userAgent: string,
): null | Response {
  const honeypot = formData.get('_hp') as null | string
  if (honeypot) {
    req.payload.logger.info(
      { event: 'spam.honeypot', userAgent },
      'Form submission rejected: honeypot field filled',
    )
    return Response.json({ id: null, success: true })
  }

  const timestamp = formData.get('_ts') as null | string
  if (timestamp && Date.now() - Number(timestamp) < MIN_SUBMISSION_TIME_MS) {
    req.payload.logger.info(
      { event: 'spam.timing', userAgent },
      'Form submission rejected: submitted too quickly',
    )
    return Response.json({ id: null, success: true })
  }

  return null
}

/**
 * Parse the `submissionData` field — must be a JSON object (or empty). Rejects
 * oversized payloads before parsing to avoid memory exhaustion. Unknown keys
 * are stripped later by {@link cleanSubmissionData} once the form's field set
 * is known.
 */
export async function parseSubmissionData(
  formData: FormData,
): Promise<StepResult<Record<string, unknown>>> {
  const submissionDataStr = formData.get('submissionData') as null | string

  if (submissionDataStr && Buffer.byteLength(submissionDataStr, 'utf8') > MAX_SUBMISSION_DATA_BYTES) {
    return {
      ok: false,
      response: errorResponse('Submission data exceeds the maximum allowed size', 413),
    }
  }

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
    return { ok: false, response: errorResponse('submissionData must be a valid JSON object', 400) }
  }

  return { ok: true, value: submissionData }
}

/**
 * Collect File entries from the multipart body, excluding reserved scalar keys.
 * Bounds per-file size, file count, and total upload size before reading
 * anything into memory.
 */
export function collectFiles(formData: FormData): StepResult<{ fieldName: string; file: File }[]> {
  const filesToUpload: { fieldName: string; file: File }[] = []
  let totalUploadBytes = 0

  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File) || SUBMISSION_SCALAR_KEYS.has(key)) {
      continue
    }

    if (value.size > MAX_FILE_SIZE_BYTES) {
      return {
        ok: false,
        response: errorResponse(
          `File "${key}" exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
          413,
        ),
      }
    }

    if (filesToUpload.length >= MAX_FILES_PER_SUBMISSION) {
      return {
        ok: false,
        response: errorResponse(
          `A submission may include at most ${MAX_FILES_PER_SUBMISSION} files`,
          413,
        ),
      }
    }

    totalUploadBytes += value.size
    if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
      return {
        ok: false,
        response: errorResponse(
          `Total upload size exceeds the maximum allowed size of ${MAX_TOTAL_UPLOAD_BYTES / (1024 * 1024)} MB`,
          413,
        ),
      }
    }

    filesToUpload.push({ fieldName: key, file: value })
  }

  return { ok: true, value: filesToUpload }
}

/**
 * Fetch the form and derive the field lookups the rest of the pipeline needs:
 * the flattened field list and a fieldName → file-field config map (used to
 * resolve each upload's target collection).
 */
export async function loadFormContext(
  payload: PayloadRequest['payload'],
  slugs: CollectionSlugs,
  formId: string,
): Promise<StepResult<FormContext>> {
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
    return { ok: false, response: errorResponse('Form not found', 404) }
  }

  const allFields = getAllFields((form.pages as FormPage[] | null) ?? [])
  const fileFieldMap = new Map(
    allFields.filter((f): f is FileField => f.type === 'file').map((f) => [f.name, f]),
  )

  return {
    ok: true,
    value: { allFields, fileFieldMap, form: form as unknown as SubmissionForm },
  }
}

/**
 * Strip keys that don't correspond to a real form field. The client can POST
 * arbitrary JSON, so we only persist values for known fields. The form renderer
 * keys by the raw field name while the CSV tooling uses the camelCase form, so
 * accept either to avoid dropping legitimate data. File-field values are
 * populated from uploads on read, not sent here.
 */
export function cleanSubmissionData(
  submissionData: Record<string, unknown>,
  allFields: Field[],
): Record<string, unknown> {
  const allowedKeys = new Set<string>()
  for (const f of allFields) {
    if (f.type !== 'message' && f.name) {
      allowedKeys.add(f.name)
      allowedKeys.add(camelCase(f.name))
    }
  }

  const cleanData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(submissionData)) {
    if (allowedKeys.has(key)) {
      cleanData[key] = value
    }
  }
  return cleanData
}

/** Derive the submission identifier from the form's nominated field. */
export function deriveIdentifier(
  form: SubmissionForm,
  cleanData: Record<string, unknown>,
): null | string {
  const identifierFieldName = form.identifierField ?? null
  if (!identifierFieldName) {
    return null
  }

  const raw = cleanData[identifierFieldName]
  if (raw === null || raw === undefined) {
    return null
  }
  return Array.isArray(raw) ? raw.join(', ') : String(raw as string)
}

/**
 * Upload each collected file to its target collection (per-field `relationTo`
 * or the default uploads collection), then group the results by field into the
 * `fileUploads` structure the `afterRead` hook uses to populate submissionData
 * at read time.
 */
export async function uploadFiles(
  payload: PayloadRequest['payload'],
  slugs: CollectionSlugs,
  filesToUpload: { fieldName: string; file: File }[],
  fileFieldMap: Map<string, FileField>,
  formId: string,
): Promise<StepResult<FileUploadEntry[]>> {
  const uploadedFiles: { fieldName: string; fileId: string; targetCollection: string }[] = []

  for (const { fieldName, file } of filesToUpload) {
    const fieldConfig = fileFieldMap.get(fieldName)
    const targetCollection = fieldConfig?.relationTo ?? slugs.formUploads

    const [prepErr, prepared] = await attemptAsync(() => prepareFileForUpload(fieldName, file))
    if (prepErr || !prepared) {
      payload.logger.error(
        { err: prepErr, fieldName, formId },
        'submission: failed to prepare file for upload',
      )
      return { ok: false, response: errorResponse('Failed to process file upload', 500) }
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
      payload.logger.error({ err: uploadErr, fieldName, formId }, 'submission: failed to upload file')
      return { ok: false, response: errorResponse('Failed to upload file', 500) }
    }

    uploadedFiles.push({ fieldName, fileId: String(uploaded.id), targetCollection })
  }

  // Group uploads by field into the fileUploads structure.
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

  return { ok: true, value: Array.from(fileUploadMap.values()) }
}
