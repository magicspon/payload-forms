import { describe, expect, it } from 'vitest'

import {
	createDefaultField,
	fieldSchema,
	formSchema,
} from './fieldSchema'

describe('optionSchema label is a plain string', () => {
	it('checkbox field option label is a string', () => {
		const field = createDefaultField('id-1', 'checkbox')
		if (field.type !== 'checkbox') {throw new Error('unexpected type')}
		expect(typeof field.options[0]?.label).toBe('string')
	})
})

describe('placeholder is a plain string', () => {
	for (const type of [
		'text',
		'textarea',
		'email',
		'number',
		'date',
		'select',
	] as const) {
		it(`${type} field placeholder is a string`, () => {
			const field = createDefaultField('id-1', type)
			if (!('placeholder' in field)) {throw new Error('no placeholder')}
			expect(typeof field.placeholder).toBe('string')
		})
	}
})

describe('formSchema page strings are plain strings', () => {
	it('accepts pages with plain string title/backButton/nextButton', () => {
		const result = formSchema.parse({
			pages: [
				{
					id: 'p1',
					backButton: 'Back',
					nextButton: 'Next',
					rows: [],
					title: 'Page 1',
				},
			],
		})
		expect(result.pages[0]?.title).toBe('Page 1')
	})
})

describe('fieldSchema round-trip', () => {
	it('parses a text field with plain string placeholder', () => {
		const raw = {
			id: 'f1',
			name: 'first_name',
			type: 'text',
			hidden: false,
			label: 'First Name',
			placeholder: 'Enter your name',
			required: false,
		}
		const parsed = fieldSchema.parse(raw)
		if (parsed.type !== 'text') {throw new Error('unexpected type')}
		expect(parsed.placeholder).toBe('Enter your name')
	})

	it('parses a select field with plain string option labels', () => {
		const raw = {
			id: 'f2',
			name: 'rating',
			type: 'select',
			hidden: false,
			label: 'Rating',
			options: [{ label: 'Good', value: 'good' }],
			required: true,
		}
		const parsed = fieldSchema.parse(raw)
		if (parsed.type !== 'select') {throw new Error('unexpected type')}
		expect((parsed.options[0]).label).toBe('Good')
	})
})
