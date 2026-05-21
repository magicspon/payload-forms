import type { JSONSchema4 } from 'json-schema'
import type { CollectionConfig, CollectionSlug, Field, RichTextField, Tab } from 'payload'

import { buildFormSchema } from '@/form-builder/utils/buildFormSchema'
import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import { type Field as FormField, formJSONSchema } from '@/shared/fieldSchema'
import { nanoid } from '@/shared/utils/nanoid'
import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  UnderlineFeature,
} from '@payloadcms/richtext-lexical'
import { APIError, slugField } from 'payload'

import { FormFieldReferenceFeature } from '../form-builder/components/lexical/FormFieldReference'

const basicEditor = lexicalEditor({
  features: [
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3'] }),
    FixedToolbarFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    LinkFeature({ maxDepth: 2 }),
  ],
})

const notificationEditor = lexicalEditor({
  features: [
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3'] }),
    FixedToolbarFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    LinkFeature({ maxDepth: 2 }),
    FormFieldReferenceFeature(),
  ],
})

export interface FormsCollectionOptions {
  /** Live preview URL factory — if omitted, live preview is disabled. */
  livePreviewUrl?: (args: {
    data: Record<string, unknown>
    locale: { code: string }
  }) => null | string
  /** Options for the locale language selector. Defaults to English only. */
  localeOptions?: { label: string; value: string }[]
  settings?: Field[]

  /** Collection slug. Defaults to `'forms'`. */
  slug?: string

  /** Submissions collection slug — used for the inline submissions view. Defaults to `'submissions'`. */
  submissionsSlug?: CollectionSlug

  tabLabels?: {
    canvas: string
    settings: string
  }

  tabs?: Tab[]
}

/** Build the forms CollectionConfig. */
export function buildFormsCollection(opts: FormsCollectionOptions = {}): CollectionConfig {
  const {
    slug = 'forms',
    submissionsSlug = 'submissions',
    livePreviewUrl,
    localeOptions,
    settings = [],
    tabs = [],
    tabLabels = {
      canvas: 'Canvas',
      settings: 'Settings',
    },
  } = opts

  return {
    slug,
    admin: {
      components: {
        edit: {
          editMenuItems: ['@spon/payload-forms/client#FormCSVTemplateButton'],
        },
        views: {
          edit: {
            submissions: {
              Component: {
                path: '@spon/payload-forms/rsc#SubmissionsView',
                serverProps: { submissionsSlug },
              },
              path: '/submissions',
              tab: {
                href: '/submissions',
                label: 'Submissions',
              },
            },
          },
        },
      },
      defaultColumns: ['title', 'slug'],
      group: 'Forms',
      useAsTitle: 'title',
      ...(livePreviewUrl
        ? {
            livePreview: {
              url: ({ data, locale }) =>
                livePreviewUrl({
                  data: data as Record<string, unknown>,
                  locale,
                }),
            },
          }
        : {}),
    },
    fields: [
      {
        name: 'fieldPalette',
        type: 'ui' as const,
        admin: {
          components: {
            Field: '@spon/payload-forms/client#FieldPalette',
          },
          position: 'sidebar' as const,
        },
      },
      {
        name: 'title',
        type: 'text',
        required: true,
      },

      slugField({
        useAsSlug: 'title',
        position: 'sidebar',
      }),
      {
        name: 'locked',
        type: 'checkbox',
        admin: {
          description: `Form fields become locked once a form has submissions or connected data`,
          position: 'sidebar',
          readOnly: true,
        },
      },
      {
        type: 'tabs',
        tabs: [
          {
            label: tabLabels?.canvas ?? 'Canvas',
            fields: [
              {
                name: 'pages',
                type: 'json',
                admin: {
                  components: {
                    Field: {
                      path: '@spon/payload-forms/client#FormCanvas',
                    },
                  },
                },
                defaultValue: () => [
                  {
                    id: nanoid(),
                    backButton: 'Back',
                    nextButton: 'Next',
                    rows: [{ id: nanoid(), columns: [] }],
                    title: 'Page 1',
                  },
                ],
                typescriptSchema: [() => formJSONSchema as JSONSchema4],
              },
            ],
          },
          {
            label: 'Confirmation',

            fields: [
              {
                name: 'confirmationType',
                type: 'select',
                options: [
                  { label: 'Redirect', value: 'redirect' },
                  { label: 'Message', value: 'message' },
                ],
              },
              {
                name: 'confirmationMessage',
                type: 'richText',
                // lexicalEditor() returns LexicalEditorConfig which is not assignable to
                // RichTextField['editor'] due to a type mismatch in @payloadcms/richtext-lexical.
                // This cast is the upstream-recommended workaround until the package exports
                // a compatible type.
                editor: notificationEditor as unknown as RichTextField['editor'],
              },
              {
                name: 'redirectUrl',
                type: 'text',
                admin: {
                  condition: (_data, siblingData) => siblingData?.confirmationType === 'redirect',
                },
              },
              {
                name: 'redirect',
                type: 'text',
                admin: { hidden: true },
                virtual: true,
              },
            ],
          },
          {
            label: 'Notifications',
            fields: [
              {
                name: 'notification',
                type: 'array',
                fields: [
                  {
                    name: 'email',
                    type: 'text',
                    admin: {
                      components: {
                        Field: {
                          path: '@spon/payload-forms/client#EmailNotificationInput',
                          clientProps: { label: 'To', required: true },
                        },
                      },
                    },
                    required: true,
                  },
                  {
                    type: 'row',
                    fields: [
                      {
                        name: 'cc',
                        type: 'text',
                        admin: {
                          components: {
                            Field: {
                              path: '@spon/payload-forms/client#EmailNotificationInput',
                              clientProps: { label: 'cc' },
                            },
                          },
                        },
                      },
                      {
                        name: 'bcc',
                        type: 'text',
                        admin: {
                          components: {
                            Field: {
                              path: '@spon/payload-forms/client#EmailNotificationInput',
                              clientProps: { label: 'bcc' },
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    name: 'subject',
                    type: 'text',
                    required: true,
                  },
                  {
                    name: 'message',
                    type: 'richText',
                    required: true,
                    // lexicalEditor() returns LexicalEditorConfig which is not assignable to
                    // RichTextField['editor'] due to a type mismatch in @payloadcms/richtext-lexical.
                    // This cast is the upstream-recommended workaround until the package exports
                    // a compatible type.
                    editor: notificationEditor as unknown as RichTextField['editor'],
                  },
                  {
                    name: 'conditions',
                    type: 'json',
                    admin: {
                      components: {
                        Field: '@spon/payload-forms/client#NotificationConditionEditor',
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            label: 'Schema',
            fields: [
              {
                name: 'formSchema',
                type: 'json',
                admin: { readOnly: true },
                typescriptSchema: [
                  () => ({
                    tsType: `Record<string, unknown> | null`,
                  }),
                ],
              },
            ],
          },
          {
            label: 'Import',
            fields: [
              {
                name: 'import',
                type: 'ui',
                admin: {
                  components: {
                    Field: '@spon/payload-forms/client#ImportSchema',
                  },
                },
              },
            ],
          },
          {
            label: tabLabels?.settings ?? 'Settings',
            fields: [
              {
                name: 'identifierField',
                type: 'text',
                admin: {
                  description:
                    'The form field whose value is stored as the submission identifier, shown in the submissions list.',
                  components: {
                    Field: '@spon/payload-forms/client#IdentifierFieldSelect',
                  },
                },
              },
              localeOptions?.length
                ? {
                    name: 'languages',
                    type: 'select',
                    admin: { description: 'The languages this form is available in.' },
                    defaultValue: ['en'],
                    hasMany: true,
                    label: 'Active Languages',
                    options: localeOptions,
                    required: true,
                  }
                : null,
              ...settings,
            ].filter((f): f is NonNullable<typeof f> => f !== null) as Field[],
          },
          ...tabs,
        ],
      },
      {
        name: 'richText',
        type: 'richText',
        admin: {
          description: 'Schema path used for rich text content field (message)',
          hidden: true,
        },
        editor: basicEditor,
      },
    ],
    hooks: {
      beforeChange: [
        ({ data, req }) => {
          if (!Array.isArray(data?.pages)) return data

          const pagesWithCleanedRows = (data.pages as FormPage[]).map((page) => {
            const filteredRows = page.rows
              .map((row) => ({
                ...row,
                columns: row.columns.map((field) => {
                  if (field.type === 'array' || field.type === 'group') {
                    return {
                      ...field,
                      rows: field.rows.filter((r) => r.columns.length > 0),
                    }
                  }
                  return field
                }),
              }))
              .filter((row) => row.columns.length > 0)

            // Preserve at least one empty row per page (reuse existing ID if possible)
            const rows =
              filteredRows.length > 0
                ? filteredRows
                : [{ id: page.rows[0]?.id ?? nanoid(), columns: [] }]

            return { ...page, rows }
          })

          // Preserve at least one page (reuse existing ID if possible)
          data.pages =
            pagesWithCleanedRows.length > 0
              ? pagesWithCleanedRows
              : [
                  {
                    id: (data.pages as FormPage[])[0]?.id ?? nanoid(),
                    backButton: 'Back',
                    nextButton: 'Next',
                    rows: [{ id: nanoid(), columns: [] }],
                    title: 'Page 1',
                  },
                ]

          try {
            const fields = getAllFields(data.pages)
            data.formSchema = buildFormSchema({ fields })
          } catch (err) {
            req.payload.logger.warn(
              { err, formId: data?.id },
              'beforeChange: failed to generate formSchema — skipping',
            )
          }

          return data
        },
      ],
      beforeValidate: [
        ({ data }) => {
          if (!Array.isArray(data?.pages) || data.pages.length === 0) {
            throw new APIError('Form must have at least one page', 400, {}, true)
          }

          const missing: string[] = []

          function checkFields(fields: FormField[]) {
            for (const field of fields) {
              if (field.type === 'message') continue
              if (!field.label || !field.name) {
                missing.push(field.id)
              }
              if (field.type === 'array' || field.type === 'group') {
                checkFields(field.rows.flatMap((r) => r.columns))
              }
            }
          }

          for (const page of data.pages as FormPage[]) {
            checkFields(page.rows.flatMap((r) => r.columns))
          }

          if (missing.length > 0) {
            throw new APIError(`Fields missing label or name: ${missing.join(', ')}`, 400, {}, true)
          }

          return data
        },
      ],
    },
    labels: { plural: 'Forms', singular: 'Form' },
    versions: {
      drafts: {
        autosave: { interval: 60000, showSaveDraftButton: true },
      },
      maxPerDoc: 10,
    },
  }
}
