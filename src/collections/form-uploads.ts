import type { CollectionConfig, CollectionSlug, Field } from 'payload'

/** Build the form-uploads CollectionConfig. */
export function buildFormUploadsCollection(opts: {
  /** Slug of the forms collection. Defaults to `'forms'`. */
  formsSlug?: string
  /** Collection slug. Defaults to `'form-uploads'`. */
  slug?: string
  /** Slug of the submissions collection. Defaults to `'submissions'`. */
  submissionsSlug?: string
}): CollectionConfig {
  const { slug = 'form-uploads', formsSlug = 'forms', submissionsSlug = 'submissions' } = opts

  const fields: Field[] = [
    {
      name: 'form',
      type: 'relationship',
      admin: {
        description: 'The form this file was uploaded through',
        readOnly: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion this is required by next for the e2e tests
      relationTo: formsSlug as CollectionSlug,
    },
    {
      name: 'submission',
      type: 'relationship',
      admin: {
        description: 'The submission this file belongs to',
        readOnly: true,
			},
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion this is required by next for the e2e tests
      relationTo: submissionsSlug as CollectionSlug,
    },
    {
      name: 'fieldName',
      type: 'text',
      admin: {
        description: 'The form field name this file was uploaded to',
        readOnly: true,
      },
    },
  ]

  return {
    slug,
    admin: {
      description: 'Files uploaded via form submissions',
      group: 'Forms',
      useAsTitle: 'filename',
    },
    fields,
    labels: { plural: 'Form Uploads', singular: 'Form Upload' },
    upload: {
      mimeTypes: [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ],
    },
  }
}
