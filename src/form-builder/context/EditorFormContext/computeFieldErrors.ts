import type { ZodType } from 'zod'

/**
 * Validate `values` against the optional schema and group Zod issue messages by
 * their top-level field key. Returns an empty object when there is no schema or
 * validation passes.
 */
export function computeFieldErrors<T extends object>(
  schema: undefined | ZodType<T>,
  values: T,
): Record<string, string[]> {
  if (!schema) {
    return {}
  }

  const result = schema.safeParse(values)
  if (result.success) {
    return {}
  }

  const errs: Record<string, string[]> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '')
    if (!key) {
      continue
    }
    ;(errs[key] ??= []).push(issue.message)
  }
  return errs
}
