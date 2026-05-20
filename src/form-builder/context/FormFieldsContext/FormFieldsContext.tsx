'use client'

import type { Field } from '@/shared/fieldSchema'

import { useDrawerSlug, useModal } from '@payloadcms/ui'
import * as React from 'react'

export type SelectedFieldMeta = {
  field: Field
  pageId: string
  rowId: string
}

type FormFieldsContextValue = {
  clearSelectedField: () => void
  editorDrawerSlug: string
  /** @deprecated use setSelectedFieldMeta / selectedFieldMeta */
  selectedField: Field | null
  selectedFieldMeta: null | SelectedFieldMeta
  /** @deprecated use setSelectedFieldMeta */
  setSelectedField: (field: Field | null) => void
  setSelectedFieldMeta: (meta: null | SelectedFieldMeta) => void
}

const FormFieldsContext = React.createContext<FormFieldsContextValue | null>(null)

export function useFormFields() {
  const context = React.use(FormFieldsContext)
  if (!context) {
    throw new Error('useFormFields must be used within a FormFieldsProvider')
  }
  return context
}

export function FormFieldsProvider({ children }: { children: React.ReactNode }) {
  const [selectedFieldMeta, setSelectedFieldMetaState] = React.useState<null | SelectedFieldMeta>(
    null,
  )

  const { closeModal, openModal } = useModal()
  const editorDrawerSlug = useDrawerSlug('field-editor')

  const clearSelectedField = React.useCallback(() => {
    setSelectedFieldMetaState(null)
    closeModal(editorDrawerSlug)
  }, [closeModal, editorDrawerSlug])

  const setSelectedFieldMeta = React.useCallback(
    (meta: null | SelectedFieldMeta) => {
      setSelectedFieldMetaState(meta)
      if (meta) {
        openModal(editorDrawerSlug)
      } else {
        closeModal(editorDrawerSlug)
      }
    },
    [closeModal, editorDrawerSlug, openModal],
  )

  const setSelectedField = React.useCallback(
    (field: Field | null) => setSelectedFieldMeta(field ? { field, pageId: '', rowId: '' } : null),
    [setSelectedFieldMeta],
  )

  const value = React.useMemo(
    () => ({
      clearSelectedField,
      editorDrawerSlug,
      selectedField: selectedFieldMeta?.field ?? null,
      selectedFieldMeta,
      setSelectedField,
      setSelectedFieldMeta,
    }),
    [
      clearSelectedField,
      editorDrawerSlug,
      selectedFieldMeta,
      setSelectedField,
      setSelectedFieldMeta,
    ],
  )

  return <FormFieldsContext value={value}>{children}</FormFieldsContext>
}
