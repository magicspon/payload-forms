import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLegend,
	FieldSet,
} from '../../ui/Field'
import { Label } from '../../ui/Label'
import { RadioGroup, RadioGroupItem } from '../../ui/RadioGroup'
import type { RadioFieldProps } from '@spon/payload-forms/form'

export default function RadioField(props: RadioFieldProps) {
	const field = useFieldContext<string>()
	const errors = useStore(field.store, (state) => state.meta.errors)

	return (
		<FieldSet>
			<FieldLegend>
				{props.label}
				{props.required && <span aria-hidden="true"> *</span>}
			</FieldLegend>
			<RadioGroup className="grid gap-4">
				{props.options.map((option: RadioFieldProps['options'][number]) => (
					<Field key={option.value} orientation="horizontal">
						<RadioGroupItem
							id={`${props.name}-${option.value}`}
							name={props.name}
							value={option.value}
							checked={field.state.value === option.value}
							onChange={() => field.handleChange(option.value)}
							onBlur={field.handleBlur}
						/>
						<Label htmlFor={`${props.name}-${option.value}`}>
							{option.label}
						</Label>
					</Field>
				))}
			</RadioGroup>
			{props.instructions && (
				<FieldDescription>{props.instructions}</FieldDescription>
			)}
			<FieldError errors={errorsToProps(errors)} />
		</FieldSet>
	)
}
