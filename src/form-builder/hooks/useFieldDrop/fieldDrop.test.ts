import type { FormPage, FormRow } from '@/form-builder/utils/formTree'

import { findField, getAllFields } from '@/form-builder/utils/formTree'
import { createDefaultField } from '@/shared/fieldSchema'
import { describe, expect, it } from 'vitest'

import { applyFieldDrop } from './fieldDrop'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeField(id: string) {
  return { ...createDefaultField(id, 'text'), id, name: id }
}

function makeRow(id: string, ...fieldIds: string[]): FormRow {
  return { id, columns: fieldIds.map(makeField) }
}

function makePage(id: string, ...rows: FormRow[]): FormPage {
  return { id, backButton: 'Back', nextButton: 'Next', rows, title: id }
}

/** One page `p1` with row `r1` holding fields `a` and `b`. */
function pages(): FormPage[] {
  return [makePage('p1', makeRow('r1', 'a', 'b'))]
}

describe('applyFieldDrop', () => {
  describe('new field', () => {
    it('appends a new field to the target row', () => {
      const { newField, pages: next, destinationRowId } = applyFieldDrop(pages(), {
        type: 'new',
        fieldType: 'email',
        pageId: 'p1',
        rowId: 'r1',
      })
      const ids = next[0].rows[0].columns.map((f) => f.id)
      expect(ids).toEqual(['a', 'b', newField.id])
      expect(newField.type).toBe('email')
      expect(destinationRowId).toBe('r1')
    })

    it('creates a new row when createNewRow is set', () => {
      const { newField, pages: next, destinationRowId } = applyFieldDrop(pages(), {
        type: 'new',
        fieldType: 'text',
        pageId: 'p1',
        createNewRow: true,
      })
      expect(next[0].rows).toHaveLength(2)
      // The new row id is generated and reported as the destination.
      expect(destinationRowId).toBe(next[0].rows[1].id)
      expect(next[0].rows[1].columns).toEqual([newField])
    })

    it('inserts before a target field when edge is left', () => {
      const { newField, pages: next } = applyFieldDrop(pages(), {
        type: 'new',
        fieldType: 'text',
        pageId: 'p1',
        targetFieldId: 'b',
        edge: 'left',
      })
      const ids = next[0].rows[0].columns.map((f) => f.id)
      expect(ids).toEqual(['a', newField.id, 'b'])
    })

    it('inserts after a target field when edge is right', () => {
      const { newField, pages: next } = applyFieldDrop(pages(), {
        type: 'new',
        fieldType: 'text',
        pageId: 'p1',
        targetFieldId: 'a',
        edge: 'right',
      })
      const ids = next[0].rows[0].columns.map((f) => f.id)
      expect(ids).toEqual(['a', newField.id, 'b'])
    })

    it('reports the target field row as the destination', () => {
      const { destinationRowId } = applyFieldDrop(pages(), {
        type: 'new',
        fieldType: 'text',
        pageId: 'p1',
        targetFieldId: 'b',
        edge: 'left',
      })
      expect(destinationRowId).toBe('r1')
    })
  })

  describe('existing field', () => {
    it('removes the source field then re-inserts it at the new position', () => {
      const source = makeField('a')
      const { pages: next } = applyFieldDrop(pages(), {
        type: 'existing',
        sourceField: source,
        pageId: 'p1',
        targetFieldId: 'b',
        edge: 'right',
      })
      // 'a' is removed from its original spot and re-inserted after 'b'.
      const ids = next[0].rows[0].columns.map((f) => f.id)
      expect(ids).toEqual(['b', 'a'])
    })

    it('moves an existing field into a brand new row', () => {
      const source = makeField('a')
      const { pages: next, destinationRowId } = applyFieldDrop(pages(), {
        type: 'existing',
        sourceField: source,
        pageId: 'p1',
        createNewRow: true,
      })
      // Original row keeps only 'b'; the moved field lives alone in the new row.
      expect(next[0].rows[0].columns.map((f) => f.id)).toEqual(['b'])
      expect(findField(next, 'a')?.row.id).toBe(destinationRowId)
    })
  })

  it('leaves the tree unchanged when no placement target is provided', () => {
    const { pages: next, destinationRowId } = applyFieldDrop(pages(), {
      type: 'new',
      fieldType: 'text',
      pageId: 'p1',
    })
    // No createNewRow / targetField / rowId → field is computed but never placed.
    expect(getAllFields(next).map((f) => f.id)).toEqual(['a', 'b'])
    expect(destinationRowId).toBe('')
  })
})
