import type { AnyFieldApi } from '@/form-builder/context/EditorFormContext'

import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import { type FieldConditions } from '@/shared/fieldSchema'
import { ConditionBuilder } from '@/shared/conditions'
import { useField } from '@payloadcms/ui'

type ConditionEditorProps = {
  currentFieldId: string
  field: AnyFieldApi
}

export function ConditionEditor({ currentFieldId, field }: ConditionEditorProps) {
  const { value: pages = [] } = useField<FormPage[]>({ path: 'pages' })

  const availableFields = getAllFields(pages).filter(
    (f) => f.id !== currentFieldId && f.type !== 'message',
  )

  const conditions = field.state.value as FieldConditions | undefined

  return (
    <ConditionBuilder
      availableFields={availableFields}
      emptyFieldsText="Add more fields to enable conditional visibility"
      headerLabel="Conditional Visibility"
      includeTestIds
      namePrefix="condition"
      noConditionsText="No conditions set. This field is always visible."
      onChange={(next) => field.handleChange(next ?? undefined)}
      value={conditions}
    />
  )
}
