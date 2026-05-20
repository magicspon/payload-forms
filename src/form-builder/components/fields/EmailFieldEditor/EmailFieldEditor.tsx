import {
  AdvancedFields,
  Divider,
  GeneralFields,
} from '@/form-builder/components/shared/SharedFields'
import { type EmailFieldEditorProps, emailFieldSchema } from '@/shared/fieldSchema'

import { EditorTabs } from '../../canvas/EditorTabs'

export function EmailFieldEditorContent() {
  return (
    <>
      <GeneralFields />
      <Divider />
      <AdvancedFields />
    </>
  )
}

export function EmailFieldEditor({ field }: EmailFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={emailFieldSchema}>
      <EmailFieldEditorContent />
    </EditorTabs>
  )
}
