'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { FormFieldReferenceToolbarItem } from './ToolbarItem'

export const FormFieldReferenceClientFeature = createClientFeature({
  toolbarFixed: {
    groups: [
      {
        type: 'buttons',
        items: [
          {
            Component: FormFieldReferenceToolbarItem,
            key: 'formFieldReference',
          },
        ],
        key: 'formFieldReference',
        order: 50,
      },
    ],
  },
})
