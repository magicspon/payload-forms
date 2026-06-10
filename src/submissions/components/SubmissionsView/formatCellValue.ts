import type { FieldType } from '@/shared/fieldSchema'

/**
 * Display descriptor for a submission table cell. Keeps the value → display
 * decision (branching on field type) separate from the JSX rendering so the
 * logic is unit-testable without a DOM:
 *   - `badge` — render inside a Badge pill
 *   - `text`  — render the string as-is
 *   - `raw`   — pass the original value straight through
 */
export type CellDisplay =
  | { kind: 'badge'; text: string }
  | { kind: 'raw'; value: unknown }
  | { kind: 'text'; text: string }

/** Pluralise a count as a badge, e.g. `1 item` / `2 items`. */
function countBadge(count: number, singular: string): CellDisplay {
  return { kind: 'badge', text: `${count} ${count === 1 ? singular : `${singular}s`}` }
}

/** Display for a `file`-type value: an array of files, a single file object, or neither. */
function formatFileValue(value: unknown): CellDisplay {
  if (Array.isArray(value)) {
    return countBadge(value.length, 'file')
  }
  if (typeof value === 'object') {
    const filename = (value as Record<string, unknown>).filename as string
    return filename ? { kind: 'text', text: filename } : { kind: 'badge', text: '1 file' }
  }
  return { kind: 'text', text: '—' }
}

/** Classify a submission value into how it should be displayed for its field type. */
export function formatCellValue(value: unknown, type: FieldType): CellDisplay {
  if (value === undefined || value === null) {
    return { kind: 'text', text: '—' }
  }

  switch (type) {
    case 'array':
      return countBadge(Array.isArray(value) ? value.length : 0, 'item')
    case 'group':
      return { kind: 'badge', text: 'Group' }
    case 'file':
      return formatFileValue(value)
    case 'toggle':
    case 'consent':
      return { kind: 'text', text: value ? 'Yes' : 'No' }
    case 'checkbox':
      return { kind: 'text', text: Array.isArray(value) ? value.join(', ') || '—' : '—' }
    default:
      return { kind: 'raw', value }
  }
}
