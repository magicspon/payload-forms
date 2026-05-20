import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import { Checkbox } from '../../ui/Checkbox'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/Field'
import type { ConsentFieldProps } from '@spon/payload-forms/form'

export default function ConsentField(props: ConsentFieldProps) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field orientation="horizontal">
      <Checkbox
        id={props.name}
        checked={field.state.value}
        onChange={(e) => field.handleChange(e.target.checked)}
        onBlur={field.handleBlur}
      />
      <FieldLabel htmlFor={props.name}>
        {props.label}
        {props.required && <span aria-hidden="true"> *</span>}
      </FieldLabel>
      {props.instructions && <FieldDescription>{props.instructions}</FieldDescription>}
      <FieldError errors={errorsToProps(errors)} />
    </Field>
  )
}
