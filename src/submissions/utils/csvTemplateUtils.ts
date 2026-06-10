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
  options?: Array<{ label: string; value: string }>
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

/** Iterate every column across all pages/rows of a form, in document order. */
function* iterColumns(pages: FormPage[] | null | undefined): Generator<Column> {
  if (!pages || !Array.isArray(pages)) {
    return
  }
  for (const page of pages) {
    for (const row of page.rows ?? []) {
      for (const col of row.columns ?? []) {
        yield col
      }
    }
  }
}

/**
 * Generate flat CSV template headers from a form's pages structure.
 *
 * - `message` and `file` fields are excluded
 * - Array fields are expanded: `arrayName.[0].subField` … up to `max(1, maxRows)` rows
 * - All field names are camelCased to match submissionData keys
 */
export function generateTemplateHeaders(pages: null | undefined | unknown[]): string[] {
  return _generateTemplateHeaders(pages as FormPage[] | null | undefined)
}

function _generateTemplateHeaders(pages: FormPage[] | null | undefined): string[] {
  const headers: string[] = []
  for (const col of iterColumns(pages)) {
    if (EXCLUDED_TYPES.has(col.type) || !col.name) {
      continue
    }
    headers.push(...columnHeaders(col))
  }
  return headers
}

/** Expand a single column into its flat CSV header keys. */
function columnHeaders(col: Column): string[] {
  const name = col.name as string

  if (col.type === 'array') {
    const subFields = collectArraySubFields(col.rows ?? [])
    // Cap at 100 rows to avoid generating a template with tens of thousands
    // of columns when maxRows is misconfigured or extremely large.
    const count = Math.min(Math.max(1, col.maxRows ?? 1), 100)
    const arrayKey = camelCase(name)
    const out: string[] = []
    for (let i = 0; i < count; i++) {
      for (const sf of subFields) {
        out.push(`${arrayKey}.[${i}].${camelCase(sf)}`)
      }
    }
    return out
  }

  if (col.type === 'group') {
    const groupKey = camelCase(name)
    return collectArraySubFields(col.rows ?? []).map((sf) => `${groupKey}.${sf}`)
  }

  return [camelCase(name)]
}

/** Collect unique sub-field names from all template rows of an array field */
function collectArraySubFields(rows: ArrayRow[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const row of rows) {
    for (const col of row.columns ?? []) {
      if (!col.name || EXCLUDED_TYPES.has(col.type)) {
        continue
      }
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
  | 'group'
  | 'number'
  | 'radio'
  | 'select'
  | 'text'
  | 'textarea'
  | 'toggle'

type FieldMeta = {
  arraySubFields?: string[] // camelCase sub-field names, if array
  groupSubFields?: string[] // camelCase sub-field names, if group
  isArray: boolean
  isGroup: boolean
  key: string
  maxRows?: number
  type: FieldType
}

/**
 * Parse a flat CSV row (keyed by template headers) back to a submissionData
 * object, applying type coercion and reconstructing nested array fields.
 *
 * Keys not present in the form's field map (e.g. `identifier`) are ignored —
 * they live on the submission document itself, not inside submissionData.
 */
export function parseCsvRowToSubmissionData(
  row: Record<string, string>,
  pages: null | undefined | unknown[],
): Record<string, unknown> {
  const fieldMap = buildFieldMap(pages as FormPage[] | null | undefined)
  const result: Record<string, unknown> = {}

  for (const meta of fieldMap.values()) {
    result[meta.key] = reconstructField(meta, row)
  }

  return result
}

/** Rebuild a single submissionData value from its flat CSV cells. */
function reconstructField(meta: FieldMeta, row: Record<string, string>): unknown {
  if (meta.isArray) {
    const count = Math.max(1, meta.maxRows ?? 1)
    const instances: Record<string, unknown>[] = []
    for (let i = 0; i < count; i++) {
      const obj: Record<string, unknown> = {}
      for (const sf of meta.arraySubFields ?? []) {
        obj[sf] = row[`${meta.key}.[${i}].${sf}`] ?? ''
      }
      instances.push(obj)
    }
    return instances
  }

  if (meta.isGroup) {
    const obj: Record<string, unknown> = {}
    for (const sf of meta.groupSubFields ?? []) {
      obj[sf] = row[`${meta.key}.${sf}`] ?? ''
    }
    return obj
  }

  return coerce(row[meta.key] ?? '', meta.type)
}

/** Build an ordered map of camelCase field key → FieldMeta from all pages */
function buildFieldMap(pages: FormPage[] | null | undefined): Map<string, FieldMeta> {
  const map = new Map<string, FieldMeta>()
  for (const col of iterColumns(pages)) {
    if (EXCLUDED_TYPES.has(col.type) || !col.name) {
      continue
    }
    const meta = columnToFieldMeta(col)
    map.set(meta.key, meta)
  }
  return map
}

/** Derive the FieldMeta describing how to import/export a single column. */
function columnToFieldMeta(col: Column): FieldMeta {
  const key = camelCase(col.name as string)

  if (col.type === 'array') {
    return {
      type: 'array',
      arraySubFields: collectArraySubFields(col.rows ?? []),
      isArray: true,
      isGroup: false,
      key,
      maxRows: col.maxRows,
    }
  }

  if (col.type === 'group') {
    return {
      type: 'group',
      groupSubFields: collectArraySubFields(col.rows ?? []),
      isArray: false,
      isGroup: true,
      key,
    }
  }

  return { type: col.type as FieldType, isArray: false, isGroup: false, key }
}

function coerce(value: string, type: FieldType): unknown {
  switch (type) {
    case 'checkbox':
      return value === '' ? [] : value.split(',').map((v) => v.trim())
    case 'consent':
    case 'toggle':
      return value === 'true' || value === '1' || value === 'yes'
    case 'number': {
      if (value === '') {
        return null
      }
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
export function extractFieldsFromPages(pages: null | undefined | unknown[]): FieldDefinition[] {
  const fields: FieldDefinition[] = []
  for (const col of iterColumns(pages as FormPage[] | null | undefined)) {
    if (col.type === 'message' || !col.name) {
      continue
    }
    fields.push({
      type: col.type,
      key: camelCase(col.name),
      label: col.label || col.name,
      options: col.options,
    })
  }
  return fields
}

type FieldOption = { label: string; value: string }
type ValueFormatter = (value: unknown, options?: FieldOption[]) => string

function formatCheckbox(value: unknown, options?: FieldOption[]): string {
  if (Array.isArray(value)) {
    if (options?.length) {
      return value.map((v) => options.find((o) => o.value === v)?.label ?? v).join(', ')
    }
    return value.join(', ')
  }
  return String(value as boolean | number | string)
}

function formatBoolean(value: unknown): string {
  return value === true ? 'Yes' : value === false ? 'No' : ''
}

function formatDate(value: unknown): string {
  if (typeof value === 'string' && value) {
    try {
      return new Date(value).toISOString().split('T')[0] ?? value
    } catch {
      return value
    }
  }
  return String(value as boolean | number | string)
}

function formatFile(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((f: { name?: string }) => f?.name ?? 'File').join(', ')
  }
  return String(value as string)
}

function formatOption(value: unknown, options?: FieldOption[]): string {
  const opt = options?.find((o) => o.value === value)
  return opt ? opt.label : String(value as string)
}

function formatDefault(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value as bigint | boolean | number | string)
}

const VALUE_FORMATTERS: Record<string, ValueFormatter> = {
  checkbox: formatCheckbox,
  consent: formatBoolean,
  date: formatDate,
  email: (v) => String(v as string),
  file: formatFile,
  number: (v) => String(v as number),
  radio: formatOption,
  select: formatOption,
  text: (v) => String(v as string),
  textarea: (v) => String(v as string),
  toggle: formatBoolean,
}

/**
 * Format a single submission value for CSV output.
 * Mirrors the frontend `formatCellValue` utility.
 */
export function formatSubmissionValue(
  value: unknown,
  type: string,
  options?: FieldOption[],
): string {
  if (value === null || value === undefined) {
    return ''
  }
  return (VALUE_FORMATTERS[type] ?? formatDefault)(value, options)
}

type ExportSubmission = {
  createdAt?: null | string
  identifier?: null | string
  submissionData: null | Record<string, unknown>
}

/**
 * Characters that, when leading a cell, are interpreted as a formula by
 * spreadsheet software (Excel, Google Sheets, LibreOffice). Submission values
 * are attacker-controlled, so a cell like `=cmd|'/c calc'!A1` would execute on
 * open. We defuse these by prefixing a single quote (CWE-1236, CSV injection).
 */
const FORMULA_TRIGGER_RE = /^[=+\-@\t\r]/

function escapeCSV(value: string): string {
  // Neutralise formula injection before quoting.
  let safe = value
  if (FORMULA_TRIGGER_RE.test(safe)) {
    safe = `'${safe}`
  }
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
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

  const headers = ['Identifier', 'Submitted', ...fields.map((f) => f.label)]

  const rows = submissions.map((submission) => {
    const identifier = submission.identifier ?? ''
    const submitted = submission.createdAt
      ? new Date(submission.createdAt).toISOString().replace('T', ' ').slice(0, 19)
      : ''

    const fieldValues = fields.map((field) => {
      const value = submission.submissionData?.[field.key]
      return formatSubmissionValue(value, field.type, field.options)
    })

    return [identifier, submitted, ...fieldValues].map(escapeCSV).join(',')
  })

  return [headers.map(escapeCSV).join(','), ...rows].join('\n')
}
