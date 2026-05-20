'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import * as React from 'react'

export function FormSubmissionViewButton() {
  const { initialData } = useDocumentInfo()
  const formId = (initialData as Record<string, unknown>)?.form

  if (!formId) {
    return null
  }

  const formIdStr =
    typeof formId === 'object'
      ? (formId as { id: string }).id
      : String(formId as bigint | boolean | number | string)

  return (
    <Button el="link" to={`/admin/collections/forms/${formIdStr}/submissions`}>
      View all submissions
    </Button>
  )
}
