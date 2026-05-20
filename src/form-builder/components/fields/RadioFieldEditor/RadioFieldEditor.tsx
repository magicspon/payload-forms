import type { RadioField, RadioFieldEditorProps } from '@/shared/fieldSchema'

import { OptionsEditor } from '@/form-builder/components/shared/OptionsEditor'
import {
  AdvancedFields,
  Divider,
  GeneralFields,
} from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { radioFieldSchema } from '@/shared/fieldSchema'
import '@/form-builder/hooks/useSaveEditor'
import { SelectInput } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

export function RadioFieldEditorContent() {
  const form = useFormContext<RadioField>()

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
                  isClearable
                  label="Default Value"
                  name="defaultValue"
                  onChange={(option) => {
                    const value = option ? (option as { value: string }).value : ''
                    f.handleChange(value)
                  }}
                  options={options.map((opt) => ({
                    label: opt.label || opt.value,
                    value: opt.value,
                  }))}
                  path="defaultValue"
                  placeholder="Select default..."
                  value={f.state.value ?? ''}
                />
              )}
            </form.Subscribe>
          )}
        </form.Field>
      </AdvancedFields>
    </>
  )
}

export function RadioFieldEditor({ field }: RadioFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={radioFieldSchema}>
      <RadioFieldEditorContent />
    </EditorTabs>
  )
}
