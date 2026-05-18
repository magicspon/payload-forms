'use client'

import type { ComponentType } from 'react'
import type { ZodType } from 'zod'

import {
	EditorFormCtxProvider,
	EditorSettingsProvider,
	useEditorForm,
} from '@/shared/context/EditorFormContext'
import { Inline } from '@/shared/ui/layout'
import {
	Button,
	Drawer,
	DrawerToggler,
	EditIcon,
	useDrawerSlug,
	useModal,
} from '@payloadcms/ui'
import * as React from 'react'

import type { ArrayItemField, ArrayItemFieldType } from '../../../fieldSchema'

import {
	checkboxFieldSchema,
	consentFieldSchema,
	dateFieldSchema,
	emailFieldSchema,
	fileFieldSchema,
	numberFieldSchema,
	radioFieldSchema,
	selectFieldSchema,
	textareaFieldSchema,
	textFieldSchema,
	toggleFieldSchema,
} from '../../../fieldSchema'
import { CheckboxFieldEditorContent } from '../CheckboxFieldEditor/CheckboxFieldEditor'
import { ConsentFieldEditorPanel } from '../ConsentFieldEditor/ConsentFieldEditor'
import { DateFieldEditorContent } from '../DateFieldEditor/DateFieldEditor'
import { EmailFieldEditorContent } from '../EmailFieldEditor/EmailFieldEditor'
import { FileFieldEditorContent } from '../FileFieldEditor/FileFieldEditor'
import { NumberFieldEditorContent } from '../NumberFieldEditor/NumberFieldEditor'
import { RadioFieldEditorContent } from '../RadioFieldEditor/RadioFieldEditor'
import { SelectFieldEditorContent } from '../SelectFieldEditor/SelectFieldEditor'
import { Divider } from '../SharedFields'
import { TextareaFieldEditorContent } from '../TextareaFieldEditor/TextareaFieldEditor'
import { TextFieldEditorContent } from '../TextFieldEditor/TextFieldEditor'
import { ToggleFieldEditorContent } from '../ToggleFieldEditor/ToggleFieldEditor'
import styles from './ArrayFieldEditor.module.css'

const contentComponents: Record<ArrayItemFieldType, ComponentType> = {
	checkbox: CheckboxFieldEditorContent,
	consent: ConsentFieldEditorPanel,
	date: DateFieldEditorContent,
	email: EmailFieldEditorContent,
	file: FileFieldEditorContent,
	number: NumberFieldEditorContent,
	radio: RadioFieldEditorContent,
	select: SelectFieldEditorContent,
	text: TextFieldEditorContent,
	textarea: TextareaFieldEditorContent,
	toggle: ToggleFieldEditorContent,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fieldSchemas: Record<ArrayItemFieldType, ZodType<any>> = {
	checkbox: checkboxFieldSchema,
	consent: consentFieldSchema,
	date: dateFieldSchema,
	email: emailFieldSchema,
	file: fileFieldSchema,
	number: numberFieldSchema,
	radio: radioFieldSchema,
	select: selectFieldSchema,
	text: textFieldSchema,
	textarea: textareaFieldSchema,
	toggle: toggleFieldSchema,
}

type Props = {
	onChange: (updated: ArrayItemField) => void
	subField: ArrayItemField
}

function SubFieldEditorContent({
	drawerSlug,
	onChange,
	subField,
}: Props & { drawerSlug: string }) {
	const { closeModal } = useModal()
	const ContentComponent = contentComponents[subField.type]
	const schema = fieldSchemas[subField.type]

	const { contextValue, form } = useEditorForm({
		defaultValues: subField,
		onSubmit: async (values) => {
			onChange(values as ArrayItemField)
			closeModal(drawerSlug)
		},
		schema,
	})

	return (
		<EditorFormCtxProvider value={contextValue}>
			<EditorSettingsProvider currentFieldId={subField.id} existingFieldNames={new Set()}>
				<ContentComponent />
				<Divider />
				<Inline>
					<Button
						buttonStyle="secondary"
						onClick={() => closeModal(drawerSlug)}
						type="button"
					>
						Cancel
					</Button>
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
						{([canSubmit, isSubmitting]) => (
							<Button
								disabled={!canSubmit || !!isSubmitting}
								onClick={form.handleSubmit}
								type="button"
							>
								{isSubmitting ? 'Saving...' : 'Save'}
							</Button>
						)}
					</form.Subscribe>
				</Inline>
			</EditorSettingsProvider>
		</EditorFormCtxProvider>
	)
}

export function SubFieldEditorDrawer({ onChange, subField }: Props) {
	const drawerSlug = useDrawerSlug(`sub-field-${subField.id}`)
	const title = subField.label || subField.type

	return (
		<>
			<DrawerToggler className={styles.iconButton} slug={drawerSlug}>
				<span className={styles.srOnly}>Edit {title}</span>
				<EditIcon />
				<div className={styles.absoluteInset} />
			</DrawerToggler>
			<Drawer slug={drawerSlug} title={`Edit: ${title}`}>
				<SubFieldEditorContent
					drawerSlug={drawerSlug}
					onChange={onChange}
					subField={subField}
				/>
			</Drawer>
		</>
	)
}
