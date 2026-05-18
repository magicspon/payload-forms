import type { ChangeEvent } from 'react'

import { useFormContext } from '@/shared/context/EditorFormContext'
import { TextareaInput, TextInput } from '@payloadcms/ui'

import type {
	TextareaField,
	TextareaFieldEditorProps,
} from '../../../fieldSchema'

import { textareaFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, GeneralFields } from '../SharedFields'
import styles from './TextareaFieldEditor.module.css'

export function TextareaFieldEditorContent() {
	const form = useFormContext<TextareaField>()

	return (
		<>
			<GeneralFields />
			<hr className={styles.divider} />
			<AdvancedFields exclude={['defaultValue']}>
				<form.Field name="rows">
					{(f) => (
						<TextInput
							label="Rows"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								f.handleChange(e.target.value ? Number(e.target.value) : 4)
							}
							path="rows"
							value={f.state.value?.toString() ?? '4'}
						/>
					)}
				</form.Field>
				<div className={styles.colSpan2}>
					<form.Field name="defaultValue">
						{(f) => (
							<TextareaInput
								label="Default Value"
								onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
									f.handleChange(e.target.value)
								}
								path="defaultValue"
								rows={4}
								value={f.state.value ?? ''}
							/>
						)}
					</form.Field>
				</div>
				<form.Field name="minLength">
					{(f) => (
						<TextInput
							label="Min Length"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								f.handleChange(
									e.target.value ? Number(e.target.value) : undefined,
								)
							}
							path="minLength"
							value={f.state.value?.toString() ?? ''}
						/>
					)}
				</form.Field>
				<form.Field name="maxLength">
					{(f) => (
						<TextInput
							label="Max Length"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								f.handleChange(
									e.target.value ? Number(e.target.value) : undefined,
								)
							}
							path="maxLength"
							value={f.state.value?.toString() ?? ''}
						/>
					)}
				</form.Field>
			</AdvancedFields>
		</>
	)
}

export function TextareaFieldEditor({ field }: TextareaFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={textareaFieldSchema}>
			<TextareaFieldEditorContent />
		</EditorTabs>
	)
}
