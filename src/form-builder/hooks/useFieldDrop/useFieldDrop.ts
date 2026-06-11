import { useFormFields } from '@/form-builder/context/FormFieldsContext'
import * as React from 'react'

import { useFormPages } from '../useFormPages'
import { applyFieldDrop } from './fieldDrop'

export type {
  FieldDropResult,
  TExistingFieldDropParams,
  TFieldDropParams,
  TNewFieldDropParams,
} from './fieldDrop'

import type { TFieldDropParams } from './fieldDrop'

export function useFieldDrop() {
  const { pages, setPages } = useFormPages()
  const { setSelectedFieldMeta } = useFormFields()

  const handleFieldDrop = React.useCallback(
    (params: TFieldDropParams) => {
      const { destinationRowId, newField, pages: newPages } = applyFieldDrop(pages, params)

      setPages(newPages)

      if (params.type === 'new') {
        setSelectedFieldMeta({ field: newField, pageId: params.pageId, rowId: destinationRowId })
      }
    },
    [pages, setPages, setSelectedFieldMeta],
  )

  return handleFieldDrop
}
