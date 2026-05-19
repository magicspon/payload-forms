import type {
	TextareaField,
	TextareaFieldEditorProps,
} from '@/shared/fieldSchema'
import type { ChangeEvent } from 'react'

import { AdvancedFields, Divider, GeneralFields } from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { textareaFieldSchema } from '@/shared/fieldSchema'
import { TextareaInput, TextInput } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

export function TextareaFieldEditorContent() {
	const form = useFormContext<TextareaField>()

	return (
		<>
			<GeneralFields />
			<Divider />
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
