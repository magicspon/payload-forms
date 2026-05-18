'use client'
import { type FormValidateOrFn } from '@tanstack/react-form'
import { z } from 'zod'
import type { Form as FormData } from '../../payload-types'
import type {
	ArrayItemValue,
	FormFieldValue,
	NamedFieldProps,
} from '@spon/payload-forms/form'
import type { FormField, FormPage, FormValues } from '../types'

export function createZodSchema(
	formSchema: FormData['formSchema'],
): FormValidateOrFn<FormValues> | undefined {
	if (!formSchema || typeof formSchema !== 'object') {
		return undefined
	}

	try {
		return z.fromJSONSchema(
			formSchema as Parameters<typeof z.fromJSONSchema>[0],
		) as unknown as FormValidateOrFn<FormValues>
	} catch {
		return undefined
	}
}

export function getDefaultValues(pages?: FormPage[]): FormValues {
	const values: FormValues = {}

	if (!pages) return values

	for (const page of pages) {
		for (const row of page.rows) {
			for (const col of row.columns) {
				if (col.type === 'message') continue
				if (col.type === 'group') {
					const groupValue: ArrayItemValue = {}
					for (const groupRow of col.rows ?? []) {
						for (const subField of groupRow.columns) {
							if (subField.type === 'checkbox') {
								groupValue[subField.name] = (subField.defaultValue as string[]) ?? []
							} else if (subField.type === 'toggle' || subField.type === 'consent') {
								groupValue[subField.name] = (subField.defaultValue as boolean) ?? false
							} else if ('defaultValue' in subField && subField.defaultValue !== undefined) {
								groupValue[subField.name] = subField.defaultValue as string | number
							} else {
								groupValue[subField.name] = ''
							}
						}
					}
					values[col.name] = groupValue
					continue
				}
				if (col.type === 'array') {
					const minRows = col.minRows ?? 0
					const itemDefaults: ArrayItemValue = {}
					let hasDefaults = false
					for (const row of col.rows ?? []) {
						for (const subField of row.columns) {
							if (subField.type === 'checkbox') {
								const dv = subField.defaultValue ?? []
								itemDefaults[subField.name] = dv
								if (dv.length > 0) hasDefaults = true
							} else if (
								subField.type === 'toggle' ||
								subField.type === 'consent'
							) {
								const dv = subField.defaultValue ?? false
								itemDefaults[subField.name] = dv
								if (dv) hasDefaults = true
							} else if (
								'defaultValue' in subField &&
								subField.defaultValue !== undefined
							) {
								itemDefaults[subField.name] = subField.defaultValue as
									| string
									| number
								hasDefaults = true
							} else {
								itemDefaults[subField.name] = ''
							}
						}
					}
					// Pre-populate at least one row when sub-fields carry defaults,
					// so users see meaningful initial state rather than an empty array.
					const rowCount = hasDefaults ? Math.max(minRows, 1) : minRows
					values[col.name] = Array.from({ length: rowCount }, () => ({
						...itemDefaults,
					})) as ArrayItemValue[]
					continue
				}
				if (col.type === 'checkbox') {
					values[col.name] = col.defaultValue ?? []
				} else if (col.type === 'toggle' || col.type === 'consent') {
					values[col.name] = col.defaultValue ?? false
				} else if ('defaultValue' in col && col.defaultValue !== undefined) {
					values[col.name] = col.defaultValue
				} else {
					values[col.name] = ''
				}
			}
		}
	}
	return values
}

export function isVisible(field: FormField, values: FormValues): boolean {
	if (field.type === 'message') return true
	if (field.hidden === true) return false
	if (!field.conditions) return true
	const { logic, conditions } = field.conditions
	const results = conditions.map(({ field: f, operator, value }: { field: string; operator: string; value?: string | number }) => {
		const fieldValue = values[f]
		return operator === 'equals' ? fieldValue === value : fieldValue !== value
	})
	return logic === 'and' ? results.every(Boolean) : results.some(Boolean)
}

export function extractMessage(error: unknown): string {
	if (typeof error === 'string') return error
	// Standard Schema issues (from Zod form-level validators) arrive as objects
	// with a `message` string rather than as plain strings.
	if (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message: unknown }).message === 'string'
	) {
		return (error as { message: string }).message
	}
	return String(error)
}

function isEmpty(value: FormFieldValue): boolean {
	if (Array.isArray(value)) return value.length === 0
	return (
		value === '' || value === null || value === undefined || value === false
	)
}

/**
 * Pre-parse every field's JSON sub-schema into a Zod type once, keyed by
 * field name. Computed via useMemo so it runs only when formSchema changes.
 */
export function buildValidatorCache(
	formSchema: FormData['formSchema'],
): Map<string, z.ZodTypeAny> {
	const cache = new Map<string, z.ZodTypeAny>()
	const schema = formSchema as { properties?: Record<string, unknown> } | null
	const properties = schema?.properties
	if (!properties) return cache

	for (const [name, subSchema] of Object.entries(properties)) {
		try {
			cache.set(
				name,
				z.fromJSONSchema(subSchema as Parameters<typeof z.fromJSONSchema>[0]),
			)
		} catch {
			// Skip fields whose sub-schema can't be parsed
		}
	}
	return cache
}

export function makeValidator(
	field: NamedFieldProps,
	zodSchema: z.ZodTypeAny | undefined,
) {
	// Always create a validator for required fields, even without a schema.
	if (!zodSchema && !field.required) return undefined

	// Custom required message takes priority for empty values so that
	// field.errorMessage is shown instead of a generic Zod string.
	const requiredMsg = field.errorMessage ?? 'This field is required'

	// TanStack Form passes `{ value: unknown }` — cast internally.
	return ({ value }: { value: unknown }) => {
		const v = value as FormFieldValue
		if (isEmpty(v)) {
			return field.required ? requiredMsg : undefined
		}
		if (!zodSchema) return undefined
		const result = zodSchema.safeParse(v)
		if (result.success) return undefined
		return result.error.issues[0]?.message ?? 'Invalid value'
	}
}

export function errorsToProps(errors: unknown[]) {
	const unique = [...new Set(errors.filter(Boolean).map(extractMessage))]
	return unique.map((message) => ({ message }))
}
