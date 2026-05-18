import type { ChangeEvent } from 'react'

import { useFormContext } from '@/shared/context/EditorFormContext'
import { TextInput } from '@payloadcms/ui'

import type { NumberField, NumberFieldEditorProps } from '../../../fieldSchema'

import { numberFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, Divider, GeneralFields } from '../SharedFields'
import styles from './NumberFieldEditor.module.css'

export function NumberFieldEditorContent() {
	const form = useFormContext<NumberField>()

	return (
		<>
			<GeneralFields />
			<Divider />
			<div className={styles.twoColGrid}>
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
			</div>
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
