import type { CollectionConfig, Config, Field, PayloadRequest, Tab } from 'payload'

import { mergeCollection } from '@/shared/utils/mergeCollection'

import { buildFormUploadsCollection } from './collections/form-uploads'
import { buildFormsCollection } from './collections/forms'
import { buildSubmissionsCollection } from './collections/submissions'
import {
  makeSubmissionNotifications,
  type BeforeEmailHook,
} from './notifications/hooks/submissionNotifications'
import { makeSubmissionExportEndpoint } from './submissions/endpoints/submissionExport'
import {
  makeSubmissionImportEndpoint,
  type OnBatchImportComplete,
} from './submissions/endpoints/submissionImport'

export type { FormsCollectionOptions } from './collections/forms'
export type { SubmissionsCollectionOptions } from './collections/submissions'
export { FormFieldReferenceFeature } from './form-builder/components/lexical/FormFieldReference'
/** Re-export types and utilities the host app may need */
export type { BeforeEmailHook } from './notifications/hooks/submissionNotifications'
export type { OnBatchImportComplete } from './submissions/endpoints/submissionImport'
export { buildFormSchema } from '@/form-builder/utils/buildFormSchema'
export { getAllFields } from '@/form-builder/utils/formTree'
export type { FormPage, FormRow } from '@/form-builder/utils/formTree'
export { shouldSendNotification } from '@/notifications/utils/notifications'
export * from '@/shared/fieldSchema'
export { mergePages } from '@/shared/utils/mergePages'
export {
  extractFieldsFromPages,
  formatSubmissionValue,
  generateSubmissionsCSV,
  generateTemplateHeaders,
  parseCsvRowToSubmissionData,
} from '@/submissions/utils/csvTemplateUtils'
export type { FieldDefinition } from '@/submissions/utils/csvTemplateUtils'

import type { DeepPartial } from './types'

/** Resolved collection slugs used throughout the plugin. */
export interface CollectionSlugs {
  /** Slug for the forms collection. Defaults to `'forms'`. */
  forms: string
  /** Slug for the form-uploads collection. Defaults to `'form-uploads'`. */
  formUploads: string
  /** Slug for the submissions collection. Defaults to `'submissions'`. */
  submissions: string
}

export interface FormsPluginConfig {
  /**
   * Called once per notification item, after token resolution and content
   * conversion, with the fully resolved email data. Return `false` to skip
   * `payload.sendEmail()` for that item (e.g. to handle sending yourself).
   * If the hook throws, the error is logged and the send proceeds.
   */
  beforeEmail?: BeforeEmailHook

  /**
   * Collection config overrides, deep-merged into the plugin defaults.
   * Use this to inject access control, extra fields, hooks, etc.
   */
  collections?: {
    forms?: DeepPartial<CollectionConfig>
    formUploads?: DeepPartial<CollectionConfig>
    submissions?: DeepPartial<CollectionConfig>
  }

  disabled?: boolean

  /**
   * Access check used by the CSV export endpoint.
   * Defaults to allowing all requests (no-op). Override to enforce auth.
   */
  exportAccessCheck?: (req: PayloadRequest) => boolean

  /**
   * Access check used by the CSV import endpoint.
   * Defaults to allowing all requests (no-op). Override to enforce auth.
   */
  importAccessCheck?: (req: PayloadRequest) => boolean

  /**
   * Live preview URL factory for the forms collection.
   * If omitted, live preview is disabled.
   */
  livePreviewUrl?: (args: {
    data: Record<string, unknown>
    locale: { code: string }
  }) => null | string

  /**
   * Locale options for the "languages" field.
   * Defaults to English only.
   */
  localeOptions?: { label: string; value: string }[]

  /**
   * Called once after a successful batch CSV import.
   *
   * During an import each `payload.create()` carries
   * `context: { isBatchImport: true }`, which suppresses per-record hooks
   * (direct emails and notification job queuing). Provide this callback to
   * fire a single consolidated notification for the whole batch instead.
   *
   * @example
   * ```ts
   * // TODO: wire up your own notification handler here
   *
   * formsPlugin({
   *   onBatchImportComplete: async ({ payload, teamId, formId, count }) => {
   *     await queueNotificationRules({
   *       payload,
   *       trigger: 'form.batch_import',
   *       teamId,
   *       formId,
   *       count,
   *     })
   *   },
   * })
   * ```
   */
  onBatchImportComplete?: OnBatchImportComplete

  settings?: Field[]

  /**
   * Override the collection slugs registered by this plugin.
   * Useful when the default names conflict with existing collections.
   *
   * @example
   * ```ts
   * formsPlugin({ slugs: { forms: 'contact-forms', submissions: 'contact-submissions' } })
   * ```
   */
  slugs?: Partial<CollectionSlugs>

  tabLabels?: {
    canvas: string
    settings: string
  }

  tabs?: Tab[]
}

/**
 * Payload plugin that registers the forms, submissions, and form-uploads
 * collections with opt-in multitenancy, hooks, and admin UI components.
 *
 * @example
 * ```ts
 * import { formsPlugin } from '@spon/payload-forms'
 *
 * export default buildConfig({
 *   plugins: [
 *     formsPlugin({
 *       localeOptions: [{ label: 'English', value: 'en' }, { label: 'Spanish', value: 'es' }],
 *       hooks: { registerUser: true },
 *       collections: {
 *         forms: { access: { create: isAdminOrMember, read: isAnyone } },
 *       },
 *     }),
 *   ],
 * })
 * ```
 */
export const formsPlugin =
  (pluginOptions: FormsPluginConfig = {}) =>
  (config: Config): Config => {
    const {
      beforeEmail,
      collections: collectionOverrides = {},
      disabled = false,
      exportAccessCheck = () => true,
      importAccessCheck = () => true,
      livePreviewUrl,
      localeOptions,
      onBatchImportComplete,
      settings = [],
      slugs: slugOverrides,
      tabLabels = {
        canvas: 'Canvas',
        settings: 'Settings',
      },
      tabs = [],
    } = pluginOptions

    const slugs: CollectionSlugs = {
      forms: slugOverrides?.forms ?? 'forms',
      formUploads: slugOverrides?.formUploads ?? 'form-uploads',
      submissions: slugOverrides?.submissions ?? 'submissions',
    }

    // --- Hooks ---
    // submissionNotifications is always-on: sends direct emails based on the
    // form's built-in "Notifications" tab configuration.
    const submissionBeforeChange = [makeSubmissionNotifications(slugs, beforeEmail)]
    const submissionAfterChange: never[] = []

    const importEndpoint = makeSubmissionImportEndpoint(
      importAccessCheck,
      onBatchImportComplete,
      slugs,
    )

    const exportEndpoint = makeSubmissionExportEndpoint(exportAccessCheck, slugs)

    // --- Build collections ---
    const formsBase = buildFormsCollection({
      slug: slugs.forms,
      submissionsSlug: slugs.submissions,
      livePreviewUrl,
      localeOptions,
      settings,
      tabLabels,
      tabs,
    })

    const submissionsBase = buildSubmissionsCollection({
      slug: slugs.submissions,
      afterChangeHooks: submissionAfterChange,
      beforeChangeHooks: submissionBeforeChange,
      exportEndpoint,
      formsSlug: slugs.forms,
      formUploadsSlug: slugs.formUploads,
      importEndpoint,
    })

    const formUploadsBase = buildFormUploadsCollection({
      slug: slugs.formUploads,
      formsSlug: slugs.forms,
      submissionsSlug: slugs.submissions,
    })

    // Merge in host-app overrides
    const formsCollection = mergeCollection(formsBase, collectionOverrides.forms)

    if (!config.collections) {
      config.collections = []
    }
    config.collections.push(formsCollection)
    config.collections.push(mergeCollection(submissionsBase, collectionOverrides.submissions))
    config.collections.push(mergeCollection(formUploadsBase, collectionOverrides.formUploads))

    /**
     * When disabled we still register the collections so the DB schema
     * stays consistent (important for migrations).
     */
    if (disabled) {
      return config
    }

    config.admin ??= {}
    config.admin.components ??= {}
    config.admin.components.providers ??= []
    config.admin.components.providers.push({
      path: '@spon/payload-forms/client#FormBuilderProvider',
    })

    return config
  }
