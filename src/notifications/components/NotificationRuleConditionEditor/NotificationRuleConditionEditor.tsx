'use client'

import type { JSONFieldClientProps } from 'payload'

import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import { type Field, type FieldConditions } from '@/shared/fieldSchema'
import { ConditionBuilder } from '@/shared/conditions'
import { useConfig, useField } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import styles from './NotificationRuleConditionEditor.module.css'

type NotificationRuleConditionEditorProps = JSONFieldClientProps

export function NotificationRuleConditionEditor({ path }: NotificationRuleConditionEditorProps) {
  const { config } = useConfig()
  const serverURL = config.serverURL

  const { value: formValue } = useField<{ id: string } | null | string>({
    path: 'form',
  })

  const { setValue: setConditions, value: conditions } = useField<FieldConditions | null>({ path })

  const [availableFields, setAvailableFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(false)

  const formId = formValue && typeof formValue === 'object' ? formValue.id : formValue

  useEffect(() => {
    if (!formId) {
      setAvailableFields([])
      return
    }

    setLoading(true)

    fetch(`${serverURL}/api/forms/${formId}?depth=0`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { pages?: FormPage[] } | null) => {
        const pages = data?.pages ?? []
        setAvailableFields(getAllFields(pages).filter((f) => f.type !== 'message'))
      })
      .catch(() => setAvailableFields([]))
      .finally(() => setLoading(false))
  }, [formId, serverURL])

  if (!formId) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>Select a form above to configure field conditions</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>Loading form fields…</p>
      </div>
    )
  }

  return (
    <ConditionBuilder
      allowChangeOperators
      availableFields={availableFields}
      emptyFieldsText="No fields found on the selected form"
      headerLabel="Send Conditions"
      namePrefix="notif-rule-condition"
      noConditionsText="No conditions set. This notification fires whenever the trigger event occurs."
      onChange={setConditions}
      value={conditions}
    />
  )
}
