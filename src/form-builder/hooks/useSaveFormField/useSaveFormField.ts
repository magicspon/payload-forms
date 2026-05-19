'use client'

import type { Field } from '@/shared/fieldSchema'

import { useFormFields } from '@/form-builder/context/FormFieldsContext'
import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { replaceField } from '@/form-builder/utils/formTree'
import { camelCase } from '@/shared/utils/camelCase'
import { toast } from '@payloadcms/ui'
import * as React from 'react'

export function useSaveFormField() {
	const { pages, setPages } = useFormPages()
	const { setSelectedField } = useFormFields()

	const saveField = React.useCallback(
		(field: Field) => {
			try {
				// Remove _draft flag when saving
				const savedField = { ...field, _draft: false } as Field

				if ('label' in savedField && !savedField.name) {
					savedField.name = camelCase(savedField.label)
				}

				const newPages = replaceField(pages, field.id, savedField)
				setPages(newPages)
				setSelectedField(null)

				toast.success('Field saved successfully')
			} catch (error) {
				// Surface the actual error message so the user has actionable information
				const message =
					error instanceof Error ? error.message : 'Unknown error'
				toast.error(`Failed to save field: ${message}`)
			}
		},
		[pages, setPages, setSelectedField],
	)

	return { saveField, setSelectedField }
}
