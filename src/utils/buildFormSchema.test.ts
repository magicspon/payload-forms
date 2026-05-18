import { describe, expect, it } from 'vitest'

import type { ArrayItemField, Field } from '../fieldSchema'

import { createDefaultField } from '../fieldSchema'
import { buildFormSchema } from './buildFormSchema'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function field(
	id: string,
	overrides: { type: Field['type'] } & Partial<Field>,
): Field {
	return { ...createDefaultField(id, overrides.type), ...overrides } as Field
}

// ─────────────────────────────────────────────────────────────────────────────
// buildFormSchema — output shape
// ─────────────────────────────────────────────────────────────────────────────

describe('buildFormSchema', () => {
	it('returns a JSON schema object', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', { name: 'first_name', type: 'text', required: true }),
			],
		})
		expect(typeof schema).toBe('object')
		expect(schema).toHaveProperty('type', 'object')
	})

	it('uses camelCase for property keys', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', { name: 'first_name', type: 'text', required: true }),
			],
		}) as { properties?: Record<string, unknown> }
		expect(schema.properties).toHaveProperty('firstName')
	})

	it('skips message fields', () => {
		const schema = buildFormSchema({
			fields: [
				field('m1', { type: 'message' }),
				field('f1', { name: 'myField', type: 'text', required: true }),
			],
		}) as { properties?: Record<string, unknown> }
		expect(Object.keys(schema.properties ?? {})).toEqual(['myField'])
	})

	it('marks required fields', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'name', type: 'text', required: true })],
		}) as { required?: string[] }
		expect(schema.required).toContain('name')
	})

	it('does not mark optional fields as required', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'bio', type: 'text', required: false })],
		}) as { required?: string[] }
		expect(schema.required ?? []).not.toContain('bio')
	})

	it('returns empty properties for empty fields array', () => {
		const schema = buildFormSchema({ fields: [] }) as {
			properties?: Record<string, unknown>
		}
		expect(schema.properties ?? {}).toEqual({})
	})

	// Per-type property checks
	it('text field produces string type', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'title', type: 'text', required: true })],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['title']?.type).toBe('string')
	})

	it('email field produces string type', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'email', type: 'email', required: true })],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['email']?.type).toBe('string')
	})

	it('number field produces number type', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'age', type: 'number', required: true })],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['age']?.type).toBe('number')
	})

	it('checkbox field produces array type', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'tags',
					type: 'checkbox',
					options: [{ label: 'A', value: 'a' }],
					required: true,
				}),
			],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['tags']?.type).toBe('array')
	})

	it('toggle field produces boolean type', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'agree', type: 'toggle', required: true })],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['agree']?.type).toBe('boolean')
	})

	it('consent field produces boolean type', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'gdpr', type: 'consent', required: true })],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['gdpr']?.type).toBe('boolean')
	})

	it('text minLength is reflected in schema', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'bio',
					type: 'text',
					minLength: 10,
					required: true,
				}),
			],
		}) as { properties?: Record<string, { minLength?: number }> }
		expect(schema.properties?.['bio']?.minLength).toBe(10)
	})

	// ── array field ──────────────────────────────────────────────────────────

	it('array field produces array type with item properties from a single row', () => {
		const arrayField = field('a1', {
			name: 'contacts',
			type: 'array',
			required: true,
			rows: [
				{
					id: 'r1',
					columns: [
						field('s1', { name: 'first_name', type: 'text', required: true }),
						field('s2', {
							name: 'emailAddress',
							type: 'email',
							required: true,
						}),
					] as ArrayItemField[],
				},
			],
		})
		const schema = buildFormSchema({ fields: [arrayField] }) as {
			properties?: Record<
				string,
				{ items?: { properties?: Record<string, unknown> }; type?: string }
			>
		}
		expect(schema.properties?.['contacts']?.type).toBe('array')
		expect(schema.properties?.['contacts']?.items?.properties).toHaveProperty(
			'firstName',
		)
		expect(schema.properties?.['contacts']?.items?.properties).toHaveProperty(
			'emailAddress',
		)
	})

	it('array field collects sub-fields from multiple rows into item properties', () => {
		const arrayField = field('a1', {
			name: 'entries',
			type: 'array',
			required: true,
			rows: [
				{
					id: 'r1',
					columns: [
						field('s1', { name: 'city', type: 'text', required: true }),
						field('s2', { name: 'country', type: 'text', required: true }),
					] as ArrayItemField[],
				},
				{
					id: 'r2',
					columns: [
						field('s3', { name: 'zip_code', type: 'number', required: false }),
					] as ArrayItemField[],
				},
			],
		})
		const schema = buildFormSchema({ fields: [arrayField] }) as {
			properties?: Record<
				string,
				{ items?: { properties?: Record<string, unknown> } }
			>
		}
		const props = schema.properties?.['entries']?.items?.properties ?? {}
		expect(props).toHaveProperty('city')
		expect(props).toHaveProperty('country')
		expect(props).toHaveProperty('zipCode')
	})

	it('array field with no rows produces empty item properties', () => {
		const arrayField = field('a1', {
			name: 'empty',
			type: 'array',
			required: true,
			rows: [],
		})
		const schema = buildFormSchema({ fields: [arrayField] }) as {
			properties?: Record<
				string,
				{ items?: { properties?: Record<string, unknown> } }
			>
		}
		expect(schema.properties?.['empty']?.items?.properties).toEqual({})
	})

	it('array field minRows becomes minItems in JSON schema', () => {
		const arrayField = field('a1', {
			name: 'items',
			type: 'array',
			minRows: 2,
			required: true,
			rows: [],
		})
		const schema = buildFormSchema({ fields: [arrayField] }) as {
			properties?: Record<string, { minItems?: number }>
		}
		expect(schema.properties?.['items']?.minItems).toBe(2)
	})

	it('array field maxRows becomes maxItems in JSON schema', () => {
		const arrayField = field('a1', {
			name: 'items',
			type: 'array',
			maxRows: 5,
			required: true,
			rows: [],
		})
		const schema = buildFormSchema({ fields: [arrayField] }) as {
			properties?: Record<string, { maxItems?: number }>
		}
		expect(schema.properties?.['items']?.maxItems).toBe(5)
	})

	it('optional array field is not in required list', () => {
		const arrayField = field('a1', {
			name: 'extras',
			type: 'array',
			required: false,
			rows: [],
		})
		const schema = buildFormSchema({ fields: [arrayField] }) as {
			required?: string[]
		}
		expect(schema.required ?? []).not.toContain('extras')
	})

	it('number min/max are reflected in schema', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'score',
					type: 'number',
					max: 100,
					min: 0,
					required: true,
				}),
			],
		}) as {
			properties?: Record<string, { maximum?: number; minimum?: number }>
		}
		expect(schema.properties?.['score']?.minimum).toBe(0)
		expect(schema.properties?.['score']?.maximum).toBe(100)
	})

	it('textarea field produces string type', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'bio', type: 'textarea', required: true })],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['bio']?.type).toBe('string')
	})

	it('textarea minLength is reflected in schema', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'bio',
					type: 'textarea',
					minLength: 5,
					required: true,
				}),
			],
		}) as { properties?: Record<string, { minLength?: number }> }
		expect(schema.properties?.['bio']?.minLength).toBe(5)
	})

	it('textarea maxLength is reflected in schema', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'bio',
					type: 'textarea',
					maxLength: 500,
					required: true,
				}),
			],
		}) as { properties?: Record<string, { maxLength?: number }> }
		expect(schema.properties?.['bio']?.maxLength).toBe(500)
	})

	it('text maxLength is reflected in schema', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'summary',
					type: 'text',
					maxLength: 200,
					required: true,
				}),
			],
		}) as { properties?: Record<string, { maxLength?: number }> }
		expect(schema.properties?.['summary']?.maxLength).toBe(200)
	})

	it('radio field produces enum type with correct values', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'status',
					type: 'radio',
					options: [
						{ label: 'Active', value: 'active' },
						{ label: 'Inactive', value: 'inactive' },
					],
					required: true,
				}),
			],
		}) as { properties?: Record<string, { enum?: string[] }> }
		expect(schema.properties?.['status']?.enum).toEqual(['active', 'inactive'])
	})

	it('select field produces enum type with correct values', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'colour',
					type: 'select',
					options: [
						{ label: 'Red', value: 'red' },
						{ label: 'Blue', value: 'blue' },
					],
					required: true,
				}),
			],
		}) as { properties?: Record<string, { enum?: string[] }> }
		expect(schema.properties?.['colour']?.enum).toEqual(['red', 'blue'])
	})

	it('optional radio field is not in required list', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', {
					name: 'priority',
					type: 'radio',
					options: [{ label: 'Low', value: 'low' }],
					required: false,
				}),
			],
		}) as { required?: string[] }
		expect(schema.required ?? []).not.toContain('priority')
	})

	it('date field produces string type', () => {
		const schema = buildFormSchema({
			fields: [field('f1', { name: 'dob', type: 'date', required: true })],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['dob']?.type).toBe('string')
	})

	it('file field produces array type', () => {
		const schema = buildFormSchema({
			fields: [
				field('f1', { name: 'attachments', type: 'file', required: true }),
			],
		}) as { properties?: Record<string, { type?: string }> }
		expect(schema.properties?.['attachments']?.type).toBe('array')
	})

	it('unknown field type is skipped silently', () => {
		const schema = buildFormSchema({
			fields: [
				// Cast to never to simulate a future unknown type not in the switch
				{ ...field('f1', { name: 'known', type: 'text', required: true }) },
				{
					id: 'f2',
					name: 'mystery',
					type: 'unknown_future_type',
					required: true,
				} as never,
			],
		}) as { properties?: Record<string, unknown> }
		expect(Object.keys(schema.properties ?? {})).toEqual(['known'])
	})
})
