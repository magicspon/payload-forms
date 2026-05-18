'use client'

import { camelCase } from '@/shared/utils/camelCase'
import {
	$getSelection,
	$isRangeSelection,
} from '@payloadcms/richtext-lexical/lexical'
import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { Popup, PopupList, useFormFields } from '@payloadcms/ui'
import * as React from 'react'

import styles from './ToolbarItem.module.css'

type FormPage = {
	rows?: Array<{
		columns?: Array<{
			label?: string
			name?: string
			type?: string
		}>
	}>
}

function BracesIcon() {
	return (
		<svg
			className={styles.icon}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
		>
			<path d="M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3" />
			<path d="M8 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3" />
		</svg>
	)
}

export function FormFieldReferenceToolbarItem() {
	const [editor] = useLexicalComposerContext()
	const pages = useFormFields(([fields]) => fields.pages) as
		| { value?: FormPage[] }
		| undefined

	const formFields = React.useMemo(() => {
		if (!pages?.value) {return []}

		return pages.value
			.flatMap((page) => page.rows?.flatMap((row) => row.columns) ?? [])
			.filter(
				(field): field is { label: string; name: string; type: string } =>
					!!field && field.type !== 'message' && !!field.name,
			)
			.map((field) => ({
				name: field.name,
				label: field.label || field.name,
			}))
	}, [pages?.value])

	const insertFieldReference = React.useCallback(
		(fieldName: string) => {
			editor.update(() => {
				const selection = $getSelection()
				if ($isRangeSelection(selection)) {
					selection.insertText(`{{${camelCase(fieldName)}}}`)
				}
			})
		},
		[editor],
	)

	if (formFields.length === 0) {
		return null
	}

	return (
		<Popup
			button={
				<button data-testid="toolbar-item" type="button">
					<BracesIcon />
				</button>
			}
			buttonType="custom"
		>
			<PopupList.ButtonGroup>
				{formFields.map((field) => (
					<PopupList.Button
						id={`toolbar-item-${field.name}`}
						key={field.name}
						onClick={() => insertFieldReference(field.name)}
					>
						{field.label} <span className={styles.muted}>({field.name})</span>
					</PopupList.Button>
				))}
			</PopupList.ButtonGroup>
		</Popup>
	)
}
