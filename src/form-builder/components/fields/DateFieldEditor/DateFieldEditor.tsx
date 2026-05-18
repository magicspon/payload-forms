import { useFormContext } from '@/shared/context/EditorFormContext'
import { DatePicker } from '@payloadcms/ui'

import type { DateField, DateFieldEditorProps } from '../../../fieldSchema'

import { dateFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, GeneralFields } from '../SharedFields'
import styles from './DateFieldEditor.module.css'

export function DateFieldEditorContent() {
	const form = useFormContext<DateField>()

	return (
		<>
			<GeneralFields />
			<hr className={styles.divider} />
			<AdvancedFields exclude={['defaultValue']}>
				<form.Field name="defaultValue">
					{(f) => (
						<div className="field-type date">
							<label className="field-label">Default Value</label>
							<DatePicker
								onChange={(date: Date) => {
									f.handleChange(date ? date.toISOString().split('T')[0] : '')
								}}
								placeholder="Select date..."
								value={f.state.value ? new Date(f.state.value) : undefined}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="minDate">
					{(f) => (
						<div className="field-type date">
							<label className="field-label">Min Date</label>
							<DatePicker
								onChange={(date: Date) => {
									f.handleChange(date ? date.toISOString().split('T')[0] : '')
								}}
								placeholder="Select min date..."
								value={f.state.value ? new Date(f.state.value) : undefined}
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="maxDate">
					{(f) => (
						<div className="field-type date">
							<label className="field-label">Max Date</label>
							<DatePicker
								onChange={(date: Date) => {
									f.handleChange(date ? date.toISOString().split('T')[0] : '')
								}}
								placeholder="Select max date..."
								value={f.state.value ? new Date(f.state.value) : undefined}
							/>
						</div>
					)}
				</form.Field>
			</AdvancedFields>
		</>
	)
}

export function DateFieldEditor({ field }: DateFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={dateFieldSchema}>
			<DateFieldEditorContent />
		</EditorTabs>
	)
}
