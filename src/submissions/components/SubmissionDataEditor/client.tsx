'use client'

import type { FormPage } from '@/form-builder/utils/formTree'
import type { Field, MessageField } from '@/shared/fieldSchema'

import { getAllFields } from '@/form-builder/utils/formTree'
import { useField, usePayloadAPI } from '@payloadcms/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'

import styles from './client.module.css'
import { FieldRenderer } from './FieldRenderer'

type NonMessageField = Exclude<Field, MessageField>

interface SubmissionDataEditorClientProps {
  formsSlug: string
  formUploadsSlug: string
  initialData: Record<string, unknown>
  initialFields: NonMessageField[]
  initialFormId: null | string
}

/** (FR-submissions) Client component: syncs individual field changes into the submissionData JSON field. */
export function SubmissionDataEditorClient({
  formsSlug,
  formUploadsSlug,
  initialFields,
  initialFormId,
}: SubmissionDataEditorClientProps) {
  const { setValue, value } = useField<Record<string, unknown>>({
    path: 'submissionData',
  })

  const { value: formValue } = useField<{ id: string } | null | string>({
    path: 'form',
  })

  const formId =
    typeof formValue === 'object' && formValue !== null ? formValue.id : (formValue ?? null)

  // Only re-fetch when the user switches to a different form in the admin UI.
  const isDynamic = Boolean(formId) && formId !== initialFormId

  const [{ data: formDoc, isLoading }] = usePayloadAPI(
    isDynamic ? `/api/${formsSlug}/${formId}` : '',
    { initialParams: { depth: 0 } },
  )

  const fetchedFields = useMemo<NonMessageField[]>(
    () =>
      formDoc
        ? getAllFields((formDoc.pages ?? []) as FormPage[]).filter(
            (f): f is NonMessageField => f.type !== 'message',
          )
        : [],
    [formDoc],
  )

  const fields = isDynamic ? fetchedFields : initialFields

  // Clear submissionData when the user switches to a different form
  const [prevFormId, setPrevFormId] = useState(formId)
  useEffect(() => {
    if (formId !== prevFormId) {
      setValue({})
      setPrevFormId(formId)
    }
  }, [formId, prevFormId, setValue])

  const data = useMemo(() => value ?? {}, [value])

  const handleChange = useCallback(
    (fieldName: string, fieldValue: unknown) => {
      setValue({ ...data, [fieldName]: fieldValue })
    },
    [data, setValue],
  )

  if (isLoading) {
    return <p>Loading fields…</p>
  }
  if (!fields.length) {
    return null
  }

  return (
    <div className={styles.grid}>
      {fields.map((field) => (
        <FieldRenderer
          field={field}
          formUploadsSlug={formUploadsSlug}
          key={field.id}
          onChange={(v) => handleChange(field.name, v)}
          value={data[field.name]}
        />
      ))}
    </div>
  )
}
