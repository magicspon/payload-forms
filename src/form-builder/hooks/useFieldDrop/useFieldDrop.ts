import { useFormFields } from '@/form-builder/context/FormFieldsContext'
import {
	appendFieldToRow,
	appendRowToPage,
	type FormRow,
	insertFieldAfter,
	insertFieldBefore,
	removeField,
} from '@/form-builder/utils/formTree'
import { findField } from '@/form-builder/utils/formTree'
import {
	createDefaultField,
	type Field,
	type FieldType,
} from '@/shared/fieldSchema'
import { nanoid } from '@/shared/utils/nanoid'
import * as React from 'react'

import { useFormPages } from '../useFormPages'

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

export function useFieldDrop() {
	const { pages, setPages } = useFormPages()
	const { setSelectedFieldMeta } = useFormFields()

	const handleFieldDrop = React.useCallback(
		(params: TFieldDropParams) => {
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

			setPages(newPages)

			if (params.type === 'new') {
				setSelectedFieldMeta({ field: newField, pageId, rowId: destinationRowId })
			}
		},
		[pages, setPages, setSelectedFieldMeta],
	)

	return handleFieldDrop
}
