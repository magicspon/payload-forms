import type { ArrayRow, Field, TextareaField, TextField } from '@/shared/fieldSchema'

import { camelCase } from '@/shared/utils/camelCase'
import { z } from 'zod'

type BuildFormSchemaInput = {
  fields: Field[]
}

/** Build a Zod object shape from the rows of an array or group field. */
function buildObjectShape(rows: ArrayRow[]): Record<string, z.ZodTypeAny> {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const row of rows) {
    for (const subField of row.columns) {
      const subSchema = fieldToZodSchema(subField)
      if (subSchema) {
        shape[camelCase(subField.name)] = subSchema
      }
    }
  }
  return shape
}

/** Optional min/max length bounds shared by text and textarea fields. */
function withLengthBounds(field: TextareaField | TextField): z.ZodString {
  let s = z.string()
  if (field.minLength) {
    s = s.min(field.minLength)
  }
  if (field.maxLength) {
    s = s.max(field.maxLength)
  }
  return s
}

/**
 * Per-type Zod builders. Keyed by field type so the dispatch lives in data
 * rather than a long switch; the mapped type narrows `field` to the matching
 * variant in each builder. `message` fields produce no input and are omitted.
 */
const SCHEMA_BUILDERS: {
  [K in Exclude<Field['type'], 'message'>]: (field: Extract<Field, { type: K }>) => z.ZodTypeAny
} = {
  array: (field) => {
    let s = z.array(z.object(buildObjectShape(field.rows ?? [])))
    if (field.minRows) {
      s = s.min(field.minRows)
    }
    if (field.maxRows) {
      s = s.max(field.maxRows)
    }
    return s
  },
  checkbox: () => z.array(z.string()),
  consent: () => z.boolean(),
  date: () => z.string(),
  email: () => z.email(),
  // Files are stored as File[] in the form state
  file: () => z.array(z.any()),
  group: (field) => z.object(buildObjectShape(field.rows ?? [])),
  number: (field) => {
    let s = z.number()
    if (field.min !== undefined) {
      s = s.min(field.min)
    }
    if (field.max !== undefined) {
      s = s.max(field.max)
    }
    return s
  },
  radio: (field) => z.enum(field.options.map((o) => o.value) as [string, ...string[]]),
  select: (field) => z.enum(field.options.map((o) => o.value) as [string, ...string[]]),
  text: withLengthBounds,
  textarea: withLengthBounds,
  toggle: () => z.boolean(),
}

function fieldToZodSchema(field: Field): null | z.ZodTypeAny {
  // Message fields don't produce form inputs
  if (field.type === 'message') {
    return null
  }

  const builder = SCHEMA_BUILDERS[field.type] as
    | ((f: typeof field) => z.ZodTypeAny)
    | undefined
  // Unknown/future field types have no builder — skip them silently.
  if (!builder) {
    return null
  }

  const schema = builder(field)
  return field.required ? schema : schema.optional()
}

export function buildFormSchema({ fields }: BuildFormSchemaInput) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    if (field.type === 'message') {
      continue
    }

    const schema = fieldToZodSchema(field)
    if (schema) {
      shape[camelCase(field.name)] = schema
    }
  }

  const zodSchema = z.object(shape)
  return z.toJSONSchema(zodSchema)
}
