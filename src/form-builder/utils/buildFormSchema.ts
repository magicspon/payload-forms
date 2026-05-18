import type { Field } from '@/shared/fieldSchema'

import { camelCase } from '@/shared/utils/camelCase'
import { z } from 'zod'

type BuildFormSchemaInput = {
	fields: Field[]
}

function fieldToZodSchema(field: Field): null | z.ZodTypeAny {
	// Message fields don't produce form inputs
	if (field.type === 'message') {
		return null
	}

	let schema: z.ZodTypeAny

	switch (field.type) {
		case 'array': {
			const itemShape: Record<string, z.ZodTypeAny> = {}
			for (const row of field.rows ?? []) {
				for (const subField of row.columns) {
					const subSchema = fieldToZodSchema(subField)
					if (subSchema) {
						itemShape[camelCase(subField.name)] = subSchema
					}
				}
			}
			let s = z.array(z.object(itemShape))
			if (field.minRows) {s = s.min(field.minRows)}
			if (field.maxRows) {s = s.max(field.maxRows)}
			schema = s
			break
		}
		case 'checkbox': {
			schema = z.array(z.string())
			break
		}
		case 'consent':
		case 'toggle': {
			schema = z.boolean()
			break
		}
		case 'date': {
			schema = z.string()
			break
		}
		case 'email': {
			schema = z.email()
			break
		}
		case 'file': {
			// Files are stored as File[] in the form state
			schema = z.array(z.any())
			break
		}
		case 'number': {
			let s = z.number()
			if (field.min !== undefined) {s = s.min(field.min)}
			if (field.max !== undefined) {s = s.max(field.max)}
			schema = s
			break
		}
		case 'radio': {
			const values = field.options.map((o) => o.value)
			schema = z.enum(values as [string, ...string[]])
			break
		}
		case 'select': {
			const values = field.options.map((o) => o.value)
			schema = z.enum(values as [string, ...string[]])
			break
		}
		case 'text': {
			let s = z.string()
			if (field.minLength) {s = s.min(field.minLength)}
			if (field.maxLength) {s = s.max(field.maxLength)}
			schema = s
			break
		}
		case 'textarea': {
			let s = z.string()
			if (field.minLength) {s = s.min(field.minLength)}
			if (field.maxLength) {s = s.max(field.maxLength)}
			schema = s
			break
		}
	}

	if (!field.required) {
		schema = schema.optional()
	}

	return schema
}

export function buildFormSchema({ fields }: BuildFormSchemaInput) {
	const shape: Record<string, z.ZodTypeAny> = {}

	for (const field of fields) {
		if (field.type === 'message') {continue}

		const schema = fieldToZodSchema(field)
		if (schema) {
			shape[camelCase(field.name)] = schema
		}
	}

	const zodSchema = z.object(shape)
	return z.toJSONSchema(zodSchema)
}
