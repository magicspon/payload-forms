import { useFormContext } from '@/shared/context/EditorFormContext'
import { SelectInput } from '@payloadcms/ui'

import type {
	CheckboxField,
	CheckboxFieldEditorProps,
} from '../../../fieldSchema'

import { checkboxFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { OptionsEditor } from '../OptionsEditor'
import { AdvancedFields, Divider, GeneralFields } from '../SharedFields'

export function CheckboxFieldEditorContent() {
	const form = useFormContext<CheckboxField>()

	return (
		<>
			<GeneralFields>
				<form.Field name="options">
					{(f) => (
						<OptionsEditor
							onChange={(options) => f.handleChange(options)}
							options={f.state.value}
						/>
					)}
				</form.Field>
			</GeneralFields>
			<Divider />
			<AdvancedFields exclude={['defaultValue']}>
				<form.Field name="defaultValue">
					{(f) => (
						<form.Subscribe selector={(state) => state.values.options}>
							{(options) => (
								<SelectInput
									hasMany
									isClearable
									label="Default Values"
									name="defaultValue"
									onChange={(selectedOptions) => {
										const values = selectedOptions
											? (selectedOptions as { value: string }[]).map(
													(opt) => opt.value,
												)
											: []
										f.handleChange(values)
									}}
									options={options.map((opt) => ({
										label: opt.label || opt.value,
										value: opt.value,
									}))}
									path="defaultValue"
									placeholder="Select defaults..."
									value={f.state.value ?? []}
								/>
							)}
						</form.Subscribe>
					)}
				</form.Field>
			</AdvancedFields>
		</>
	)
}

export function CheckboxFieldEditor({ field }: CheckboxFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={checkboxFieldSchema}>
			<CheckboxFieldEditorContent />
		</EditorTabs>
	)
}
