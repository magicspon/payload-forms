import type { CheckboxField, CheckboxFieldEditorProps } from '@/shared/fieldSchema'

import { OptionsEditor } from '@/form-builder/components/shared/OptionsEditor'
import {
  AdvancedFields,
  Divider,
  GeneralFields,
} from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { checkboxFieldSchema } from '@/shared/fieldSchema'
import { SelectInput } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

export function CheckboxFieldEditorContent() {
  const form = useFormContext<CheckboxField>()

  return (
    <>
      <GeneralFields>
        <form.Field name="options">
          {(f) => (
            <OptionsEditor
              onChange={(options) => f.handleChange(options)}
              options={f.state.value}
            />
          )}
        </form.Field>
      </GeneralFields>
      <Divider />
      <AdvancedFields exclude={['defaultValue']}>
        <form.Field name="defaultValue">
          {(f) => (
            <form.Subscribe selector={(state) => state.values.options}>
              {(options) => (
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
                  options={options.map((opt) => ({
                    label: opt.label || opt.value,
                    value: opt.value,
                  }))}
                  path="defaultValue"
                  placeholder="Select defaults..."
                  value={f.state.value ?? []}
                />
              )}
            </form.Subscribe>
          )}
        </form.Field>
      </AdvancedFields>
    </>
  )
}

export function CheckboxFieldEditor({ field }: CheckboxFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={checkboxFieldSchema}>
      <CheckboxFieldEditorContent />
    </EditorTabs>
  )
}
