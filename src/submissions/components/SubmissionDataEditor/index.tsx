import type { FormPage } from '@/form-builder/utils/formTree'
import type { Field, MessageField } from '@/shared/fieldSchema'
import type { UIFieldServerProps } from 'payload'

import { getAllFields } from '@/form-builder/utils/formTree'

import { SubmissionDataEditorClient } from './client'

type NonMessageField = Exclude<Field, MessageField>

interface SubmissionDataEditorProps extends UIFieldServerProps {
  formsSlug: string
  formUploadsSlug: string
}

/** (FR-submissions) RSC: fetches the live form/dataset definition and renders the submission data as native Payload fields. */
export async function SubmissionDataEditor({
  data,
  formsSlug,
  formUploadsSlug,
  payload,
}: SubmissionDataEditorProps) {
  const formId: string = data?.form?.id

  let initialFields: NonMessageField[] = []

  if (formId) {
    const form = await payload.findByID({
      id: formId,
      collection: formsSlug as 'forms',
      depth: 0,
    })

    if (form) {
      initialFields = getAllFields((form as unknown as { pages: FormPage[] }).pages ?? []).filter(
        (f): f is NonMessageField => f.type !== 'message',
      )
    }
  }

  return (
    <SubmissionDataEditorClient
      formsSlug={formsSlug}
      formUploadsSlug={formUploadsSlug}
      initialData={(data?.submissionData as Record<string, unknown>) ?? {}}
      initialFields={initialFields}
      initialFormId={formId ? String(formId) : null}
    />
  )
}
