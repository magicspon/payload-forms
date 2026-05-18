'use client'

import { useDocumentInfo  } from '@payloadcms/ui'
import * as React from 'react'

import { generateTemplateHeaders } from '../../../utils/csvTemplateUtils'

function downloadCSV(csv: string, filename: string): void {
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}

/**
 * Renders a "Download CSV Template" button in the form document controls.
 * The template CSV contains one header row derived from the form's current
 * schema, plus one blank data row as a fill-in hint.
 */
export function FormCSVTemplateButton() {
	const { data } = useDocumentInfo()

	const pages = (data as Record<string, unknown> | undefined)?.pages as
		| undefined
		| unknown[]

	const slug =
		((data as Record<string, unknown> | undefined)?.slug as
			| string
			| undefined) ?? 'form'

	const hasPages = Array.isArray(pages) && pages.length > 0

	function handleDownload() {
		if (!hasPages) {return}

		const headers = generateTemplateHeaders(pages as never)
		const blankRow = headers.map(() => '').join(',')
		const csv = [headers.join(','), blankRow].join('\n')

		downloadCSV(csv, `${slug}-template.csv`)
	}

	return (
		<button
			className="popup-button-list__button"
			disabled={!hasPages}
			id="download-import-template"
			onClick={handleDownload}
			type="button"
		>
			Download Import Template
		</button>
	)
}
