import type { DateField, DateFieldEditorProps } from '@/shared/fieldSchema'

import {
  AdvancedFields,
  Divider,
  GeneralFields,
} from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { dateFieldSchema } from '@/shared/fieldSchema'
import { DatePicker } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

type DateFieldName = 'defaultValue' | 'maxDate' | 'minDate'

/** A labeled DatePicker bound to a `YYYY-MM-DD` string field on the date editor form. */
function DateFieldInput({
  label,
  name,
  placeholder,
}: {
  label: string
  name: DateFieldName
  placeholder: string
}) {
  const form = useFormContext<DateField>()

  return (
    <form.Field name={name}>
      {(f) => (
        <div className="field-type date">
          <p className="field-label">{label}</p>
          <DatePicker
            onChange={(date: Date) => {
              f.handleChange(date ? date.toISOString().split('T')[0] : '')
            }}
            placeholder={placeholder}
            value={f.state.value ? new Date(f.state.value) : undefined}
          />
        </div>
      )}
    </form.Field>
  )
}

export function DateFieldEditorContent() {
  return (
    <>
      <GeneralFields />
      <Divider />
      <AdvancedFields exclude={['defaultValue']}>
        <DateFieldInput label="Default Value" name="defaultValue" placeholder="Select date..." />
        <DateFieldInput label="Min Date" name="minDate" placeholder="Select min date..." />
        <DateFieldInput label="Max Date" name="maxDate" placeholder="Select max date..." />
      </AdvancedFields>
    </>
  )
}

export function DateFieldEditor({ field }: DateFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={dateFieldSchema}>
      <DateFieldEditorContent />
    </EditorTabs>
  )
}
