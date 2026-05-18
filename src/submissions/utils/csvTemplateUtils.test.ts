import { describe, expect, it } from 'vitest'

import {
	generateTemplateHeaders,
	parseCsvRowToSubmissionData,
} from './csvTemplateUtils'

// Minimal page factory helpers
const page = (columns: unknown[]) => ({
	id: 'p1',
	rows: [{ id: 'r1', columns }],
	title: 'Page 1',
})

const field = (
	type: string,
	name: string,
	extra: Record<string, unknown> = {},
) => ({
	id: `id-${name}`,
	name,
	type,
	hidden: true,
	label: name,
	required: false,
	...extra,
})

const arrayField = (name: string, subFields: string[], maxRows?: number) => ({
	...field('array', name),
	rows: [{ id: 'ar1', columns: subFields.map((s) => field('text', s)) }],
	...(maxRows !== undefined ? { maxRows } : {}),
})

// ---------------------------------------------------------------------------

describe('generateTemplateHeaders', () => {
	it('includes simple field names in camelCase', () => {
		const headers = generateTemplateHeaders([
			page([field('text', 'full_name'), field('email', 'emailAddress')]),
		])
		expect(headers).toEqual(['fullName', 'emailAddress'])
	})

	it('excludes message fields', () => {
		const headers = generateTemplateHeaders([
			page([
				field('text', 'name'),
				{ id: 'msg1', type: 'message', richText: undefined },
			]),
		])
		expect(headers).not.toContain('message')
		expect(headers).toEqual(['name'])
	})

	it('excludes file fields', () => {
		const headers = generateTemplateHeaders([
			page([field('text', 'name'), field('file', 'attachment')]),
		])
		expect(headers).not.toContain('attachment')
		expect(headers).toEqual(['name'])
	})

	it('expands array field with maxRows=3 into 3 sets of sub-columns', () => {
		const headers = generateTemplateHeaders([
			page([arrayField('followUp', ['reason', 'detail'], 3)]),
		])
		expect(headers).toEqual([
			'followUp.[0].reason',
			'followUp.[0].detail',
			'followUp.[1].reason',
			'followUp.[1].detail',
			'followUp.[2].reason',
			'followUp.[2].detail',
		])
	})

	it('expands array field with no maxRows into 1 set of sub-columns', () => {
		const headers = generateTemplateHeaders([
			page([arrayField('items', ['label'])]),
		])
		expect(headers).toEqual(['items.[0].label'])
	})

	it('expands array field with maxRows=1 into 1 set', () => {
		const headers = generateTemplateHeaders([
			page([arrayField('items', ['label'], 1)]),
		])
		expect(headers).toEqual(['items.[0].label'])
	})

	it('flattens fields across multiple pages and rows', () => {
		const pages = [
			{
				id: 'p1',
				rows: [{ id: 'r1', columns: [field('text', 'name')] }],
				title: 'P1',
			},
			{
				id: 'p2',
				rows: [{ id: 'r2', columns: [field('email', 'email')] }],
				title: 'P2',
			},
		]
		const headers = generateTemplateHeaders(pages)
		expect(headers).toEqual(['name', 'email'])
	})

	it('returns [] for empty pages', () => {
		expect(generateTemplateHeaders([])).toEqual([])
		expect(generateTemplateHeaders(null as never)).toEqual([])
	})
})

// ---------------------------------------------------------------------------

describe('parseCsvRowToSubmissionData', () => {
	it('maps simple fields directly', () => {
		const pages = [page([field('text', 'name'), field('email', 'email')])]
		const row = { name: 'Alice', email: 'alice@example.com', from: 'alice' }
		const data = parseCsvRowToSubmissionData(row, pages)
		expect(data).toEqual({ name: 'Alice', email: 'alice@example.com' })
	})

	it('does not include "from" in submissionData', () => {
		const pages = [page([field('text', 'name')])]
		const data = parseCsvRowToSubmissionData({ name: 'Y', from: 'x' }, pages)
		expect(data).not.toHaveProperty('from')
	})

	it('reconstructs array fields from dot-notation keys', () => {
		const af = arrayField('followUp', ['reason', 'detail'], 2)
		const pages = [page([af])]
		const row = {
			'followUp.[0].detail': 'More detail',
			'followUp.[0].reason': 'Better comms',
			'followUp.[1].detail': '',
			'followUp.[1].reason': '',
		}
		const data = parseCsvRowToSubmissionData(row, pages)
		expect(data).toEqual({
			followUp: [
				{ detail: 'More detail', reason: 'Better comms' },
				{ detail: '', reason: '' },
			],
		})
	})

	it('coerces toggle to boolean', () => {
		const pages = [page([field('toggle', 'agree')])]
		expect(parseCsvRowToSubmissionData({ agree: 'true' }, pages)).toEqual({
			agree: true,
		})
		expect(parseCsvRowToSubmissionData({ agree: 'false' }, pages)).toEqual({
			agree: false,
		})
		expect(parseCsvRowToSubmissionData({ agree: '' }, pages)).toEqual({
			agree: false,
		})
	})

	it('coerces consent to boolean', () => {
		const pages = [page([field('consent', 'gdpr')])]
		expect(parseCsvRowToSubmissionData({ gdpr: 'true' }, pages)).toEqual({
			gdpr: true,
		})
		expect(parseCsvRowToSubmissionData({ gdpr: '1' }, pages)).toEqual({
			gdpr: true,
		})
	})

	it('coerces number fields to number', () => {
		const pages = [page([field('number', 'age')])]
		expect(parseCsvRowToSubmissionData({ age: '42' }, pages)).toEqual({
			age: 42,
		})
		expect(parseCsvRowToSubmissionData({ age: '' }, pages)).toEqual({
			age: null,
		})
	})

	it('splits checkbox values by comma', () => {
		const pages = [page([field('checkbox', 'options')])]
		const data = parseCsvRowToSubmissionData({ options: 'a,b,c' }, pages)
		expect(data).toEqual({ options: ['a', 'b', 'c'] })
	})

	it('returns empty array for empty checkbox', () => {
		const pages = [page([field('checkbox', 'options')])]
		const data = parseCsvRowToSubmissionData({ options: '' }, pages)
		expect(data).toEqual({ options: [] })
	})

	it('round-trips simple form headers back to submissionData', () => {
		const pages = [
			page([
				field('text', 'name'),
				field('email', 'email'),
				field('radio', 'rating'),
			]),
		]
		const row = { name: 'Alice', email: 'a@b.com', from: 'alice', rating: '5' }
		const data = parseCsvRowToSubmissionData(row, pages)
		expect(data).toEqual({ name: 'Alice', email: 'a@b.com', rating: '5' })
	})
})
