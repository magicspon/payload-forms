import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'
import { useStore } from '@tanstack/react-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/Field'
import { Input } from '../../ui/Input'
import type { FileFieldProps } from '@spon/payload-forms/form'

export default function FileField(props: FileFieldProps) {
  const field = useFieldContext<File[]>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      <FieldLabel htmlFor={props.name}>
        {props.label}
        {props.required && <span aria-hidden="true"> *</span>}
      </FieldLabel>
      <Input
        type="file"
        id={props.name}
        accept={props.allowedFileTypes}
        multiple={props.multiple}
        onChange={(e) => field.handleChange(e.target.files ? Array.from(e.target.files) : [])}
        onBlur={field.handleBlur}
      />
      {props.instructions && <FieldDescription>{props.instructions}</FieldDescription>}
      <FieldError errors={errorsToProps(errors)} />
    </Field>
  )
}
