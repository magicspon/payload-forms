import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/Field'
import { Input } from '../../ui/Input'
import { EmailFieldProps, NumberFieldProps, TextFieldProps } from '@spon/payload-forms/form'

export default function TextField(props: TextFieldProps | EmailFieldProps | NumberFieldProps) {
  const field = useFieldContext<string | number>()
  const errors = useStore(field.store, (state) => state.meta.errors)
  const inputType = props.type === 'email' ? 'email' : props.type === 'number' ? 'number' : 'text'

  return (
    <Field>
      <FieldLabel htmlFor={props.name}>
        {props.label}
        {props.required && <span aria-hidden="true"> *</span>}
      </FieldLabel>
      <Input
        type={inputType}
        id={props.name}
        placeholder={'placeholder' in props ? props.placeholder : undefined}
        min={'min' in props ? props.min : undefined}
        max={'max' in props ? props.max : undefined}
        step={'step' in props ? props.step : undefined}
        minLength={'minLength' in props ? props.minLength : undefined}
        maxLength={'maxLength' in props ? props.maxLength : undefined}
        value={field.state.value as string | number}
        onChange={(e) =>
          props.type === 'number'
            ? field.handleChange(Number.isNaN(e.target.valueAsNumber) ? '' : e.target.valueAsNumber)
            : field.handleChange(e.target.value)
        }
        onBlur={field.handleBlur}
      />
      {props.instructions && <FieldDescription>{props.instructions}</FieldDescription>}
      <FieldError errors={errorsToProps(errors)} />
    </Field>
  )
}
