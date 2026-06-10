import type { FormPage, FormRow } from '@/form-builder/utils/formTree'
import type { Field, FieldType } from '@/shared/fieldSchema'

import { appendRowToPage } from '@/form-builder/utils/formTree'
import { createDefaultField } from '@/shared/fieldSchema'
import { camelCase } from '@/shared/utils/camelCase'
import { nanoid } from '@/shared/utils/nanoid'

export type InsertMode = 'append' | 'new-page' | 'replace'

export interface Option {
  label: string
  value: string
}

export interface Mapping {
  fieldType: FieldType | null
  header: string
  /** Editable field name (camelCase of header by default) */
  name: string
  /** Only populated when fieldType is checkbox, radio, or select */
  options: Option[]
}

const OPTIONS_TYPES = new Set<FieldType>(['checkbox', 'radio', 'select'])

export function isOptionsType(t: FieldType | null): t is 'checkbox' | 'radio' | 'select' {
  return t !== null && OPTIONS_TYPES.has(t)
}

/** Guess a sensible default field type from a column header name. */
export function inferFieldType(header: string): FieldType {
  const h = header.toLowerCase()
  if (h.includes('email')) {
    return 'email'
  }
  if (h.includes('date')) {
    return 'date'
  }
  if (
    h.includes('number') ||
    h.includes('age') ||
    h.includes('count') ||
    h.includes('amount') ||
    h.includes('score')
  ) {
    return 'number'
  }
  if (h.includes('consent') || h.includes('agree') || h.includes('accept')) {
    return 'consent'
  }
  if (h.includes('toggle') || h.includes('enabled') || h.includes('active')) {
    return 'toggle'
  }
  return 'text'
}

/** Returns a map of index → error message for active mappings with name conflicts. */
export function computeNameErrors(
  mappings: Mapping[],
  existingNames: Set<string>,
): Map<number, string> {
  const errors = new Map<number, string>()
  const seen = new Map<string, number>() // name → first active index

  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i]
    if (m.fieldType === null) {
      continue
    } // skipped rows don't participate
    const n = m.name.trim()
    if (!n) {
      errors.set(i, 'Name is required')
      continue
    }
    if (existingNames.has(n)) {
      errors.set(i, `"${n}" already exists in the form`)
      continue
    }
    const prev = seen.get(n)
    if (prev !== undefined) {
      errors.set(prev, `"${n}" is used more than once`)
      errors.set(i, `"${n}" is used more than once`)
    } else {
      seen.set(n, i)
    }
  }
  return errors
}

/** Build initial mappings from parsed CSV column headers. */
export function buildMappingsFromHeaders(headers: string[]): Mapping[] {
  return headers.map<Mapping>((h) => {
    const fieldType = inferFieldType(h)
    return {
      name: camelCase(h),
      fieldType,
      header: h,
      options: isOptionsType(fieldType) ? [{ label: '', value: '' }] : [],
    }
  })
}

/** Build form fields from active (non-skipped) mappings. */
export function buildFieldsFromMappings(mappings: Mapping[]): Field[] {
  return mappings
    .filter((m) => m.fieldType !== null)
    .map((m) => {
      const base = createDefaultField(nanoid(), m.fieldType!)
      const validOptions = m.options.filter((o) => o.label.trim())
      const field = {
        ...base,
        name: m.name.trim(),
        label: m.header,
      }
      if (isOptionsType(m.fieldType) && validOptions.length > 0) {
        Object.assign(field, { options: validOptions })
      }
      return field as Field
    })
}

export type InsertResult = { error: string; ok: false } | { ok: true; pages: FormPage[] }

/**
 * Apply the chosen insert mode to the form pages, returning the next pages or
 * an error to surface. Pure aside from id generation — no React state or toasts.
 */
export function applyInsertMode(args: {
  fields: Field[]
  mode: InsertMode
  newPageTitle: string
  pages: FormPage[]
  targetPageId: string
}): InsertResult {
  const { fields, mode, newPageTitle, pages, targetPageId } = args
  const newRows: FormRow[] = fields.map((f) => ({ id: nanoid(), columns: [f] }))

  if (mode === 'replace') {
    const page: FormPage = {
      id: nanoid(),
      backButton: 'Back',
      nextButton: 'Next',
      rows: newRows,
      title: 'Page 1',
    }
    return { ok: true, pages: [page] }
  }

  if (mode === 'append') {
    const pageId = targetPageId || pages[0]?.id || ''
    if (!pageId) {
      return { error: 'No page available to append to.', ok: false }
    }
    let updated = pages
    for (const row of newRows) {
      updated = appendRowToPage(updated, pageId, row)
    }
    return { ok: true, pages: updated }
  }

  const page: FormPage = {
    id: nanoid(),
    backButton: 'Back',
    nextButton: 'Next',
    rows: newRows,
    title: newPageTitle.trim() || 'Imported Fields',
  }
  return { ok: true, pages: [...pages, page] }
}
