import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from '../../ui/Field'
import { NativeSelect, NativeSelectOption } from '../../ui/NativeSelect'
import type { SelectFieldProps } from '@spon/payload-forms/form'

export default function SelectField(props: SelectFieldProps) {
	const field = useFieldContext<string>()
	const errors = useStore(field.store, (state) => state.meta.errors)

	return (
		<Field>
			<FieldLabel htmlFor={props.name}>
				{props.label}
				{props.required && <span aria-hidden="true"> *</span>}
			</FieldLabel>
			<NativeSelect
				id={props.name}
				value={field.state.value}
				onChange={(e) => field.handleChange(e.target.value)}
				onBlur={field.handleBlur}
			>
				{props.placeholder && (
					<NativeSelectOption value="">{props.placeholder}</NativeSelectOption>
				)}
				{props.options.map((option: SelectFieldProps['options'][number]) => (
					<NativeSelectOption key={option.value} value={option.value}>
						{option.label}
					</NativeSelectOption>
				))}
			</NativeSelect>
			{props.instructions && (
				<FieldDescription>{props.instructions}</FieldDescription>
			)}
			<FieldError errors={errorsToProps(errors)} />
		</Field>
	)
}
