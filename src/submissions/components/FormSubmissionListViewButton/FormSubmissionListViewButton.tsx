'use client'

import { Button } from '@payloadcms/ui'
import * as React from 'react'

export function FormSubmissionListViewButton() {
  return (
    <Button el="link" to={`/admin/form-submissions`}>
      Submission table
    </Button>
  )
}
