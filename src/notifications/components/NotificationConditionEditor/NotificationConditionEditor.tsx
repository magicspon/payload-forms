'use client'

import type { JSONFieldClientProps } from 'payload'

import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import { type FieldConditions } from '@/shared/fieldSchema'
import { ConditionBuilder } from '@/shared/conditions'
import { useField } from '@payloadcms/ui'

type NotificationConditionEditorProps = JSONFieldClientProps

export function NotificationConditionEditor({ path }: NotificationConditionEditorProps) {
  const { value: pages = [] } = useField<FormPage[]>({ path: 'pages' })
  const { setValue: setConditions, value: conditions } = useField<FieldConditions | null>({ path })

  const availableFields = getAllFields(pages).filter((f) => f.type !== 'message')

  return (
    <ConditionBuilder
      availableFields={availableFields}
      emptyFieldsText="Add form fields to enable conditional notifications"
      headerLabel="Send Conditions"
      namePrefix="notification-condition"
      noConditionsText="No conditions set. This notification is always sent."
      onChange={setConditions}
      value={conditions}
    />
  )
}
