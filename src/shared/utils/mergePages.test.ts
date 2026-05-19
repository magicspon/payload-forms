import type { FormPage } from '@/form-builder/utils/formTree'
import type { Field } from '@/shared/fieldSchema'

import { describe, expect, it } from 'vitest'

import { mergePages } from './mergePages'

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function textField(
	id: string,
	label: string,
	extra: Partial<Field> = {},
): Field {
	return {
		id,
		name: id,
		type: 'text',
		hidden: true,
		label,
		placeholder: '',
		required: false,
		...extra,
	} as Field
}

function makePage(
	id: string,
	fields: Field[],
	overrides: Partial<FormPage> = {},
): FormPage {
	return {
		id,
		backButton: 'Back',
		nextButton: 'Next',
		rows: [{ id: `row-${id}`, columns: fields }],
		title: `Page ${id}`,
		...overrides,
	}
}

// Helpers to dig into the result tree without triggering noUncheckedIndexedAccess
// on every single line — we assert non-null once at the access site.
function col(result: FormPage[], pageIdx: number, colIdx = 0): Field {
	return result[pageIdx].rows[0].columns[colIdx]
}

// ─────────────────────────────────────────────────────────────────────────────
// Null / empty locale
// ─────────────────────────────────────────────────────────────────────────────

describe('mergePages — null/empty locale', () => {
	it('returns canonical unchanged when locale is null', () => {
		const canonical = [makePage('p1', [textField('f1', 'Name')])]
		expect(mergePages(canonical, null)).toEqual(canonical)
	})

	it('returns canonical unchanged when locale is undefined', () => {
		const canonical = [makePage('p1', [textField('f1', 'Name')])]
		expect(mergePages(canonical, undefined)).toEqual(canonical)
	})

	it('returns canonical unchanged when locale is empty array', () => {
		const canonical = [makePage('p1', [textField('f1', 'Name')])]
		expect(mergePages(canonical, [])).toEqual(canonical)
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Page-level merge
// ─────────────────────────────────────────────────────────────────────────────

describe('mergePages — page-level strings', () => {
	it('uses locale page title when IDs match', () => {
		const canonical = [makePage('p1', [])]
		const locale = [makePage('p1', [], { title: 'Sida 1' })]
		const result = mergePages(canonical, locale)
		expect(result[0].title).toBe('Sida 1')
	})

	it('uses locale backButton and nextButton when IDs match', () => {
		const canonical = [
			makePage('p1', [], { backButton: 'Back', nextButton: 'Next' }),
		]
		const locale = [
			makePage('p1', [], { backButton: 'Tillbaka', nextButton: 'Nästa' }),
		]
		const result = mergePages(canonical, locale)
		expect(result[0].backButton).toBe('Tillbaka')
		expect(result[0].nextButton).toBe('Nästa')
	})

	it('falls back to canonical title when locale page is absent', () => {
		const canonical = [makePage('p1', []), makePage('p2', [])]
		const locale = [makePage('p1', [], { title: 'Sida 1' })]
		const result = mergePages(canonical, locale)
		expect(result[1].title).toBe('Page p2')
	})

	it('canonical page order is always preserved', () => {
		const canonical = [
			makePage('p1', []),
			makePage('p2', []),
			makePage('p3', []),
		]
		const locale = [
			makePage('p3', [], { title: 'C' }),
			makePage('p1', [], { title: 'A' }),
		]
		const result = mergePages(canonical, locale)
		expect(result.map((p) => p.id)).toEqual(['p1', 'p2', 'p3'])
		expect(result[0].title).toBe('A')
		expect(result[2].title).toBe('C')
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Field-level merge — translatable strings
// ─────────────────────────────────────────────────────────────────────────────

// Non-message fields all have label/required; cast to this shape to avoid
// widening to the full Field union (which includes the label-less message type).
type LabeledField = { label: string; required: boolean; type: string }

describe('mergePages — field translatable strings', () => {
	it('uses locale field label when field IDs match', () => {
		const canonical = [makePage('p1', [textField('f1', 'Name')])]
		const locale = [makePage('p1', [textField('f1', 'Namn')])]
		const result = mergePages(canonical, locale)
		expect((col(result, 0) as LabeledField).label).toBe('Namn')
	})

	it('uses locale field placeholder when field IDs match', () => {
		const canonical = [
			makePage('p1', [textField('f1', 'Name', { placeholder: 'Enter name' })]),
		]
		const locale = [
			makePage('p1', [textField('f1', 'Namn', { placeholder: 'Ange namn' })]),
		]
		const result = mergePages(canonical, locale)
		expect((col(result, 0) as { placeholder?: string }).placeholder).toBe(
			'Ange namn',
		)
	})

	it('falls back to canonical label when locale field is absent', () => {
		const canonical = [
			makePage('p1', [textField('f1', 'Name'), textField('f2', 'Email')]),
		]
		const locale = [makePage('p1', [textField('f1', 'Namn')])]
		const result = mergePages(canonical, locale)
		expect((col(result, 0, 1) as LabeledField).label).toBe('Email')
	})

	it('canonical field structure always wins over locale structure', () => {
		const canonical = [
			makePage('p1', [textField('f1', 'Name', { required: true })]),
		]
		// locale has required: false — should be ignored
		const locale = [
			makePage('p1', [textField('f1', 'Namn', { required: false })]),
		]
		const result = mergePages(canonical, locale)
		expect((col(result, 0) as LabeledField).required).toBe(true)
	})

	it('ignores locale field when types differ', () => {
		const canonical = [makePage('p1', [textField('f1', 'Name')])]
		const locale = [
			makePage('p1', [
				{
					id: 'f1',
					name: 'f1',
					type: 'email',
					hidden: true,
					label: 'Email Locale',
					placeholder: '',
					required: false,
				} as Field,
			]),
		]
		// type mismatch — canonical wins entirely
		const result = mergePages(canonical, locale)
		expect((col(result, 0) as LabeledField).label).toBe('Name')
		expect((col(result, 0) as LabeledField).type).toBe('text')
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Option-bearing fields (radio, checkbox, select)
// ─────────────────────────────────────────────────────────────────────────────

describe('mergePages — option field labels', () => {
	function radioField(
		id: string,
		options: Array<{ label: string; value: string }>,
	): Field {
		return {
			id,
			name: id,
			type: 'radio',
			hidden: true,
			label: id,
			options,
			required: false,
		} as Field
	}

	type WithOptions = { options: Array<{ label: string; value: string }> }

	it('merges locale option labels by value for radio fields', () => {
		const canonical = [
			makePage('p1', [
				radioField('f1', [
					{ label: 'Yes', value: 'yes' },
					{ label: 'No', value: 'no' },
				]),
			]),
		]
		const locale = [
			makePage('p1', [
				radioField('f1', [
					{ label: 'Ja', value: 'yes' },
					{ label: 'Nej', value: 'no' },
				]),
			]),
		]
		const result = mergePages(canonical, locale)
		const opts = (col(result, 0) as WithOptions).options
		expect(opts).toEqual([
			{ label: 'Ja', value: 'yes' },
			{ label: 'Nej', value: 'no' },
		])
	})

	it('falls back to canonical option label when locale option is absent', () => {
		const canonical = [
			makePage('p1', [
				radioField('f1', [
					{ label: 'Yes', value: 'yes' },
					{ label: 'No', value: 'no' },
				]),
			]),
		]
		// locale only has 'yes'
		const locale = [
			makePage('p1', [radioField('f1', [{ label: 'Ja', value: 'yes' }])]),
		]
		const result = mergePages(canonical, locale)
		const opts = (col(result, 0) as WithOptions).options
		expect(opts[1]).toEqual({ label: 'No', value: 'no' })
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Message fields — always use canonical
// ─────────────────────────────────────────────────────────────────────────────

describe('mergePages — message fields', () => {
	it('always uses canonical for message fields regardless of locale', () => {
		const richText = {
			root: {
				type: 'root',
				children: [],
				direction: 'ltr' as const,
				format: '' as const,
				indent: 0,
				version: 1,
			},
		}
		const canonical = [
			makePage('p1', [
				{ id: 'msg1', type: 'message', hidden: true, richText } as Field,
			]),
		]
		const locale = [
			makePage('p1', [
				{
					id: 'msg1',
					type: 'message',
					hidden: true,
					richText: undefined as never,
				} as Field,
			]),
		]
		const result = mergePages(canonical, locale)
		expect((col(result, 0) as { richText: unknown }).richText).toBe(richText)
	})
})
