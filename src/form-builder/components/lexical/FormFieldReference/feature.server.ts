import { createServerFeature } from '@payloadcms/richtext-lexical'

export const FormFieldReferenceFeature = createServerFeature({
	feature: {
		ClientFeature:
			'@spon/payload-forms/client#FormFieldReferenceClientFeature',
	},
	key: 'formFieldReference',
})
