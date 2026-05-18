import { useFormContext } from '@/shared/context/EditorFormContext'
import { SelectInput } from '@payloadcms/ui'
import * as React from 'react'

import type { SelectField, SelectFieldEditorProps } from '../../../fieldSchema'

import { selectFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { OptionsEditor } from '../OptionsEditor'
import { AdvancedFields, GeneralFields } from '../SharedFields'
import styles from './SelectFieldEditor.module.css'

export function SelectFieldEditorContent() {
	const form = useFormContext<SelectField>()

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
			<hr className={styles.divider} />
			<AdvancedFields exclude={['defaultValue']}>
				<form.Field name="defaultValue">
					{(f) => (
						<form.Subscribe selector={(state) => state.values.options}>
							{(options) => (
								<SelectInput
									isClearable
									label="Default Value"
									name="defaultValue"
									onChange={(option) => {
										const value = option
											? (option as { value: string }).value
											: ''
										f.handleChange(value)
									}}
									options={options.map((opt) => ({
										label: opt.label || opt.value,
										value: opt.value,
									}))}
									path="defaultValue"
									placeholder="Select default..."
									value={f.state.value ?? ''}
								/>
							)}
						</form.Subscribe>
					)}
				</form.Field>
			</AdvancedFields>
		</>
	)
}

export function SelectFieldEditor({ field }: SelectFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={selectFieldSchema}>
			<SelectFieldEditorContent />
		</EditorTabs>
	)
}
