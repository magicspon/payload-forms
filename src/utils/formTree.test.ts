import { describe, expect, it } from 'vitest'

import type { TextField } from '../fieldSchema'
import type { FormPage, FormRow } from './formTree'

import { createDefaultField } from '../fieldSchema'
import {
	appendFieldToRow,
	appendRowToPage,
	findField,
	findPage,
	findRow,
	getAllFields,
	insertFieldAfter,
	insertFieldBefore,
	insertRowAfter,
	insertRowAtIndex,
	insertRowBefore,
	moveField,
	moveRow,
	prependFieldToRow,
	removeField,
	removePage,
	removeRow,
	reorderFields,
	reorderRows,
	replaceField,
	updateField,
	updatePage,
	updateRow,
} from './formTree'

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

function makeField(id: string) {
	return { ...createDefaultField(id, 'text'), id, name: id }
}

function makeRow(id: string, ...fieldIds: string[]): FormRow {
	return { id, columns: fieldIds.map(makeField) }
}

function makePage(id: string, ...rows: FormRow[]): FormPage {
	return {
		id,
		backButton: 'Back',
		nextButton: 'Next',
		rows,
		title: id,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Find
// ─────────────────────────────────────────────────────────────────────────────

describe('findPage', () => {
	it('returns the matching page', () => {
		const pages = [makePage('p1'), makePage('p2')]
		expect(findPage(pages, 'p2')?.id).toBe('p2')
	})
	it('returns undefined when not found', () => {
		expect(findPage([makePage('p1')], 'nope')).toBeUndefined()
	})
})

describe('findRow', () => {
	it('returns page + row when found', () => {
		const row = makeRow('r1')
		const pages = [makePage('p1', row)]
		const result = findRow(pages, 'r1')
		expect(result?.row.id).toBe('r1')
		expect(result?.page.id).toBe('p1')
	})
	it('returns undefined when not found', () => {
		expect(findRow([makePage('p1')], 'nope')).toBeUndefined()
	})
})

describe('findField', () => {
	it('returns page + row + field when found', () => {
		const row = makeRow('r1', 'f1', 'f2')
		const pages = [makePage('p1', row)]
		const result = findField(pages, 'f2')
		expect(result?.field.id).toBe('f2')
		expect(result?.row.id).toBe('r1')
		expect(result?.page.id).toBe('p1')
	})
	it('returns undefined when not found', () => {
		expect(findField([makePage('p1', makeRow('r1'))], 'nope')).toBeUndefined()
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Remove
// ─────────────────────────────────────────────────────────────────────────────

describe('removePage', () => {
	it('removes the specified page', () => {
		const pages = [makePage('p1'), makePage('p2')]
		const result = removePage(pages, 'p1')
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe('p2')
	})
	it('is a no-op when id not found', () => {
		const pages = [makePage('p1')]
		expect(removePage(pages, 'nope')).toHaveLength(1)
	})
})

describe('removeRow', () => {
	it('removes the row from its page', () => {
		const pages = [makePage('p1', makeRow('r1'), makeRow('r2'))]
		const result = removeRow(pages, 'r1')
		expect(result[0].rows).toHaveLength(1)
		expect(result[0].rows[0].id).toBe('r2')
	})
	it('does not mutate original pages', () => {
		const pages = [makePage('p1', makeRow('r1'))]
		removeRow(pages, 'r1')
		expect(pages[0].rows).toHaveLength(1)
	})
})

describe('removeField', () => {
	it('removes the field from its row', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1', 'f2'))]
		const result = removeField(pages, 'f1')
		expect(result[0].rows[0].columns).toHaveLength(1)
		expect(result[0].rows[0].columns[0].id).toBe('f2')
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Row inserts
// ─────────────────────────────────────────────────────────────────────────────

describe('insertRowBefore', () => {
	it('inserts the new row before the target', () => {
		const r1 = makeRow('r1')
		const r2 = makeRow('r2')
		const newRow = makeRow('new')
		const pages = [makePage('p1', r1, r2)]
		const result = insertRowBefore(pages, 'r2', newRow)
		const rows = result[0].rows
		expect(rows.map((r) => r.id)).toEqual(['r1', 'new', 'r2'])
	})
})

describe('insertRowAfter', () => {
	it('inserts the new row after the target', () => {
		const r1 = makeRow('r1')
		const r2 = makeRow('r2')
		const newRow = makeRow('new')
		const pages = [makePage('p1', r1, r2)]
		const result = insertRowAfter(pages, 'r1', newRow)
		const rows = result[0].rows
		expect(rows.map((r) => r.id)).toEqual(['r1', 'new', 'r2'])
	})
})

describe('insertRowAtIndex', () => {
	it('inserts at the given index', () => {
		const pages = [makePage('p1', makeRow('r1'), makeRow('r2'))]
		const newRow = makeRow('new')
		const result = insertRowAtIndex(pages, 1, newRow)
		expect(result[0].rows.map((r) => r.id)).toEqual(['r1', 'new', 'r2'])
	})
	it('inserts at index 0', () => {
		const pages = [makePage('p1', makeRow('r1'))]
		const newRow = makeRow('new')
		const result = insertRowAtIndex(pages, 0, newRow)
		expect(result[0].rows[0].id).toBe('new')
	})
	it('creates a row with generated id when none provided', () => {
		const pages = [makePage('p1')]
		const result = insertRowAtIndex(pages, 0)
		expect(result[0].rows).toHaveLength(1)
		expect(result[0].rows[0].id).toBeTruthy()
	})
})

describe('appendRowToPage', () => {
	it('appends row to matching page', () => {
		const pages = [makePage('p1', makeRow('r1')), makePage('p2')]
		const newRow = makeRow('new')
		const result = appendRowToPage(pages, 'p1', newRow)
		expect(result[0].rows.map((r) => r.id)).toEqual(['r1', 'new'])
		expect(result[1].rows).toHaveLength(0)
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Field inserts
// ─────────────────────────────────────────────────────────────────────────────

describe('insertFieldBefore', () => {
	it('inserts field before the target', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1', 'f2'))]
		const result = insertFieldBefore(pages, 'f2', makeField('new'))
		expect(result[0].rows[0].columns.map((f) => f.id)).toEqual([
			'f1',
			'new',
			'f2',
		])
	})
})

describe('insertFieldAfter', () => {
	it('inserts field after the target', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1', 'f2'))]
		const result = insertFieldAfter(pages, 'f1', makeField('new'))
		expect(result[0].rows[0].columns.map((f) => f.id)).toEqual([
			'f1',
			'new',
			'f2',
		])
	})
})

describe('appendFieldToRow', () => {
	it('appends field to matching row', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1'))]
		const result = appendFieldToRow(pages, 'r1', makeField('f2'))
		expect(result[0].rows[0].columns.map((f) => f.id)).toEqual(['f1', 'f2'])
	})
})

describe('prependFieldToRow', () => {
	it('prepends field to matching row', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1'))]
		const result = prependFieldToRow(pages, 'r1', makeField('f0'))
		expect(result[0].rows[0].columns.map((f) => f.id)).toEqual(['f0', 'f1'])
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Updates
// ─────────────────────────────────────────────────────────────────────────────

describe('updateField', () => {
	it('applies partial updates to the matching field', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1'))]
		const result = updateField(pages, 'f1', { label: 'Updated' })
		expect((result[0].rows[0].columns[0] as TextField).label).toBe('Updated')
	})
	it('does not affect other fields', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1', 'f2'))]
		const result = updateField(pages, 'f1', { label: 'X' })
		expect((result[0].rows[0].columns[1] as TextField).label).toBe('')
	})
})

describe('replaceField', () => {
	it('replaces the field entirely', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1'))]
		const newField = makeField('f1') as TextField
		newField.label = 'Replaced'
		const result = replaceField(pages, 'f1', newField)
		expect((result[0].rows[0].columns[0] as TextField).label).toBe(
			'Replaced',
		)
	})
})

describe('updatePage', () => {
	it('updates page title', () => {
		const pages = [makePage('p1')]
		const result = updatePage(pages, 'p1', { title: 'New Title' })
		expect(result[0].title).toBe('New Title')
	})
	it('does not affect other pages', () => {
		const pages = [makePage('p1'), makePage('p2')]
		const result = updatePage(pages, 'p1', { title: 'X' })
		expect(result[1].title).toBe('p2')
	})
})

describe('updateRow', () => {
	it('is a no-op since FormRow only has id and columns (no extra props)', () => {
		const pages = [makePage('p1', makeRow('r1'))]
		const result = updateRow(pages, 'r1', {})
		expect(result[0].rows[0].id).toBe('r1')
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Move
// ─────────────────────────────────────────────────────────────────────────────

describe('moveField', () => {
	it('moves field to end of another row', () => {
		const pages = [
			makePage('p1', makeRow('r1', 'f1', 'f2'), makeRow('r2', 'f3')),
		]
		const result = moveField(pages, 'f1', 'r2', 'end')
		expect(result[0].rows[0].columns.map((f) => f.id)).toEqual(['f2'])
		expect(result[0].rows[1].columns.map((f) => f.id)).toEqual(['f3', 'f1'])
	})

	it('moves field to start of another row', () => {
		const pages = [
			makePage('p1', makeRow('r1', 'f1', 'f2'), makeRow('r2', 'f3')),
		]
		const result = moveField(pages, 'f1', 'r2', 'start')
		expect(result[0].rows[1].columns.map((f) => f.id)).toEqual(['f1', 'f3'])
	})

	it('returns unchanged when field not found', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1'))]
		const result = moveField(pages, 'nope', 'r1', 'end')
		expect(result).toEqual(pages)
	})
})

describe('moveRow', () => {
	it('moves row to end of another page', () => {
		const r1 = makeRow('r1', 'f1')
		const r2 = makeRow('r2', 'f2')
		const pages = [makePage('p1', r1), makePage('p2', r2)]
		const result = moveRow(pages, 'r1', 'p2', 'end')
		expect(result[0].rows).toHaveLength(0)
		expect(result[1].rows.map((r) => r.id)).toEqual(['r2', 'r1'])
	})

	it('moves row to start of another page', () => {
		const r1 = makeRow('r1')
		const r2 = makeRow('r2')
		const pages = [makePage('p1', r1), makePage('p2', r2)]
		const result = moveRow(pages, 'r1', 'p2', 'start')
		expect(result[1].rows.map((r) => r.id)).toEqual(['r1', 'r2'])
	})

	it('returns unchanged when row not found', () => {
		const pages = [makePage('p1', makeRow('r1'))]
		expect(moveRow(pages, 'nope', 'p1', 'end')).toEqual(pages)
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Reorder
// ─────────────────────────────────────────────────────────────────────────────

describe('reorderRows', () => {
	it('moves row from index to another index', () => {
		const pages = [makePage('p1', makeRow('r1'), makeRow('r2'), makeRow('r3'))]
		const result = reorderRows(pages, 'p1', 0, 2)
		expect(result[0].rows.map((r) => r.id)).toEqual(['r2', 'r3', 'r1'])
	})
	it('does not affect other pages', () => {
		const pages = [makePage('p1', makeRow('r1')), makePage('p2', makeRow('r2'))]
		const result = reorderRows(pages, 'p1', 0, 0)
		expect(result[1].rows[0].id).toBe('r2')
	})
})

describe('reorderFields', () => {
	it('moves field from index to another index', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1', 'f2', 'f3'))]
		const result = reorderFields(pages, 'r1', 0, 2)
		expect(result[0].rows[0].columns.map((f) => f.id)).toEqual([
			'f2',
			'f3',
			'f1',
		])
	})
	it('is a no-op for out-of-range fromIndex', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1'))]
		const result = reorderFields(pages, 'r1', 5, 0)
		// splice of missing index returns unchanged columns
		expect(result[0].rows[0].columns.map((f) => f.id)).toEqual(['f1'])
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// getAllFields
// ─────────────────────────────────────────────────────────────────────────────

describe('getAllFields', () => {
	it('flattens all fields from all pages and rows', () => {
		const pages = [
			makePage('p1', makeRow('r1', 'f1', 'f2'), makeRow('r2', 'f3')),
			makePage('p2', makeRow('r3', 'f4')),
		]
		const all = getAllFields(pages)
		expect(all.map((f) => f.id)).toEqual(['f1', 'f2', 'f3', 'f4'])
	})
	it('returns empty array for no pages', () => {
		expect(getAllFields([])).toEqual([])
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Immutability checks
// ─────────────────────────────────────────────────────────────────────────────

describe('immutability', () => {
	it('removeField does not mutate original', () => {
		const row = makeRow('r1', 'f1', 'f2')
		const pages = [makePage('p1', row)]
		removeField(pages, 'f1')
		expect(pages[0].rows[0].columns).toHaveLength(2)
	})

	it('updateField does not mutate original', () => {
		const pages = [makePage('p1', makeRow('r1', 'f1'))]
		updateField(pages, 'f1', { label: 'changed' })
		expect((pages[0].rows[0].columns[0] as TextField).label).toBe('')
	})
})
