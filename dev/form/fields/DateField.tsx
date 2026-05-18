import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from '../../ui/Field'
import type { DateFieldProps } from '@spon/payload-forms/form'
import { Input } from '../../ui/Input'

export default function DateField(props: DateFieldProps) {
	const field = useFieldContext<string>()
	const errors = useStore(field.store, (state) => state.meta.errors)

	return (
		<Field>
			<FieldLabel htmlFor={props.name}>
				{props.label}
				{props.required && <span aria-hidden="true"> *</span>}
			</FieldLabel>
			<Input
				type="date"
				id={props.name}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
			/>
			{props.instructions && (
				<FieldDescription>{props.instructions}</FieldDescription>
			)}
			<FieldError errors={errorsToProps(errors)} />
		</Field>
	)
}
