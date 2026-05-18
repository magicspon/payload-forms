import { describe, expect, it, vi } from 'vitest'

import type { FieldType } from '../../../fieldSchema'

import { fieldTypes } from '../../../utils/fieldTypes'

// Stub all editor components to avoid pulling in UI/DnD dependencies in a unit test
vi.mock('../ArrayFieldEditor', () => ({ ArrayFieldEditor: vi.fn() }))
vi.mock('../CheckboxFieldEditor', () => ({ CheckboxFieldEditor: vi.fn() }))
vi.mock('../ConsentFieldEditor', () => ({ ConsentFieldEditor: vi.fn() }))
vi.mock('../DateFieldEditor', () => ({ DateFieldEditor: vi.fn() }))
vi.mock('../EmailFieldEditor', () => ({ EmailFieldEditor: vi.fn() }))
vi.mock('../FileFieldEditor', () => ({ FileFieldEditor: vi.fn() }))
vi.mock('../MessageFieldEditor', () => ({ MessageFieldEditor: vi.fn() }))
vi.mock('../NumberFieldEditor', () => ({ NumberFieldEditor: vi.fn() }))
vi.mock('../RadioFieldEditor', () => ({ RadioFieldEditor: vi.fn() }))
vi.mock('../SelectFieldEditor', () => ({ SelectFieldEditor: vi.fn() }))
vi.mock('../TextFieldEditor', () => ({ TextFieldEditor: vi.fn() }))
vi.mock('../TextareaFieldEditor', () => ({ TextareaFieldEditor: vi.fn() }))
vi.mock('../ToggleFieldEditor', () => ({ ToggleFieldEditor: vi.fn() }))

const allFieldTypes: FieldType[] = fieldTypes.map((f) => f.value)

describe('FieldRenderer renderers map', () => {
	it('has an entry for every FieldType', async () => {
		const { renderers } = await import('./renderers')
		for (const type of allFieldTypes) {
			// satisfies Record<FieldType, unknown> catches this at compile time;
			// this runtime check catches regressions if fieldTypes gains a new entry before renderers does
			expect(renderers).toHaveProperty(type)
		}
	})

	it('every entry is a function (React component)', async () => {
		const { renderers } = await import('./renderers')
		for (const type of allFieldTypes) {
			expect(typeof renderers[type]).toBe('function')
		}
	})
})
