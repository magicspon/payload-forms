import type { TextField, TextFieldEditorProps } from '@/shared/fieldSchema'
import type { ChangeEvent } from 'react'

import { AdvancedFields, Divider, GeneralFields } from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { textFieldSchema } from '@/shared/fieldSchema'
import { TextInput } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

export function TextFieldEditorContent() {
	const form = useFormContext<TextField>()

	return (
		<>
			<GeneralFields />
			<Divider />
			<AdvancedFields>
				<form.Field name="minLength">
					{(f) => (
						<TextInput
							description="The minimum number of characters that the input value can have"
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
							description="The maximum number of characters that the input value can have"
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

export function TextFieldEditor({ field }: TextFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={textFieldSchema}>
			<TextFieldEditorContent />
		</EditorTabs>
	)
}
