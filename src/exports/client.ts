'use client'

export { ImportSchema } from '../form-builder/components/actions/ImportSchema'

export { FormCanvas } from '../form-builder/components/canvas/FormCanvas/FormCanvas'
export { FormFieldReferenceClientFeature } from '../form-builder/components/lexical/FormFieldReference/feature.client'
export { FieldPalette } from '../form-builder/components/shared/FieldPalette/FieldPalette'
export { IdentifierFieldSelect } from '../form-builder/components/shared/IdentifierFieldSelect/IdentifierFieldSelect'
export { FormBuilderProvider } from '../form-builder/context/FormBuilderProvider/FormBuilderProvider'
export { buildFormSchema } from '../form-builder/utils/buildFormSchema'

// Hooks and utilities safe to use in client components
export { getAllFields } from '../form-builder/utils/formTree'

export type { FormPage, FormRow } from '../form-builder/utils/formTree'
export { EmailFieldSelect } from '../notifications/components/EmailFieldSelect/EmailFieldSelect'
// Notification admin components
export { EmailNotificationInput } from '../notifications/components/EmailNotificationInput/EmailNotificationInput'

export { NotificationConditionEditor } from '../notifications/components/NotificationConditionEditor/NotificationConditionEditor'

export { NotificationRuleConditionEditor } from '../notifications/components/NotificationRuleConditionEditor/NotificationRuleConditionEditor'

export type { Field } from '../shared/fieldSchema'
export { FormCSVTemplateButton } from '../submissions/components/FormCSVTemplateButton/FormCSVTemplateButton'
export { FormSubmissionListViewButton } from '../submissions/components/FormSubmissionListViewButton/FormSubmissionListViewButton'
export { FormSubmissionViewButton } from '../submissions/components/FormSubmissionViewButton/FormSubmissionViewButton'
// Submission data editor
export { SubmissionDataEditorClient } from '../submissions/components/SubmissionDataEditor/client'

// Pure data utilities — no Node.js deps, safe in browser bundles
export type { FieldDefinition } from '../submissions/utils/csvTemplateUtils'
export {
  extractFieldsFromPages,
  formatSubmissionValue,
  generateSubmissionsCSV,
  generateTemplateHeaders,
  parseCsvRowToSubmissionData,
} from '../submissions/utils/csvTemplateUtils'
