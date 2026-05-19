import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import { Checkbox } from '../../ui/Checkbox'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLegend,
	FieldSet,
} from '../../ui/Field'
import { Label } from '../../ui/Label'
import type { CheckboxFieldProps } from '@spon/payload-forms/form'

export default function CheckboxField(props: CheckboxFieldProps) {
	const field = useFieldContext<string[]>()
	const errors = useStore(field.store, (state) => state.meta.errors)

	return (
		<FieldSet>
			<FieldLegend>
				{props.label}
				{props.required && <span aria-hidden="true"> *</span>}
			</FieldLegend>
			<div className="grid gap-4">
				{props.options.map((option: CheckboxFieldProps['options'][number]) => (
					<Field key={option.value} orientation="horizontal">
						<Checkbox
							id={`${props.name}-${option.value}`}
							checked={field.state.value.includes(option.value)}
							onChange={(e) => {
								const current = field.state.value
								field.handleChange(
									e.target.checked
										? [...current, option.value]
										: current.filter((v) => v !== option.value),
								)
							}}
							onBlur={field.handleBlur}
						/>
						<Label htmlFor={`${props.name}-${option.value}`}>
							{option.label}
						</Label>
					</Field>
				))}
			</div>
			{props.instructions && (
				<FieldDescription>{props.instructions}</FieldDescription>
			)}
			<FieldError errors={errorsToProps(errors)} />
		</FieldSet>
	)
}
