/**
 * Serialize an arbitrary submission value to a human-readable string.
 *
 * - Primitive          → String(value)
 * - Array of objects   → each item formatted recursively, joined with "\n"
 * - Array of primitives → joined with ", "
 * - Object (group)     → scalar values joined with ", "
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    if (value.length === 0) return ''
    if (typeof value[0] === 'object' && value[0] !== null) {
      return value.map(formatValue).filter(Boolean).join('\n')
    }
    return (value as unknown[]).map(String).join(', ')
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(formatValue)
      .filter(Boolean)
      .join(', ')
  }
  return String(value as bigint | boolean | number | string)
}

/**
 * Replace {{ fieldName }} placeholders with submission values.
 * Handles whitespace variations: {{name}}, {{ name }}, {{  name  }}
 */
export function replaceTemplatePlaceholders(
  submissionData: Record<string, unknown>,
): (template: string) => string {
  return (template: string) =>
    template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, fieldName) =>
      formatValue(submissionData[fieldName]),
    )
}

export function replaceDataPlaceholders(
  submissionData: Record<string, unknown>,
): <T>(value: T) => T {
  const replaceInString = (str: string): string =>
    str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, fieldName) =>
      formatValue(submissionData[fieldName]),
    )

  const traverse = (value: unknown): unknown => {
    if (typeof value === 'string') return replaceInString(value)
    if (Array.isArray(value)) return value.map(traverse)
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, traverse(v)]),
      )
    }
    return value
  }

  return traverse as <T>(value: T) => T
}
