'use client'

export type { Field } from '../fieldSchema'

// Field palette (sidebar)
export { FieldPalette } from '../form-builder/components/fields/FieldPalette/FieldPalette'
// Lexical feature
export { FormFieldReferenceClientFeature } from '../form-builder/components/lexical/FormFieldReference/feature.client'
export { EmailFieldSelect } from '../form-builder/components/plugin/EmailFieldSelect/EmailFieldSelect'
// Plugin-level admin components
export { FormCanvas } from '../form-builder/components/plugin/FormCanvas/FormCanvas'
// import schema
export { ImportSchema } from '../form-builder/components/plugin/ImportSchema'

// Notification admin components
export { EmailNotificationInput } from '../notifications/components/EmailNotificationInput/EmailNotificationInput'

export { NotificationConditionEditor } from '../notifications/components/NotificationConditionEditor/NotificationConditionEditor'
export { NotificationRuleConditionEditor } from '../notifications/components/NotificationRuleConditionEditor/NotificationRuleConditionEditor'
export { FormCSVTemplateButton } from '../submissions/components/FormCSVTemplateButton/FormCSVTemplateButton'

export { FormSubmissionListViewButton } from '../submissions/components/FormSubmissionListViewButton/FormSubmissionListViewButton'

export { FormSubmissionViewButton } from '../submissions/components/FormSubmissionViewButton/FormSubmissionViewButton'

// Submission data editor
export { SubmissionDataEditorClient } from '../submissions/components/SubmissionDataEditor/client'
export { buildFormSchema } from '../utils/buildFormSchema'
// Hooks and utilities safe to use in client components
export { getAllFields } from '../utils/formTree'
export type { FormPage, FormRow } from '../utils/formTree'
