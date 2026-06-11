import type { CheckboxField, RadioField, SelectField } from '@/shared/fieldSchema'

import { OptionsEditor } from '@/form-builder/components/shared/OptionsEditor'
import {
  AdvancedFields,
  Divider,
  GeneralFields,
} from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { SelectInput } from '@payloadcms/ui'

type OptionsField = CheckboxField | RadioField | SelectField

type OptionsFieldEditorContentProps = {
  /** Render the default-value control as a multi-select (`string[]`) instead of a single select (`string`). */
  multiple?: boolean
}

/**
 * Shared editor body for the option-based fields (checkbox / radio / select). All three
 * render an {@link OptionsEditor} plus a default-value control derived from the live options;
 * `multiple` switches the default-value control between a `hasMany` multi-select (checkbox)
 * and a single select (radio/select).
 */
export function OptionsFieldEditorContent({ multiple = false }: OptionsFieldEditorContentProps) {
  const form = useFormContext<OptionsField>()

  return (
    <>
      <GeneralFields>
        <form.Field name="options">
          {(f) => (
            <OptionsEditor onChange={(options) => f.handleChange(options)} options={f.state.value} />
          )}
        </form.Field>
      </GeneralFields>
      <Divider />
      <AdvancedFields exclude={['defaultValue']}>
        <form.Field name="defaultValue">
          {(f) => (
            <form.Subscribe selector={(state) => state.values.options}>
              {(options) => {
                const selectOptions = options.map((opt) => ({
                  label: opt.label || opt.value,
                  value: opt.value,
                }))

                return multiple ? (
                  <SelectInput
                    hasMany
                    isClearable
                    label="Default Values"
                    name="defaultValue"
                    onChange={(selectedOptions) => {
                      const values = selectedOptions
                        ? (selectedOptions as { value: string }[]).map((opt) => opt.value)
                        : []
                      f.handleChange(values)
                    }}
                    options={selectOptions}
                    path="defaultValue"
                    placeholder="Select defaults..."
                    value={(f.state.value as string[]) ?? []}
                  />
                ) : (
                  <SelectInput
                    isClearable
                    label="Default Value"
                    name="defaultValue"
                    onChange={(option) => {
                      const value = option ? (option as { value: string }).value : ''
                      f.handleChange(value)
                    }}
                    options={selectOptions}
                    path="defaultValue"
                    placeholder="Select default..."
                    value={(f.state.value as string) ?? ''}
                  />
                )
              }}
            </form.Subscribe>
          )}
        </form.Field>
      </AdvancedFields>
    </>
  )
}
