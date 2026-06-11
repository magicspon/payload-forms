import type { Field, FieldType } from '@/shared/fieldSchema'

import {
  appendFieldToRow,
  appendRowToPage,
  type FormPage,
  type FormRow,
  removeField as removeFieldFn,
  removePage as removePageFn,
  removeRow as removeRowFn,
  replaceField,
  updatePage as updatePageFn,
} from '@/form-builder/utils/formTree'
import { createDefaultField } from '@/shared/fieldSchema'
import { camelCase } from '@/shared/utils/camelCase'
import { nanoid } from '@/shared/utils/nanoid'

export type Action =
  | { field: Field; type: 'UPDATE_FIELD' }
  | { fieldId: string; type: 'REMOVE_FIELD' }
  | { fieldId: string; type: 'SELECT_FIELD' }
  | { fieldType: FieldType; rowId: string; type: 'ADD_FIELD' }
  | { pageId: string; type: 'ADD_ROW' }
  | { pageId: string; type: 'REMOVE_PAGE' }
  | {
      pageId: string
      type: 'UPDATE_PAGE'
      updates: Partial<Omit<FormPage, 'id' | 'rows'>>
    }
  | { rowId: string; type: 'REMOVE_ROW' }
  | { type: 'ADD_PAGE' }
  | { type: 'CLEAR_SELECTION' }

export interface State {
  pages: FormPage[]
  selectedFieldId: null | string
}

/** Pure state transition for the form builder. No side effects beyond id generation. */
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FIELD': {
      const newField = createDefaultField(nanoid(), action.fieldType)
      return {
        ...state,
        pages: appendFieldToRow(state.pages, action.rowId, newField),
        // Auto-open the editor for new fields so user can set the label immediately
        selectedFieldId: newField.id,
      }
    }
    case 'ADD_PAGE': {
      const newPage: FormPage = {
        id: nanoid(),
        backButton: 'Back',
        nextButton: 'Next',
        rows: [{ id: nanoid(), columns: [] }],
        title: `Page ${state.pages.length + 1}`,
      }
      return { ...state, pages: [...state.pages, newPage] }
    }
    case 'ADD_ROW': {
      const newRow: FormRow = { id: nanoid(), columns: [] }
      return {
        ...state,
        pages: appendRowToPage(state.pages, action.pageId, newRow),
      }
    }
    case 'CLEAR_SELECTION':
      return { ...state, selectedFieldId: null }
    case 'REMOVE_FIELD': {
      return {
        ...state,
        pages: removeFieldFn(state.pages, action.fieldId),
        selectedFieldId: state.selectedFieldId === action.fieldId ? null : state.selectedFieldId,
      }
    }
    case 'REMOVE_PAGE':
      return { ...state, pages: removePageFn(state.pages, action.pageId) }
    case 'REMOVE_ROW':
      return { ...state, pages: removeRowFn(state.pages, action.rowId) }
    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.fieldId }
    case 'UPDATE_FIELD': {
      const saved = { ...action.field } as Field
      if ('label' in saved && !saved.name) {
        saved.name = camelCase(saved.label)
      }
      return {
        ...state,
        pages: replaceField(state.pages, action.field.id, saved),
        selectedFieldId: null,
      }
    }
    case 'UPDATE_PAGE':
      return {
        ...state,
        pages: updatePageFn(state.pages, action.pageId, action.updates),
      }
    default:
      return state
  }
}
