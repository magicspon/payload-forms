import type { FileFieldProps, FileFieldValue, LocalFileValue } from '@spon/payload-forms/form'

import { useStore } from '@tanstack/react-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/Field'
import { Input } from '../../ui/Input'
import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps } from '../utils'

export default function FileField(props: FileFieldProps) {
  const field = useFieldContext<FileFieldValue>()
  const errors = useStore(field.store, (state) => state.meta.errors)
  const value = useStore(field.store, (state) => state.value) ?? []

  const hasRemote = value.some((e) => e.kind === 'remote')
  const isMultiple = (props.maxFiles ?? 1) !== 1

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : []
    const newEntries: LocalFileValue[] = files.map((file) => ({
      kind: 'local',
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    // Keep existing remote entries, replace local entries with new selection
    const remoteEntries = value.filter((e) => e.kind === 'remote')
    field.handleChange([...remoteEntries, ...newEntries])
  }

  function handleRemoveLocal(index: number) {
    const entry = value[index]
    if (entry?.kind === 'local' && entry.previewUrl) {
      URL.revokeObjectURL(entry.previewUrl)
    }
    field.handleChange(value.filter((_, i) => i !== index))
  }

  return (
    <Field>
      <FieldLabel htmlFor={props.name}>
        {props.label}
        {props.required && <span aria-hidden="true"> *</span>}
      </FieldLabel>

      {value.length > 0 && (
        <ul>
          {value.map((entry, i) =>
            entry.kind === 'remote' ? (
              <li key={entry.id}>
                <a href={entry.url} rel="noreferrer" target="_blank">
                  {entry.filename}
                </a>
              </li>
            ) : (
              <li key={i}>
                <span>{entry.file.name}</span>
                <button onClick={() => handleRemoveLocal(i)} type="button">
                  Remove
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {!hasRemote && (
        <Input
          accept={props.allowedFileTypes}
          id={props.name}
          multiple={isMultiple}
          onBlur={field.handleBlur}
          onChange={handleChange}
          type="file"
        />
      )}

      {props.instructions && <FieldDescription>{props.instructions}</FieldDescription>}
      <FieldError errors={errorsToProps(errors)} />
    </Field>
  )
}
