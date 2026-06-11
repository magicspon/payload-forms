import type { FormPage, FormRow } from '@/form-builder/utils/formTree'

import { getAllFields } from '@/form-builder/utils/formTree'
import { createDefaultField } from '@/shared/fieldSchema'
import { describe, expect, it } from 'vitest'

import type { State } from './formBuilderReducer'

import { reducer } from './formBuilderReducer'

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

/** State with one page (`p1`) containing one row (`r1`) with field `f1`. */
function baseState(): State {
  return { pages: [makePage('p1', makeRow('r1', 'f1'))], selectedFieldId: null }
}

describe('reducer', () => {
  it('returns the same state reference for an unknown action', () => {
    const state = baseState()
    // @ts-expect-error exercising the default branch with an unhandled action
    expect(reducer(state, { type: 'NOPE' })).toBe(state)
  })

  describe('ADD_FIELD', () => {
    it('appends a field to the target row and selects it', () => {
      const next = reducer(baseState(), { type: 'ADD_FIELD', fieldType: 'email', rowId: 'r1' })
      const fields = getAllFields(next.pages)
      expect(fields).toHaveLength(2)
      const added = fields.find((f) => f.type === 'email')
      expect(added).toBeDefined()
      // Newly added field is auto-selected for immediate editing.
      expect(next.selectedFieldId).toBe(added?.id)
    })
  })

  describe('ADD_PAGE', () => {
    it('appends a page titled by position with one empty row', () => {
      const next = reducer(baseState(), { type: 'ADD_PAGE' })
      expect(next.pages).toHaveLength(2)
      expect(next.pages[1].title).toBe('Page 2')
      expect(next.pages[1].rows).toHaveLength(1)
      expect(next.pages[1].rows[0].columns).toEqual([])
    })
  })

  describe('ADD_ROW', () => {
    it('appends an empty row to the target page', () => {
      const next = reducer(baseState(), { type: 'ADD_ROW', pageId: 'p1' })
      expect(next.pages[0].rows).toHaveLength(2)
      expect(next.pages[0].rows[1].columns).toEqual([])
    })
  })

  describe('CLEAR_SELECTION', () => {
    it('clears the selected field', () => {
      const state: State = { ...baseState(), selectedFieldId: 'f1' }
      expect(reducer(state, { type: 'CLEAR_SELECTION' }).selectedFieldId).toBeNull()
    })
  })

  describe('REMOVE_FIELD', () => {
    it('removes the field from the tree', () => {
      const next = reducer(baseState(), { type: 'REMOVE_FIELD', fieldId: 'f1' })
      expect(getAllFields(next.pages)).toHaveLength(0)
    })

    it('clears the selection when the removed field was selected', () => {
      const state: State = { ...baseState(), selectedFieldId: 'f1' }
      expect(reducer(state, { type: 'REMOVE_FIELD', fieldId: 'f1' }).selectedFieldId).toBeNull()
    })

    it('keeps the selection when a different field is removed', () => {
      const state: State = { ...baseState(), selectedFieldId: 'other' }
      expect(reducer(state, { type: 'REMOVE_FIELD', fieldId: 'f1' }).selectedFieldId).toBe('other')
    })
  })

  describe('REMOVE_PAGE / REMOVE_ROW', () => {
    it('removes the target page', () => {
      const next = reducer(baseState(), { type: 'REMOVE_PAGE', pageId: 'p1' })
      expect(next.pages).toHaveLength(0)
    })

    it('removes the target row', () => {
      const next = reducer(baseState(), { type: 'REMOVE_ROW', rowId: 'r1' })
      expect(next.pages[0].rows).toHaveLength(0)
    })
  })

  describe('SELECT_FIELD', () => {
    it('sets the selected field id', () => {
      expect(reducer(baseState(), { type: 'SELECT_FIELD', fieldId: 'f1' }).selectedFieldId).toBe(
        'f1',
      )
    })
  })

  describe('UPDATE_FIELD', () => {
    it('replaces the field and clears the selection', () => {
      const state: State = { ...baseState(), selectedFieldId: 'f1' }
      const updated = { ...makeField('f1'), label: 'Updated', name: 'f1' }
      const next = reducer(state, { type: 'UPDATE_FIELD', field: updated })
      expect(next.selectedFieldId).toBeNull()
      const field = getAllFields(next.pages).find((f) => f.id === 'f1')
      expect(field).toMatchObject({ label: 'Updated' })
    })

    it('derives a camelCase name from the label when name is empty', () => {
      const state = baseState()
      const updated = { ...makeField('f1'), label: 'First Name', name: '' }
      const next = reducer(state, { type: 'UPDATE_FIELD', field: updated })
      const field = getAllFields(next.pages).find((f) => f.id === 'f1')
      expect(field).toMatchObject({ name: 'firstName' })
    })

    it('keeps an existing name untouched', () => {
      const state = baseState()
      const updated = { ...makeField('f1'), label: 'First Name', name: 'keepMe' }
      const next = reducer(state, { type: 'UPDATE_FIELD', field: updated })
      const field = getAllFields(next.pages).find((f) => f.id === 'f1')
      expect(field).toMatchObject({ name: 'keepMe' })
    })
  })

  describe('UPDATE_PAGE', () => {
    it('applies the updates to the target page', () => {
      const next = reducer(baseState(), {
        type: 'UPDATE_PAGE',
        pageId: 'p1',
        updates: { title: 'Renamed' },
      })
      expect(next.pages[0].title).toBe('Renamed')
    })
  })
})
