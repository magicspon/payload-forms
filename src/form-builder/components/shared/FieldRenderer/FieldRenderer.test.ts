import type { FieldType } from '@/shared/fieldSchema'

import { fieldTypes } from '@/form-builder/utils/fieldTypes'
import { describe, expect, it, vi } from 'vitest'

// Stub all editor components to avoid pulling in UI/DnD dependencies in a unit test
vi.mock('@/form-builder/components/fields/ArrayFieldEditor', () => ({ ArrayFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/GroupFieldEditor', () => ({ GroupFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/CheckboxFieldEditor', () => ({ CheckboxFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/ConsentFieldEditor', () => ({ ConsentFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/DateFieldEditor', () => ({ DateFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/EmailFieldEditor', () => ({ EmailFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/FileFieldEditor', () => ({ FileFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/MessageFieldEditor', () => ({ MessageFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/NumberFieldEditor', () => ({ NumberFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/RadioFieldEditor', () => ({ RadioFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/SelectFieldEditor', () => ({ SelectFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/TextFieldEditor', () => ({ TextFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/TextareaFieldEditor', () => ({ TextareaFieldEditor: vi.fn() }))
vi.mock('@/form-builder/components/fields/ToggleFieldEditor', () => ({ ToggleFieldEditor: vi.fn() }))

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
