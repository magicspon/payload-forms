'use client'

import type { TextFieldClientProps } from 'payload'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import * as React from 'react'

type FormPage = {
	rows?: Array<{
		columns?: Array<{
			label?: string
			name?: string
			type?: string
		}>
	}>
}

export function EmailFieldSelect({ path }: TextFieldClientProps) {
	const { setValue, value = '' } = useField<string>({
		path: path ?? 'emailField',
	})
	const pages = useFormFields(([fields]) => fields.pages) as
		| { value?: FormPage[] }
		| undefined

	const options = React.useMemo(() => {
		if (!pages?.value?.length) {return []}
		return pages.value
			.flatMap((page) => page.rows?.flatMap((row) => row.columns ?? []) ?? [])
			.filter(
				(field): field is { label: string; name: string; type: string } =>
					!!field && field.type === 'email' && !!field.name,
			)
			.map((field) => ({
				label: field.label || field.name,
				value: field.name,
			}))
	}, [pages?.value])

	return (
		<SelectInput
			isClearable
			label="Email Field"
			name={path ?? 'emailField'}
			onChange={(option) => {
				setValue(option ? (option as { value: string }).value : '')
			}}
			options={options}
			path={path ?? 'emailField'}
			placeholder="Select email field…"
			value={value}
		/>
	)
}
