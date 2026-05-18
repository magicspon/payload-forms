import type { ZodType } from 'zod'

import { useEditorForm } from '@/shared/context/EditorFormContext'
import { useField } from '@payloadcms/ui'
import { useMemo } from 'react'

import type { AllFields, Field } from '../../../fieldSchema'

import { type FormPage, getAllFields } from '../../../utils/formTree'
import { useSaveFormField } from '../useSaveFormField'

export function useSaveEditor<U extends AllFields>({
	field,
	onChangeValidator,
}: {
	field: U
	onChangeValidator?: ZodType<U>
}) {
	const { saveField, setSelectedField } = useSaveFormField()
	const { value: pages = [] } = useField<FormPage[]>({ path: 'pages' })

	// Get all existing field names except the current field being edited
	const existingFieldNames = useMemo(() => {
		const allFields = getAllFields(pages)
		return new Set(
			allFields
				.filter((f) => f.id !== field.id && f.type !== 'message')
				.map((f) => (f as { name: string }).name),
		)
	}, [pages, field.id])

	const { contextValue, form } = useEditorForm({
		defaultValues: field,
		onSubmit: (value) => {
			saveField(value as Field)
			return Promise.resolve()
		},
		schema: onChangeValidator,
	})

	return {
		contextValue,
		existingFieldNames,
		form,
		setSelectedField,
		submitHandle: form.handleSubmit,
	}
}
