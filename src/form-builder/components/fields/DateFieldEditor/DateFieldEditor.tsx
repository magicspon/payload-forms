import type { DateField, DateFieldEditorProps } from '@/shared/fieldSchema'

import { AdvancedFields, Divider, GeneralFields } from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { dateFieldSchema } from '@/shared/fieldSchema'
import { DatePicker } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

export function DateFieldEditorContent() {
	const form = useFormContext<DateField>()

	return (
		<>
			<GeneralFields />
			<Divider />
			<AdvancedFields exclude={['defaultValue']}>
				<form.Field name="defaultValue">
					{(f) => (
						<div className="field-type date">
							<p className="field-label">Default Value</p>
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
							<p className="field-label">Min Date</p>
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
							<p className="field-label">Max Date</p>
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
