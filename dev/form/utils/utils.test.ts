import { describe, expect, it } from 'vitest'
import {
	buildValidatorCache,
	errorsToProps,
	getDefaultValues,
	isVisible,
	makeValidator,
} from '.'
import type { FormField, FormPage } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTextField(
	overrides: Partial<{
		name: string
		required: boolean
		errorMessage: string
		maxLength: number
		minLength: number
	}> = {},
) {
	return {
		id: 'f1',
		type: 'text' as const,
		name: overrides.name ?? 'firstName',
		label: 'First Name',
		required: overrides.required ?? false,
		errorMessage: overrides.errorMessage,
		maxLength: overrides.maxLength,
		minLength: overrides.minLength,
		hidden: false,
	}
}

// ---------------------------------------------------------------------------
// makeValidator
// ---------------------------------------------------------------------------

describe('makeValidator', () => {
	it('returns undefined when field is not required and no schema', () => {
		const field = makeTextField({ required: false })
		expect(makeValidator(field, undefined)).toBeUndefined()
	})

	it('returns a validator when field is required, even with no schema', () => {
		const field = makeTextField({ required: true })
		expect(makeValidator(field, undefined)).toBeTypeOf('function')
	})

	it('returns required error for empty string on required field (no schema)', () => {
		const field = makeTextField({ required: true })
		const validate = makeValidator(field, undefined)!
		expect(validate({ value: '' })).toBe('This field is required')
	})

	it('uses field.errorMessage as the required error', () => {
		const field = makeTextField({
			required: true,
			errorMessage: 'Name is needed',
		})
		const validate = makeValidator(field, undefined)!
		expect(validate({ value: '' })).toBe('Name is needed')
	})

	it('returns undefined for empty value on optional field with schema', () => {
		const { z } = require('zod')
		const schema = z.string().min(2).max(50)
		const field = makeTextField({ required: false })
		const validate = makeValidator(field, schema)!
		expect(validate({ value: '' })).toBeUndefined()
	})

	it('returns undefined when value passes schema validation', () => {
		const { z } = require('zod')
		const schema = z.string().min(2).max(50)
		const field = makeTextField({ required: false })
		const validate = makeValidator(field, schema)!
		expect(validate({ value: 'Alice' })).toBeUndefined()
	})

	it('returns a Zod error message when value fails schema', () => {
		const { z } = require('zod')
		const schema = z.string().min(2).max(50)
		const field = makeTextField({ required: false })
		const validate = makeValidator(field, schema)!
		const result = validate({ value: 'A' })
		expect(result).toBeTypeOf('string')
		expect(result).not.toBeUndefined()
	})

	it('returns required error (not Zod) for empty value on required field with schema', () => {
		const { z } = require('zod')
		const schema = z.string().min(2).max(50)
		const field = makeTextField({ required: true, errorMessage: 'Required!' })
		const validate = makeValidator(field, schema)!
		expect(validate({ value: '' })).toBe('Required!')
	})

	it('treats null as empty for required check', () => {
		const field = makeTextField({ required: true })
		const validate = makeValidator(field, undefined)!
		expect(validate({ value: null })).toBe('This field is required')
	})

	it('treats empty array as empty for required check', () => {
		const field = makeTextField({ required: true })
		const validate = makeValidator(field, undefined)!
		expect(validate({ value: [] })).toBe('This field is required')
	})

	it('treats false as empty for required check', () => {
		const field = makeTextField({ required: true })
		const validate = makeValidator(field, undefined)!
		expect(validate({ value: false })).toBe('This field is required')
	})
})

// ---------------------------------------------------------------------------
// buildValidatorCache
// ---------------------------------------------------------------------------

describe('buildValidatorCache', () => {
	it('returns empty map for null/undefined formSchema', () => {
		expect(buildValidatorCache(null).size).toBe(0)
		expect(buildValidatorCache(undefined).size).toBe(0)
	})

	it('returns empty map when properties are missing', () => {
		expect(buildValidatorCache({}).size).toBe(0)
	})

	it('parses valid JSON Schema properties into Zod validators', () => {
		const schema = {
			type: 'object',
			properties: {
				firstName: { type: 'string', minLength: 2, maxLength: 50 },
				age: { type: 'number', minimum: 0 },
			},
		}
		const cache = buildValidatorCache(schema)
		expect(cache.has('firstName')).toBe(true)
		expect(cache.has('age')).toBe(true)
	})

	it('silently skips properties with invalid sub-schemas', () => {
		const schema = {
			type: 'object',
			properties: {
				good: { type: 'string' },
				bad: { type: 'INVALID_TYPE_THAT_DOES_NOT_EXIST' },
			},
		}
		// Should not throw; may skip 'bad' or include it — just mustn't throw
		expect(() => buildValidatorCache(schema)).not.toThrow()
	})
})

// ---------------------------------------------------------------------------
// isVisible
// ---------------------------------------------------------------------------

describe('isVisible', () => {
	const textField: FormField = {
		id: 'f1',
		type: 'text',
		name: 'email',
		label: 'Email',
		required: false,
		hidden: false,
	}

	it('returns true when field has no conditions', () => {
		expect(isVisible(textField, {})).toBe(true)
	})

	it('returns false when hidden is explicitly true (hidden)', () => {
		expect(isVisible({ ...textField, hidden: true }, {})).toBe(false)
	})

	it('returns true for message fields regardless of conditions', () => {
		const msg: FormField = { id: 'm1', type: 'message' }
		expect(isVisible(msg, {})).toBe(true)
	})

	it('shows field when "equals" condition matches (and logic)', () => {
		const field: FormField = {
			...textField,
			conditions: {
				logic: 'and',
				conditions: [{ field: 'type', operator: 'equals', value: 'email' }],
			},
		}
		expect(isVisible(field, { type: 'email' })).toBe(true)
		expect(isVisible(field, { type: 'phone' })).toBe(false)
	})

	it('shows field when "notEquals" condition matches (and logic)', () => {
		const field: FormField = {
			...textField,
			conditions: {
				logic: 'and',
				conditions: [{ field: 'type', operator: 'notEquals', value: 'phone' }],
			},
		}
		expect(isVisible(field, { type: 'email' })).toBe(true)
		expect(isVisible(field, { type: 'phone' })).toBe(false)
	})

	it('shows field when at least one condition matches (or logic)', () => {
		const field: FormField = {
			...textField,
			conditions: {
				logic: 'or',
				conditions: [
					{ field: 'a', operator: 'equals', value: '1' },
					{ field: 'b', operator: 'equals', value: '2' },
				],
			},
		}
		expect(isVisible(field, { a: '1', b: 'x' })).toBe(true)
		expect(isVisible(field, { a: 'x', b: '2' })).toBe(true)
		expect(isVisible(field, { a: 'x', b: 'x' })).toBe(false)
	})

	it('hides field when not all conditions match (and logic)', () => {
		const field: FormField = {
			...textField,
			conditions: {
				logic: 'and',
				conditions: [
					{ field: 'a', operator: 'equals', value: '1' },
					{ field: 'b', operator: 'equals', value: '2' },
				],
			},
		}
		expect(isVisible(field, { a: '1', b: '2' })).toBe(true)
		expect(isVisible(field, { a: '1', b: 'x' })).toBe(false)
	})
})

// ---------------------------------------------------------------------------
// getDefaultValues
// ---------------------------------------------------------------------------

describe('getDefaultValues', () => {
	function makePage(fields: FormField[]): FormPage {
		return {
			id: 'p1',
			title: 'Page 1',
			rows: [{ id: 'r1', columns: fields }],
		}
	}

	it('defaults text fields to empty string', () => {
		const pages = [makePage([makeTextField({ name: 'firstName' })])]
		expect(getDefaultValues(pages)).toEqual({ firstName: '' })
	})

	it('uses field defaultValue when present', () => {
		const field = { ...makeTextField({ name: 'city' }), defaultValue: 'London' }
		expect(getDefaultValues([makePage([field])])).toEqual({ city: 'London' })
	})

	it('defaults checkbox fields to empty array', () => {
		const field: FormField = {
			id: 'f1',
			type: 'checkbox',
			name: 'interests',
			label: 'Interests',
			required: false,
			options: [],
			hidden: false,
		}
		expect(getDefaultValues([makePage([field])])).toEqual({ interests: [] })
	})

	it('defaults toggle fields to false', () => {
		const field: FormField = {
			id: 'f1',
			type: 'toggle',
			name: 'subscribe',
			label: 'Subscribe',
			required: false,
			hidden: false,
		}
		expect(getDefaultValues([makePage([field])])).toEqual({ subscribe: false })
	})

	it('defaults consent fields to false', () => {
		const field: FormField = {
			id: 'f1',
			type: 'consent',
			name: 'terms',
			label: 'Terms',
			required: false,
			hidden: false,
		}
		expect(getDefaultValues([makePage([field])])).toEqual({ terms: false })
	})

	it('skips message fields', () => {
		const msg: FormField = { id: 'm1', type: 'message' }
		expect(getDefaultValues([makePage([msg])])).toEqual({})
	})

	it('collects fields across multiple pages and rows', () => {
		const page1: FormPage = {
			id: 'p1',
			title: 'P1',
			rows: [
				{ id: 'r1', columns: [makeTextField({ name: 'a' })] },
				{ id: 'r2', columns: [makeTextField({ name: 'b' })] },
			],
		}
		const page2: FormPage = {
			id: 'p2',
			title: 'P2',
			rows: [{ id: 'r3', columns: [makeTextField({ name: 'c' })] }],
		}
		expect(getDefaultValues([page1, page2])).toEqual({ a: '', b: '', c: '' })
	})

	// ── array field ──────────────────────────────────────────────────────────
	// Sub-fields live inside rows[].columns (same structure as root-level form)

	it('defaults array field with no minRows to empty array', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'contacts',
			label: 'Contacts',
			required: false,
			hidden: false,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'name',
							label: 'Name',
							required: false,
							hidden: false,
						},
						{
							id: 's2',
							type: 'email',
							name: 'email',
							label: 'Email',
							required: false,
							hidden: false,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({ contacts: [] })
	})

	it('pre-populates minRows items with sub-field defaults', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'contacts',
			label: 'Contacts',
			required: false,
			hidden: false,
			minRows: 2,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'name',
							label: 'Name',
							required: false,
							hidden: false,
						},
						{
							id: 's2',
							type: 'email',
							name: 'email',
							label: 'Email',
							required: false,
							hidden: false,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			contacts: [
				{ name: '', email: '' },
				{ name: '', email: '' },
			],
		})
	})

	it('uses sub-field defaultValue when set', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'items',
			label: 'Items',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'city',
							label: 'City',
							required: false,
							hidden: false,
							defaultValue: 'London',
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			items: [{ city: 'London' }],
		})
	})

	it('defaults checkbox sub-fields to empty array', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'checkbox',
							name: 'tags',
							label: 'Tags',
							required: false,
							hidden: false,
							options: [],
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ tags: [] }],
		})
	})

	it('defaults toggle sub-fields to false', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'toggle',
							name: 'active',
							label: 'Active',
							required: false,
							hidden: false,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ active: false }],
		})
	})

	it('defaults consent sub-fields to false', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'consent',
							name: 'agreed',
							label: 'Agreed',
							required: false,
							hidden: false,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ agreed: false }],
		})
	})

	it('each pre-populated row is an independent object', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'items',
			label: 'Items',
			required: false,
			hidden: false,
			minRows: 2,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'val',
							label: 'Val',
							required: false,
							hidden: false,
						},
					],
				},
			],
		}
		const result = getDefaultValues([makePage([field])])
		const items = result.items as Array<{ val: string }>
		items[0]!.val = 'mutated'
		expect(items[1]!.val).toBe('')
	})

	it('handles array field with no rows', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'empty',
			label: 'Empty',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			empty: [{}],
		})
	})

	it('collects sub-fields across multiple rows into each item', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'contacts',
			label: 'Contacts',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'first',
							label: 'First',
							required: false,
							hidden: false,
						},
						{
							id: 's2',
							type: 'text',
							name: 'last',
							label: 'Last',
							required: false,
							hidden: false,
						},
					],
				},
				{
					id: 'r2',
					columns: [
						{
							id: 's3',
							type: 'email',
							name: 'email',
							label: 'Email',
							required: false,
							hidden: false,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			contacts: [{ first: '', last: '', email: '' }],
		})
	})

	it('uses checkbox sub-field defaultValue when set', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'checkbox',
							name: 'tags',
							label: 'Tags',
							required: false,
							hidden: false,
							options: [],
							defaultValue: ['a', 'b'],
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ tags: ['a', 'b'] }],
		})
	})

	it('uses toggle sub-field defaultValue when set to true', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'toggle',
							name: 'active',
							label: 'Active',
							required: false,
							hidden: false,
							defaultValue: true,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ active: true }],
		})
	})

	it('uses consent sub-field defaultValue when set to true', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'consent',
							name: 'agreed',
							label: 'Agreed',
							required: false,
							hidden: false,
							defaultValue: true,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ agreed: true }],
		})
	})

	it('uses number sub-field defaultValue when set', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 1,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'number',
							name: 'quantity',
							label: 'Quantity',
							required: false,
							hidden: false,
							defaultValue: 5,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ quantity: 5 }],
		})
	})

	it('pre-populates one row when minRows is 0 but sub-fields have a text defaultValue', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'items',
			label: 'Items',
			required: false,
			hidden: false,
			minRows: 0,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'city',
							label: 'City',
							required: false,
							hidden: false,
							defaultValue: 'London',
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			items: [{ city: 'London' }],
		})
	})

	it('pre-populates one row when minRows is undefined but sub-fields have a defaultValue', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'items',
			label: 'Items',
			required: false,
			hidden: false,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'number',
							name: 'qty',
							label: 'Qty',
							required: false,
							hidden: false,
							defaultValue: 3,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			items: [{ qty: 3 }],
		})
	})

	it('pre-populates one row when minRows is 0 and a toggle sub-field defaults to true', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 0,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'toggle',
							name: 'active',
							label: 'Active',
							required: false,
							hidden: false,
							defaultValue: true,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ active: true }],
		})
	})

	it('pre-populates one row when minRows is 0 and a checkbox sub-field has default values', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'entries',
			label: 'Entries',
			required: false,
			hidden: false,
			minRows: 0,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'checkbox',
							name: 'roles',
							label: 'Roles',
							required: false,
							hidden: false,
							options: [{ label: 'Admin', value: 'admin' }],
							defaultValue: ['admin'],
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			entries: [{ roles: ['admin'] }],
		})
	})

	it('still returns empty array when minRows is 0 and no sub-fields have defaultValue', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'contacts',
			label: 'Contacts',
			required: false,
			hidden: false,
			minRows: 0,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'name',
							label: 'Name',
							required: false,
							hidden: false,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({ contacts: [] })
	})

	it('respects minRows > 1 even when sub-fields have no defaultValue', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'contacts',
			label: 'Contacts',
			required: false,
			hidden: false,
			minRows: 3,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'name',
							label: 'Name',
							required: false,
							hidden: false,
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			contacts: [{ name: '' }, { name: '' }, { name: '' }],
		})
	})

	it('handles mixed sub-field defaults across multiple pre-populated rows', () => {
		const field: FormField = {
			id: 'f1',
			type: 'array',
			name: 'contacts',
			label: 'Contacts',
			required: false,
			hidden: false,
			minRows: 2,
			rows: [
				{
					id: 'r1',
					columns: [
						{
							id: 's1',
							type: 'text',
							name: 'name',
							label: 'Name',
							required: false,
							hidden: false,
							defaultValue: 'Anonymous',
						},
						{
							id: 's2',
							type: 'toggle',
							name: 'active',
							label: 'Active',
							required: false,
							hidden: false,
							defaultValue: true,
						},
					],
				},
				{
					id: 'r2',
					columns: [
						{
							id: 's3',
							type: 'checkbox',
							name: 'roles',
							label: 'Roles',
							required: false,
							hidden: false,
							options: [],
							defaultValue: ['viewer'],
						},
					],
				},
			],
		}
		expect(getDefaultValues([makePage([field])])).toEqual({
			contacts: [
				{ name: 'Anonymous', active: true, roles: ['viewer'] },
				{ name: 'Anonymous', active: true, roles: ['viewer'] },
			],
		})
	})
})

// ---------------------------------------------------------------------------
// errorsToProps
// ---------------------------------------------------------------------------

describe('errorsToProps', () => {
	it('maps string errors to { message } objects', () => {
		expect(errorsToProps(['Required', 'Too short'])).toEqual([
			{ message: 'Required' },
			{ message: 'Too short' },
		])
	})

	it('deduplicates identical errors', () => {
		expect(errorsToProps(['Required', 'Required'])).toEqual([
			{ message: 'Required' },
		])
	})

	it('filters out falsy values', () => {
		expect(errorsToProps([null, undefined, '', 'Valid error'])).toEqual([
			{ message: 'Valid error' },
		])
	})

	it('extracts message from error objects', () => {
		expect(errorsToProps([{ message: 'Invalid format' }])).toEqual([
			{ message: 'Invalid format' },
		])
	})

	it('returns empty array for empty input', () => {
		expect(errorsToProps([])).toEqual([])
	})
})
