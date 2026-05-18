import type { ChangeEvent } from 'react'

import { useFormContext } from '@/shared/context/EditorFormContext'
import { TextInput } from '@payloadcms/ui'

import type { TextField, TextFieldEditorProps } from '../../../fieldSchema'

import { textFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, Divider, GeneralFields } from '../SharedFields'

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
