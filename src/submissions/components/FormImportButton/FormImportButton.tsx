import type { BeforeListServerProps } from 'payload'

import { FormImportButtonClient } from './FormImportButton.client'

export type FormOption = {
	id: string
	title: string
}

export async function FormImportButton({
	payload,
	formsSlug = 'forms',
}: BeforeListServerProps & { formsSlug?: string }) {
	const result = await payload.find({
		collection: formsSlug as 'forms',
		depth: 0,
		pagination: false,
		select: { title: true },
	})

	const forms: FormOption[] = result.docs
		.filter((doc) => doc.title)
		.map((doc) => ({ id: String(doc.id), title: String(doc.title) }))

	if (!forms.length) {return null}

	return <FormImportButtonClient forms={forms} />
}
