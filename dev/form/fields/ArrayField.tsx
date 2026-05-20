'use client'

import { formOpts, useTypedAppFormContext } from '../hooks/useForm'
import { useFieldContext } from '../hooks/useFormContext'
import { errorsToProps, makeValidator } from '../utils'
import { useStore } from '@tanstack/react-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../ui/Field'
import type { ArrayFieldProps, ArrayItemValue } from '@spon/payload-forms/form'
import { subFieldZodSchema } from '../utils/subFieldSchema'

function buildItemDefaults(rows: NonNullable<ArrayFieldProps['rows']>): ArrayItemValue {
  const defaults: ArrayItemValue = {}
  for (const row of rows) {
    for (const subField of row.columns) {
      if (subField.type === 'checkbox') {
        defaults[subField.name] = (subField.defaultValue as string[]) ?? []
      } else if (subField.type === 'toggle' || subField.type === 'consent') {
        defaults[subField.name] = (subField.defaultValue as boolean) ?? false
      } else if ('defaultValue' in subField && subField.defaultValue !== undefined) {
        defaults[subField.name] = subField.defaultValue as string | number
      } else {
        defaults[subField.name] = ''
      }
    }
  }
  return defaults
}

export default function ArrayField(props: ArrayFieldProps) {
  const field = useFieldContext<ArrayItemValue[]>()
  const form = useTypedAppFormContext(formOpts)
  const errors = useStore(field.store, (s) => s.meta.errors)
  const items = (field.state.value ?? []) as ArrayItemValue[]

  const rows = props.rows ?? []
  const canAdd = props.maxRows == null || items.length < props.maxRows
  const canRemove = items.length > (props.minRows ?? 0)

  function addItem() {
    field.pushValue(buildItemDefaults(rows))
  }

  function removeItem(index: number) {
    field.removeValue(index)
  }

  function moveUp(index: number) {
    field.swapValues(index - 1, index)
  }

  function moveDown(index: number) {
    field.swapValues(index, index + 1)
  }

  return (
    <Field>
      <FieldLabel>
        {props.label}
        {props.required && <span aria-hidden="true"> *</span>}
      </FieldLabel>

      {props.instructions && <FieldDescription>{props.instructions}</FieldDescription>}

      <div className="space-y-4">
        {items.map((_, index) => (
          <div
            key={index}
            className="border border-(--color-elevation-150) rounded p-4 bg-(--color-elevation-50)"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-(--color-elevation-700)">
                Item {index + 1}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="bg-transparent cursor-pointer border border-(--color-elevation-150) rounded px-2 py-1 text-xs disabled:opacity-25"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === items.length - 1}
                  className="bg-transparent cursor-pointer border border-(--color-elevation-150) rounded px-2 py-1 text-xs disabled:opacity-25"
                  title="Move down"
                >
                  ↓
                </button>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="bg-transparent cursor-pointer border border-(--color-elevation-150) rounded px-2 py-1 text-xs text-red-600"
                    title="Remove item"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${row.columns.length}, minmax(0, 1fr))`,
                  }}
                >
                  {row.columns.map((subField) => {
                    const path = `${props.name}[${index}].${subField.name}`
                    const validator = makeValidator(subField, subFieldZodSchema(subField))

                    if (subField.type === 'radio') {
                      return (
                        <form.AppField
                          key={subField.name}
                          name={path}
                          validators={{ onBlur: validator }}
                        >
                          {(f) => <f.RadioField {...subField} />}
                        </form.AppField>
                      )
                    }
                    if (subField.type === 'checkbox') {
                      return (
                        <form.AppField
                          key={subField.name}
                          name={path}
                          validators={{ onBlur: validator }}
                        >
                          {(f) => <f.CheckboxField {...subField} />}
                        </form.AppField>
                      )
                    }
                    if (subField.type === 'toggle') {
                      return (
                        <form.AppField
                          key={subField.name}
                          name={path}
                          validators={{ onBlur: validator }}
                        >
                          {(f) => <f.ToggleField {...subField} />}
                        </form.AppField>
                      )
                    }
                    if (subField.type === 'consent') {
                      return (
                        <form.AppField
                          key={subField.name}
                          name={path}
                          validators={{ onBlur: validator }}
                        >
                          {(f) => <f.ConsentField {...subField} />}
                        </form.AppField>
                      )
                    }
                    if (subField.type === 'select') {
                      return (
                        <form.AppField
                          key={subField.name}
                          name={path}
                          validators={{ onBlur: validator }}
                        >
                          {(f) => <f.SelectField {...subField} />}
                        </form.AppField>
                      )
                    }
                    if (subField.type === 'textarea') {
                      return (
                        <form.AppField
                          key={subField.name}
                          name={path}
                          validators={{ onBlur: validator }}
                        >
                          {(f) => <f.TextareaField {...subField} />}
                        </form.AppField>
                      )
                    }
                    if (subField.type === 'file') {
                      return (
                        <form.AppField
                          key={subField.name}
                          name={path}
                          validators={{ onBlur: validator }}
                        >
                          {(f) => <f.FileField {...subField} />}
                        </form.AppField>
                      )
                    }
                    if (subField.type === 'date') {
                      return (
                        <form.AppField
                          key={subField.name}
                          name={path}
                          validators={{ onBlur: validator }}
                        >
                          {(f) => <f.DateField {...subField} />}
                        </form.AppField>
                      )
                    }
                    // text / email / number
                    return (
                      <form.AppField
                        key={subField.name}
                        name={path}
                        validators={{ onBlur: validator }}
                      >
                        {(f) => <f.TextField {...subField} />}
                      </form.AppField>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {canAdd && (
        <button type="button" onClick={addItem}>
          Add item
        </button>
      )}

      <FieldError errors={errorsToProps(errors)} />
    </Field>
  )
}
