import { nanoid } from '@/shared/utils/nanoid'

/** Maximum allowed file size for a single upload (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * The set of form data keys that are never files — used to filter out metadata
 * fields when scanning a multipart submission for file uploads.
 *
 * Centralised here so the same list is used in the submission endpoint and any
 * future code that needs to distinguish file entries from scalar fields.
 */
export const SUBMISSION_SCALAR_KEYS = new Set([
	'_hp',
	'_ipAddress',
	'_ts',
	'_userAgent',
	'formId',
	'from',
	'submissionData',
	'title',
])

export type PreparedFile = {
	/** Buffer contents of the file. */
	buffer: Buffer
	/** Original form data key (camelCase field name). */
	fieldName: string
	/** MIME type as reported by the browser. */
	mimetype: string
	/** File size in bytes. */
	size: number
	/** Unique file name — `<base>-<timestamp>-<nanoid>.<ext>`. */
	uniqueFileName: string
}

/**
 * Convert a browser File into a PreparedFile ready to pass to `payload.create`.
 *
 * Generates a collision-resistant file name by appending a timestamp and nanoid
 * suffix between the original base name and extension. This prevents name
 * collisions in object storage without altering the extension (needed for MIME
 * sniffing and UI display).
 */
export async function prepareFileForUpload(
	fieldName: string,
	file: File,
): Promise<PreparedFile> {
	const arrayBuffer = await file.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)

	// Preserve extension for MIME sniffing; keep base name recognisable.
	const dotIndex = file.name.lastIndexOf('.')
	const hasExt = dotIndex > 0
	const baseName = hasExt ? file.name.slice(0, dotIndex) : file.name
	const ext = hasExt ? file.name.slice(dotIndex) : ''
	const uniqueFileName = `${baseName}-${Date.now()}-${nanoid()}${ext}`

	return {
		buffer,
		fieldName,
		mimetype: file.type,
		size: file.size,
		uniqueFileName,
	}
}
