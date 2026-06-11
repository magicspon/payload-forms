import type { Field, FieldType } from '@/shared/fieldSchema'

import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import * as React from 'react'

import { reducer } from '../formBuilderReducer'

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
