'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import * as React from 'react'

export function FormSubmissionViewButton() {
	const { initialData } = useDocumentInfo()
	const formId = (initialData as Record<string, unknown>)?.form

	if (!formId) {return null}

	return (
		<Button el="link" to={`/admin/collections/forms/${formId}/submissions`}>
			View all submissions
		</Button>
	)
}
