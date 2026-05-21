import type {
  CollectionAfterChangeHook,
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
	Endpoint,
  Field,
} from 'payload'

import type { FileUploadEntry, RemoteFileValue } from '../shared/types'

import { makeSubmissionEndpoint } from '../submissions/endpoints/submission'

const afterReadHook: CollectionAfterReadHook = async ({ doc, req }) => {
  const fileUploads = doc.fileUploads as FileUploadEntry[] | null
  if (!fileUploads?.length) return doc

  const submissionData = { ...((doc.submissionData ?? {}) as Record<string, unknown>) }

  for (const entry of fileUploads) {
    const resolved = await Promise.all(
      entry.ids.map(async (id) => {
        try {
          return await req.payload.findByID({
            id,
            collection: entry.relationTo as never,
            depth: 0,
          })
        } catch {
          return null
        }
      }),
    )

    const remoteFiles: RemoteFileValue[] = resolved
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .map((uploadDoc) => {
        const d = uploadDoc as Record<string, unknown>
        return {
          kind: 'remote' as const,
          id: String(d.id),
          filename: (d.filename as string) ?? '',
          filesize: (d.filesize as number) ?? 0,
          mimeType: (d.mimeType as string) ?? '',
          url: (d.url as string) ?? '',
        }
      })

    submissionData[entry.fieldName] = remoteFiles
  }

  return { ...doc, submissionData }
}

export interface SubmissionsCollectionOptions {
  /** afterChange hooks to prepend ahead of the built-in ones. */
  afterChangeHooks?: CollectionAfterChangeHook[]
  /** beforeChange hooks to prepend ahead of the built-in ones. */
  beforeChangeHooks?: CollectionBeforeChangeHook[]
  /** exportEndpoint to add, or undefined to omit. */
  exportEndpoint?: Endpoint
  /** Additional endpoints to register on the collection. */
  extraEndpoints?: Endpoint[]
  /** Extra fields to append after the built-in fields. */
  extraFields?: Field[]
  /** Slug of the forms collection. Defaults to `'forms'`. */
  formsSlug?: string
  /** Slug of the form-uploads collection. Defaults to `'form-uploads'`. */
  formUploadsSlug?: string
  /** importEndpoint to add, or undefined to omit. */
  importEndpoint?: Endpoint
  /** Collection slug. Defaults to `'submissions'`. */
  slug?: string
}

/** Build the submissions CollectionConfig. */
export function buildSubmissionsCollection(
  opts: SubmissionsCollectionOptions = {},
): CollectionConfig {
  const {
    slug = 'submissions',
    afterChangeHooks = [],
    beforeChangeHooks = [],
    exportEndpoint,
    extraEndpoints = [],
    extraFields = [],
    formsSlug = 'forms',
    formUploadsSlug = 'form-uploads',
    importEndpoint,
  } = opts

  // Static paths must come before dynamic /:id to avoid shadowing
  const endpoints: Endpoint[] = []
  if (importEndpoint) {
    endpoints.push(importEndpoint)
  }
  if (exportEndpoint) {
    endpoints.push(exportEndpoint)
  }
  endpoints.push(
    makeSubmissionEndpoint({
      forms: formsSlug,
      formUploads: formUploadsSlug,
      submissions: slug,
    }),
  )
  endpoints.push(...extraEndpoints)

  return {
    slug,
    admin: {
      components: {
        edit: {
          beforeDocumentControls: ['@spon/payload-forms/client#FormSubmissionViewButton'],
        },
        views: {
          list: {
            actions: [
              {
                path: '@spon/payload-forms/rsc#FormImportButton',
                serverProps: { formsSlug },
              },
            ],
          },
        },
      },
      defaultColumns: ['title', 'identifier', 'createdAt'],
      group: 'Forms',
      useAsTitle: 'title',
    },
    endpoints,
    hooks: {
      afterChange: [...afterChangeHooks],
      afterRead: [afterReadHook],
      beforeChange: [...beforeChangeHooks],
    },
    labels: { plural: 'Submissions', singular: 'Submission' },

    versions: {
      drafts: {
        autosave: false,
      },
      maxPerDoc: 5,
    },

    fields: [
      {
        name: 'title',
        type: 'text',
        admin: {
          description: 'Auto-generated from form title at submission time',
          readOnly: false,
        },
        required: true,
      },
      {
        name: 'identifier',
        type: 'text',
        admin: {
          description: 'Value of the nominated identifier field at submission time',
          readOnly: false,
        },
        required: false,
      },
      {
        name: 'form',
        type: 'relationship',
        admin: {
          description: 'Reference to parent form (for grouping/queries)',
          readOnly: false,
        },
        relationTo: formsSlug,
      },
      {
        type: 'tabs',
        tabs: [
          {
            fields: [
              {
                name: 'submissionData',
                type: 'json',
                admin: {
                  description: 'The actual values submitted by the user',
                  hidden: true,
                  readOnly: true,
                },
                required: true,
                typescriptSchema: [
                  () => ({
                    tsType: `Record<string, any> | null`,
                  }),
                ],
              },
              {
                name: 'submissionDataEditor',
                type: 'ui',
                admin: {
                  components: {
                    Field: {
                      path: '@spon/payload-forms/rsc#SubmissionDataEditor',
                      serverProps: {
                        formsSlug,
                        formUploadsSlug,
                      },
                    },
                  },
                },
              },
            ],
            label: 'Submission Data',
          },
          {
            description:
              'Immutable snapshot of the form at submission time. This ensures submission data can always be displayed correctly, even if the form is later modified.',
            fields: [
              {
                name: 'formSnapshot',
                type: 'json',
                admin: {
                  description:
                    'Complete form snapshot as JSON Schema. Contains: title, handle, schema, and field definitions.',
                  readOnly: false,
                },
                required: false,

                typescriptSchema: [
                  () => ({
                    tsType: `Record<string, any> | null`,
                  }),
                ],
              },
            ],
            label: 'Form Snapshot',
          },
          {
            fields: [
              {
                name: 'userAgent',
                type: 'text',
                admin: { readOnly: false },
              },
              {
                name: 'ipAddress',
                type: 'text',
                admin: { readOnly: false },
              },
            ],
            label: 'Metadata',
          },
        ],
      },
      {
        name: 'fileUploads',
        type: 'json',
        admin: { hidden: true },
        typescriptSchema: [
          () => ({
            tsType: `Array<{ fieldName: string; ids: string[]; maxFiles: number; relationTo: string }> | null`,
          }),
        ],
      },
      ...extraFields,
    ],
  }
}
