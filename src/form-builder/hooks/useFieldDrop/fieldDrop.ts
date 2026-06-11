import type { FormPage, FormRow } from '@/form-builder/utils/formTree'

import {
  appendFieldToRow,
  appendRowToPage,
  findField,
  insertFieldAfter,
  insertFieldBefore,
  removeField,
} from '@/form-builder/utils/formTree'
import { createDefaultField, type Field, type FieldType } from '@/shared/fieldSchema'
import { nanoid } from '@/shared/utils/nanoid'

type BaseDropParams = {
  createNewRow?: boolean
  edge?: 'left' | 'right' | null
  pageId: string
  rowId?: string
  targetFieldId?: string
}

export type TNewFieldDropParams = {
  fieldType: FieldType
  type: 'new'
} & BaseDropParams

export type TExistingFieldDropParams = {
  sourceField: Field
  type: 'existing'
} & BaseDropParams

export type TFieldDropParams = TExistingFieldDropParams | TNewFieldDropParams

export type FieldDropResult = {
  /** Row the field landed in (used to focus the new field). */
  destinationRowId: string
  /** The field that was placed (new default field or the moved existing field). */
  newField: Field
  /** The updated page tree. */
  pages: FormPage[]
}

/**
 * Compute the page tree after dropping a field, plus the destination row and the
 * placed field. Pure aside from id generation — no React state.
 *
 * Placement precedence: a new row → before/after a target field (by edge) →
 * appended to a target row.
 */
export function applyFieldDrop(pages: FormPage[], params: TFieldDropParams): FieldDropResult {
  const { createNewRow, edge, pageId, rowId, targetFieldId } = params

  let newPages = pages
  let newField: Field

  switch (params.type) {
    case 'existing': {
      newPages = removeField(newPages, params.sourceField.id)
      newField = params.sourceField
      break
    }
    case 'new': {
      newField = createDefaultField(nanoid(), params.fieldType)
      break
    }
  }

  let destinationRowId = ''

  if (createNewRow) {
    const newRowId = nanoid()
    destinationRowId = newRowId
    const newRow: FormRow = { id: newRowId, columns: [] }
    newPages = appendRowToPage(newPages, pageId, newRow)
    newPages = appendFieldToRow(newPages, newRowId, newField)
  } else if (targetFieldId && edge) {
    destinationRowId = findField(pages, targetFieldId)?.row.id ?? ''
    if (edge === 'left') {
      newPages = insertFieldBefore(newPages, targetFieldId, newField)
    } else {
      newPages = insertFieldAfter(newPages, targetFieldId, newField)
    }
  } else if (rowId) {
    destinationRowId = rowId
    newPages = appendFieldToRow(newPages, rowId, newField)
  }

  return { destinationRowId, newField, pages: newPages }
}
