import type { FormUpload } from '@/shared/types'
import type { Endpoint, PayloadRequest } from 'payload'

import { attemptAsync } from '@/shared/utils/attemptAsync'
import { replaceDataPlaceholders } from '@/shared/utils/replaceDataPlaceholders'
import { errorResponse } from '@/submissions/utils/errorResponse'
import {
	MAX_FILE_SIZE_BYTES,
	prepareFileForUpload,
	SUBMISSION_SCALAR_KEYS,
} from '@/submissions/utils/fileUpload'
import { z } from 'zod'

import type { CollectionSlugs } from '../..'

// In test environments (TEST_ENV=true) skip the timing check
const MIN_SUBMISSION_TIME_MS = process.env.TEST_ENV === 'true' ? 0 : 2000

/**
 * Loose schema for the `from` field — must be a non-empty string that looks
 * like an email address. We use a loose check rather than strict RFC 5321
 * because some forms use phone numbers or usernames in this field.
 */
const fromSchema = z.string().min(1).max(255)

/**
 * Public submission endpoint: POST /api/submissions/:id
 *
 * Accepts multipart/form-data with:
 *   - `from`           — submitter identifier (validated as non-empty string ≤ 255 chars)
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
			const rawFrom = formData.get('from')
			const submissionDataStr = formData.get('submissionData') as null | string
			const honeypot = formData.get('_hp') as null | string
			const userAgent =
				(formData.get('_userAgent') as null | string) ??
				req.headers.get('user-agent') ??
				''
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
			if (
				timestamp &&
				Date.now() - Number(timestamp) < MIN_SUBMISSION_TIME_MS
			) {
				req.payload.logger.info(
					{ event: 'spam.timing', userAgent },
					'Form submission rejected: submitted too quickly',
				)
				return Response.json({ id: null, success: true })
			}

			// Validate `from` — must be a non-empty string (email format not enforced
			// because some integrations use phone numbers or user IDs here).
			const fromResult = fromSchema.safeParse(rawFrom)
			if (!fromResult.success) {
				return errorResponse(
					'Invalid "from" field: must be a non-empty string up to 255 characters',
					400,
				)
			}
			const from = fromResult.data

			// Validate submissionData — must be parseable JSON object (or empty).
			// We accept anything JSON-parseable here; field-level validation is the
			// form's responsibility. Downstream code treats this as Record<string, unknown>.
			const [, submissionData = {}] = await attemptAsync(() => {
				if (!submissionDataStr) {return Promise.resolve({} as Record<string, unknown>)}
				const parsed: unknown = JSON.parse(submissionDataStr)
				if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
					return Promise.reject(new Error('submissionData must be a JSON object'))
				}
				return Promise.resolve(parsed as Record<string, unknown>)
			})

			// Collect File entries, excluding reserved scalar keys.
			// Check each file's size before reading it into memory.
			const filesToUpload: { fieldName: string; file: File }[] = []
			for (const [key, value] of formData.entries()) {
				if (!(value instanceof File) || SUBMISSION_SCALAR_KEYS.has(key)) {continue}

				if (value.size > MAX_FILE_SIZE_BYTES) {
					return errorResponse(
						`File "${key}" exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
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
						team: true,
						title: true,
					},
				}),
			)

			if (formErr || !form) {
				payload.logger.error(
					{ err: formErr, formId },
					'submission: form not found',
				)
				return errorResponse('Form not found', 404)
			}

			// Upload files and collect their Payload document IDs
			const uploadedFiles: {
				fieldName: string
				fileId: string
				uploaded: FormUpload
			}[] = []

			for (const { fieldName, file } of filesToUpload) {
				const [prepErr, prepared] = await attemptAsync(() =>
					prepareFileForUpload(fieldName, file),
				)

				if (prepErr || !prepared) {
					payload.logger.error(
						{ err: prepErr, fieldName, formId },
						'submission: failed to prepare file for upload',
					)
					return errorResponse('Failed to process file upload', 500)
				}

				const [uploadErr, uploaded] = await attemptAsync(() =>
					payload.create({
						collection: slugs.formUploads as 'form-uploads',
						data: { fieldName, form: formId, team: form.team },
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

				const { form: _form, team: _team, ...data } = uploaded

				uploadedFiles.push({
					fieldName,
					fileId: String(uploaded.id),
					uploaded: data as FormUpload,
				})
			}

			// Merge uploaded file metadata into submission data, replacing the raw
			// field value with the stored upload document
			const finalSubmissionData: Record<string, unknown> = { ...submissionData }
			for (const { fieldName, uploaded } of uploadedFiles) {
				finalSubmissionData[fieldName] = uploaded
			}

			const [createErr, submission] = await attemptAsync(() =>
				payload.create({
					collection: slugs.submissions as 'submissions',
					data: {
						form: formId,
						from,
						submissionData: finalSubmissionData,
						title: form.title,
						userAgent,
						// (NFR-012) IP stored for fraud investigation only; purge after 90 days
						_status: 'published',
						ipAddress,
						team: form.team,
					},
					draft: false,
				}),
			)

			if (createErr || !submission) {
				payload.logger.error(
					{ err: createErr, formId },
					'submission: failed to create submission record',
				)
				return errorResponse('Failed to save submission', 500)
			}

			// Link each upload document back to the newly created submission
			for (const { fileId } of uploadedFiles) {
				const [linkErr] = await attemptAsync(() =>
					payload.update({
						id: fileId,
						collection: slugs.formUploads as 'form-uploads',
						data: { submission: submission.id },
					}),
				)

				if (linkErr) {
					// Non-fatal: the submission was saved; the link is best-effort
					payload.logger.error(
						{ err: linkErr, fileId, submissionId: submission.id },
						'submission: failed to link upload to submission',
					)
				}
			}

			const message =
				form.confirmationType === 'message'
					? replaceDataPlaceholders(finalSubmissionData)(form.confirmationMessage)
					: null

			return Response.json({ id: submission.id, message, success: true })
		},
		method: 'post',
		path: '/:id',
	}
}
