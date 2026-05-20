import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/Field'
import { Switch } from '../../ui/Switch'
import type { ToggleFieldProps } from '@spon/payload-forms/form'

export default function ToggleField(props: ToggleFieldProps) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field orientation="horizontal">
      <Switch
        id={props.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
      <FieldLabel htmlFor={props.name}>{props.label}</FieldLabel>
      {props.instructions && <FieldDescription>{props.instructions}</FieldDescription>}
      <FieldError errors={errorsToProps(errors)} />
    </Field>
  )
}
