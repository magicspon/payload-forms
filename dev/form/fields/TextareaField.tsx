import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/Field'
import { Textarea } from '../../ui/Textarea'
import type { TextareaFieldProps } from '@spon/payload-forms/form'

export default function TextareaField(props: TextareaFieldProps) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      <FieldLabel htmlFor={props.name}>
        {props.label}
        {props.required && <span aria-hidden="true"> *</span>}
      </FieldLabel>
      <Textarea
        id={props.name}
        placeholder={props.placeholder}
        rows={props.rows}
        maxLength={props.maxLength}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
      {props.instructions && <FieldDescription>{props.instructions}</FieldDescription>}
      <FieldError errors={errorsToProps(errors)} />
    </Field>
  )
}
