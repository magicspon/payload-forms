import type { NumberField, NumberFieldEditorProps } from '@/shared/fieldSchema'
import type { ChangeEvent } from 'react'

import { AdvancedFields, Divider, GeneralFields } from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { numberFieldSchema } from '@/shared/fieldSchema'
import { TextInput } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

export function NumberFieldEditorContent() {
	const form = useFormContext<NumberField>()

	return (
		<>
			<GeneralFields />
			<Divider />
			<AdvancedFields>
				<form.Field name="min">
					{(f) => (
						<TextInput
							description="The minimum value that can be entered"
							label="Minimum"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								f.handleChange(
									e.target.value ? Number(e.target.value) : undefined,
								)
							}
							path="min"
							value={f.state.value?.toString() ?? ''}
						/>
					)}
				</form.Field>
				<form.Field name="max">
					{(f) => (
						<TextInput
							description="The maximum value that can be entered"
							label="Maximum"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								f.handleChange(
									e.target.value ? Number(e.target.value) : undefined,
								)
							}
							path="max"
							value={f.state.value?.toString() ?? ''}
						/>
					)}
				</form.Field>
				<form.Field name="step">
					{(f) => (
						<TextInput
							description="The step value that is added or subtracted from the input value"
							label="Step"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								f.handleChange(
									e.target.value ? Number(e.target.value) : undefined,
								)
							}
							path="step"
							value={f.state.value?.toString() ?? ''}
						/>
					)}
				</form.Field>
			</AdvancedFields>
		</>
	)
}

export function NumberFieldEditor({ field }: NumberFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={numberFieldSchema}>
			<NumberFieldEditorContent />
		</EditorTabs>
	)
}
