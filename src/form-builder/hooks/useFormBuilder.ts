import type { Field, FieldType } from '@/shared/fieldSchema'

import {
  appendFieldToRow,
  appendRowToPage,
  type FormPage,
  type FormRow,
  getAllFields,
  removeField as removeFieldFn,
  removePage as removePageFn,
  removeRow as removeRowFn,
  replaceField,
  updatePage as updatePageFn,
} from '@/form-builder/utils/formTree'
import { createDefaultField } from '@/shared/fieldSchema'
import { camelCase } from '@/shared/utils/camelCase'
import { nanoid } from '@/shared/utils/nanoid'
import * as React from 'react'

type Action =
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

interface State {
  pages: FormPage[]
  selectedFieldId: null | string
}

function reducer(state: State, action: Action): State {
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
      // Mirror useSaveFormField: strip _draft, auto-generate name from label
      const saved = { ...action.field, _draft: false } as Field
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

export interface UseFormBuilderReturn {
  addField: (rowId: string, fieldType: FieldType) => void
  addPage: () => void
  addRow: (pageId: string) => void
  clearSelection: () => void
  existingFieldNames: Set<string>
  isDirty: boolean
  pages: FormPage[]
  removeField: (fieldId: string) => void
  removePage: (pageId: string) => void
  removeRow: (rowId: string) => void
  selectedField: Field | null
  selectField: (fieldId: string) => void
  updateField: (field: Field) => void
  updatePage: (pageId: string, updates: Partial<Omit<FormPage, 'id' | 'rows'>>) => void
}

/**
 * Headless form builder hook. Manages the FormPage[] state tree and exposes
 * operations for adding, removing, and editing pages, rows, and fields.
 * No storage — consumers wire in their own persistence (Payload useField,
 * sdk.update, etc.).
 */
export function useFormBuilder(initialPages: FormPage[]): UseFormBuilderReturn {
  // Capture initial pages once at mount so isDirty is stable
  const initialPagesRef = React.useRef(initialPages)

  const [state, dispatch] = React.useReducer(reducer, {
    pages: initialPages,
    selectedFieldId: null,
  })

  const selectedField = React.useMemo(() => {
    if (!state.selectedFieldId) {
      return null
    }
    return getAllFields(state.pages).find((f) => f.id === state.selectedFieldId) ?? null
  }, [state.pages, state.selectedFieldId])

  const existingFieldNames = React.useMemo(() => {
    const allFields = getAllFields(state.pages)
    return new Set(
      allFields
        .filter((f) => f.id !== state.selectedFieldId && f.type !== 'message')
        .map((f) => ('name' in f ? f.name : ''))
        .filter(Boolean),
    )
  }, [state.pages, state.selectedFieldId])

  const isDirty = React.useMemo(
    () => JSON.stringify(state.pages) !== JSON.stringify(initialPagesRef.current),
    [state.pages],
  )

  return {
    addField: (rowId, fieldType) => dispatch({ type: 'ADD_FIELD', fieldType, rowId }),
    addPage: () => dispatch({ type: 'ADD_PAGE' }),
    addRow: (pageId) => dispatch({ type: 'ADD_ROW', pageId }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    existingFieldNames,
    isDirty,
    pages: state.pages,
    removeField: (fieldId) => dispatch({ type: 'REMOVE_FIELD', fieldId }),
    removePage: (pageId) => dispatch({ type: 'REMOVE_PAGE', pageId }),
    removeRow: (rowId) => dispatch({ type: 'REMOVE_ROW', rowId }),
    selectedField,
    selectField: (fieldId) => dispatch({ type: 'SELECT_FIELD', fieldId }),
    updateField: (field) => dispatch({ type: 'UPDATE_FIELD', field }),
    updatePage: (pageId, updates) => dispatch({ type: 'UPDATE_PAGE', pageId, updates }),
  }
}
