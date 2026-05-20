import type { ArrayFieldProps } from '@spon/payload-forms/form'
import { z } from 'zod'

export type SubFieldConfig = NonNullable<
  NonNullable<ArrayFieldProps['rows']>[number]['columns']
>[number]

export function subFieldZodSchema(subField: SubFieldConfig): z.ZodTypeAny | undefined {
  let schema: z.ZodTypeAny

  switch (subField.type) {
    case 'text':
    case 'textarea': {
      let s = z.string()
      if (subField.minLength) s = s.min(subField.minLength)
      if (subField.maxLength) s = s.max(subField.maxLength)
      schema = s
      break
    }
    case 'email':
      schema = z.email()
      break
    case 'number': {
      let s = z.number()
      if (subField.min !== undefined) s = s.min(subField.min)
      if (subField.max !== undefined) s = s.max(subField.max)
      schema = s
      break
    }
    case 'checkbox':
      schema = z.array(z.string())
      break
    case 'radio':
    case 'select': {
      const values = (subField.options ?? []).map((o) => o.value)
      if (values.length === 0) return undefined
      schema = z.enum(values as [string, ...string[]])
      break
    }
    case 'date':
      schema = z.string()
      break
    case 'file':
      schema = z.array(z.any())
      break
    case 'toggle':
    case 'consent':
      schema = z.boolean()
      break
    default:
      return undefined
  }

  return subField.required ? schema : schema.optional()
}
