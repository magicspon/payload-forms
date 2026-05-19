'use client'

import { formOpts, useTypedAppFormContext } from '../hooks/useForm'
import { makeValidator } from '../utils'
import { subFieldZodSchema } from '../utils/subFieldSchema'
import {
	FieldDescription,
	FieldLegend,
	FieldSet,
} from '../../ui/Field'
import type { GroupFieldProps } from '@spon/payload-forms/form'

export default function GroupField(props: GroupFieldProps) {
	const form = useTypedAppFormContext(formOpts)
	const rows = props.rows ?? []

	return (
		<FieldSet>
			<FieldLegend>
				{props.label}
				{props.required && <span aria-hidden="true"> *</span>}
			</FieldLegend>
			{props.instructions && (
				<FieldDescription>{props.instructions}</FieldDescription>
			)}
			<div>
				{rows.map((row) => (
					<div key={row.id}>
						{row.columns.map((subField) => {
							const path = `${props.name}.${subField.name}`
							const validator = makeValidator(subField, subFieldZodSchema(subField))

							if (subField.type === 'radio') {
								return (
									<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
										{(f) => <f.RadioField {...subField} />}
									</form.AppField>
								)
							}
							if (subField.type === 'checkbox') {
								return (
									<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
										{(f) => <f.CheckboxField {...subField} />}
									</form.AppField>
								)
							}
							if (subField.type === 'toggle') {
								return (
									<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
										{(f) => <f.ToggleField {...subField} />}
									</form.AppField>
								)
							}
							if (subField.type === 'consent') {
								return (
									<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
										{(f) => <f.ConsentField {...subField} />}
									</form.AppField>
								)
							}
							if (subField.type === 'select') {
								return (
									<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
										{(f) => <f.SelectField {...subField} />}
									</form.AppField>
								)
							}
							if (subField.type === 'textarea') {
								return (
									<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
										{(f) => <f.TextareaField {...subField} />}
									</form.AppField>
								)
							}
							if (subField.type === 'file') {
								return (
									<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
										{(f) => <f.FileField {...subField} />}
									</form.AppField>
								)
							}
							if (subField.type === 'date') {
								return (
									<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
										{(f) => <f.DateField {...subField} />}
									</form.AppField>
								)
							}
							return (
								<form.AppField key={subField.name} name={path} validators={{ onBlur: validator }}>
									{(f) => <f.TextField {...subField} />}
								</form.AppField>
							)
						})}
					</div>
				))}
			</div>
		</FieldSet>
	)
}
