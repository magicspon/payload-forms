import { camelCase } from '@/shared/utils/camelCase'

type SubField = {
	name?: string
	type: string
}

type ArrayRow = {
	columns: SubField[]
	id: string
}

type Column = {
	id: string
	label?: string
	maxRows?: number
	name?: string
	rows?: ArrayRow[]
	type: string
}

type FormRow = {
	columns: Column[]
	id: string
}

type FormPage = {
	id: string
	rows: FormRow[]
	title: string
}

/**
 * Field types that produce no importable/exportable scalar value.
 * Used by both the template-header generator and the field-map builder so the
 * exclusion rules stay in a single place.
 */
const EXCLUDED_TYPES = new Set(['file', 'message'])

/**
 * Generate flat CSV template headers from a form's pages structure.
 *
 * - `message` and `file` fields are excluded
 * - Array fields are expanded: `arrayName.[0].subField` … up to `max(1, maxRows)` rows
 * - All field names are camelCased to match submissionData keys
 */
export function generateTemplateHeaders(
	pages: null | undefined | unknown[],
): string[] {
	return _generateTemplateHeaders(pages as FormPage[] | null | undefined)
}

function _generateTemplateHeaders(
	pages: FormPage[] | null | undefined,
): string[] {
	const headers: string[] = []

	if (!pages || !Array.isArray(pages)) {return headers}

	for (const page of pages) {
		for (const row of page.rows ?? []) {
			for (const col of row.columns ?? []) {
				if (EXCLUDED_TYPES.has(col.type)) {continue}
				if (!col.name) {continue}

				if (col.type === 'array') {
					const subFields = collectArraySubFields(col.rows ?? [])
					// Cap at 100 rows to avoid generating a template with tens of thousands
					// of columns when maxRows is misconfigured or extremely large.
					const count = Math.min(Math.max(1, col.maxRows ?? 1), 100)
					const arrayKey = camelCase(col.name)
					for (let i = 0; i < count; i++) {
						for (const sf of subFields) {
							headers.push(`${arrayKey}.[${i}].${camelCase(sf)}`)
						}
					}
				} else {
					headers.push(camelCase(col.name))
				}
			}
		}
	}

	return headers
}

/** Collect unique sub-field names from all template rows of an array field */
function collectArraySubFields(rows: ArrayRow[]): string[] {
	const seen = new Set<string>()
	const result: string[] = []
	for (const row of rows) {
		for (const col of row.columns ?? []) {
			if (!col.name || EXCLUDED_TYPES.has(col.type)) {continue}
			const key = camelCase(col.name)
			if (!seen.has(key)) {
				seen.add(key)
				result.push(key)
			}
		}
	}
	return result
}

// ---------------------------------------------------------------------------

type FieldType =
	| 'array'
	| 'checkbox'
	| 'consent'
	| 'date'
	| 'email'
	| 'number'
	| 'radio'
	| 'select'
	| 'text'
	| 'textarea'
	| 'toggle'

type FieldMeta = {
	arraySubFields?: string[] // camelCase sub-field names, if array
	isArray: boolean
	key: string
	maxRows?: number
	type: FieldType
}

/**
 * Parse a flat CSV row (keyed by template headers) back to a submissionData
 * object, applying type coercion and reconstructing nested array fields.
 *
 * The `from` key is intentionally omitted from the result — it lives on the
 * submission document itself, not inside submissionData.
 */
export function parseCsvRowToSubmissionData(
	row: Record<string, string>,
	pages: null | undefined | unknown[],
): Record<string, unknown> {
	const fieldMap = buildFieldMap(pages as FormPage[] | null | undefined)
	const result: Record<string, unknown> = {}

	for (const meta of fieldMap.values()) {
		if (meta.isArray) {
			const count = Math.max(1, meta.maxRows ?? 1)
			const instances: Record<string, unknown>[] = []
			for (let i = 0; i < count; i++) {
				const obj: Record<string, unknown> = {}
				for (const sf of meta.arraySubFields ?? []) {
					const csvKey = `${meta.key}.[${i}].${sf}`
					obj[sf] = row[csvKey] ?? ''
				}
				instances.push(obj)
			}
			result[meta.key] = instances
		} else {
			const raw = row[meta.key] ?? ''
			result[meta.key] = coerce(raw, meta.type)
		}
	}

	return result
}

/** Build an ordered map of camelCase field key → FieldMeta from all pages */
function buildFieldMap(
	pages: FormPage[] | null | undefined,
): Map<string, FieldMeta> {
	const map = new Map<string, FieldMeta>()

	if (!pages || !Array.isArray(pages)) {return map}

	for (const page of pages) {
		for (const row of page.rows ?? []) {
			for (const col of row.columns ?? []) {
				if (EXCLUDED_TYPES.has(col.type)) {continue}
				if (!col.name) {continue}

				const key = camelCase(col.name)

				if (col.type === 'array') {
					map.set(key, {
						type: 'array',
						arraySubFields: collectArraySubFields(col.rows ?? []),
						isArray: true,
						key,
						maxRows: col.maxRows,
					})
				} else {
					map.set(key, { type: col.type as FieldType, isArray: false, key })
				}
			}
		}
	}

	return map
}

function coerce(value: string, type: FieldType): unknown {
	switch (type) {
		case 'checkbox':
			return value === '' ? [] : value.split(',').map((v) => v.trim())
		case 'consent':
		case 'toggle':
			return value === 'true' || value === '1' || value === 'yes'
		case 'number': {
			if (value === '') {return null}
			const n = Number(value)
			return Number.isNaN(n) ? null : n
		}
		default:
			return value
	}
}

// ---------------------------------------------------------------------------
// Export CSV utilities (server-side)
// ---------------------------------------------------------------------------

/** A resolved form field with enough info to render a CSV column. */
export type FieldDefinition = {
	key: string
	label: string
	options?: Array<{ label: string; value: string }>
	type: string
}

/**
 * Extract field definitions from form pages for use as CSV column headers.
 * Mirrors the frontend `extractFieldsFromSchema` utility but runs server-side.
 * Skips message fields — they produce no submission data.
 */
export function extractFieldsFromPages(
	pages: null | undefined | unknown[],
): FieldDefinition[] {
	type ColumnDef = {
		id: string
		label?: string
		name?: string
		options?: Array<{ label: string; value: string }>
		type: string
	}
	type RowDef = { columns: ColumnDef[]; id: string }
	type PageDef = { id: string; rows: RowDef[]; title: string }

	if (!pages || !Array.isArray(pages)) {return []}

	const fields: FieldDefinition[] = []

	for (const page of pages as PageDef[]) {
		for (const row of page.rows ?? []) {
			for (const col of row.columns ?? []) {
				if (col.type === 'message') {continue}
				if (!col.name) {continue}
				fields.push({
					type: col.type,
					key: camelCase(col.name),
					label: col.label || col.name,
					options: col.options,
				})
			}
		}
	}

	return fields
}

/**
 * Format a single submission value for CSV output.
 * Mirrors the frontend `formatCellValue` utility.
 */
export function formatSubmissionValue(
	value: unknown,
	type: string,
	options?: Array<{ label: string; value: string }>,
): string {
	if (value === null || value === undefined) {return ''}

	switch (type) {
		case 'checkbox':
			if (Array.isArray(value)) {
				if (options?.length) {
					return value
						.map((v) => options.find((o) => o.value === v)?.label ?? v)
						.join(', ')
				}
				return value.join(', ')
			}
			return String(value as boolean | number | string)
		case 'consent':
		case 'toggle':
			return value === true ? 'Yes' : value === false ? 'No' : ''

		case 'date':
			if (typeof value === 'string' && value) {
				try {
					return new Date(value).toISOString().split('T')[0] ?? value
				} catch {
					return value
				}
			}
			return String(value as boolean | number | string)

		case 'email':
		case 'text':
		case 'textarea':
			return String(value as string)

		case 'file':
			if (Array.isArray(value)) {
				return value
					.map((f: { name?: string }) => f?.name ?? 'File')
					.join(', ')
			}
			return String(value as string)

		case 'number':
			return String(value as number)

		case 'radio':
		case 'select': {
			if (options?.length) {
				const opt = options.find((o) => o.value === value)
				if (opt) {return opt.label}
			}
			return String(value as string)
		}

		default:
			if (Array.isArray(value)) {return value.join(', ')}
			if (typeof value === 'object') {return JSON.stringify(value)}
			return String(value as bigint | boolean | number | string)
	}
}

type ExportSubmission = {
	createdAt?: null | string
	from?: null | string
	submissionData: null | Record<string, unknown>
}

function escapeCSV(value: string): string {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`
	}
	return value
}

/**
 * Generate a CSV string from submission documents.
 * Columns: From, Submitted, then one column per form field.
 * Mirrors the frontend `generateCSV` utility but runs server-side and derives
 * fields directly from the form pages schema.
 */
export function generateSubmissionsCSV(
	submissions: ExportSubmission[],
	pages: null | undefined | unknown[],
): string {
	const fields = extractFieldsFromPages(pages)

	const headers = ['From', 'Submitted', ...fields.map((f) => f.label)]

	const rows = submissions.map((submission) => {
		const from = submission.from ?? ''
		const submitted = submission.createdAt
			? new Date(submission.createdAt).toISOString().replace('T', ' ').slice(0, 19)
			: ''

		const fieldValues = fields.map((field) => {
			const value = submission.submissionData?.[field.key]
			return formatSubmissionValue(value, field.type, field.options)
		})

		return [from, submitted, ...fieldValues].map(escapeCSV).join(',')
	})

	return [headers.map(escapeCSV).join(','), ...rows].join('\n')
}
