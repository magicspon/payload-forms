import type { CheckboxFieldEditorProps } from '@/shared/fieldSchema'

import { OptionsFieldEditorContent } from '@/form-builder/components/shared/OptionsFieldEditorContent'
import { checkboxFieldSchema } from '@/shared/fieldSchema'

import { EditorTabs } from '../../canvas/EditorTabs'

export function CheckboxFieldEditorContent() {
  return <OptionsFieldEditorContent multiple />
}

export function CheckboxFieldEditor({ field }: CheckboxFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={checkboxFieldSchema}>
      <CheckboxFieldEditorContent />
    </EditorTabs>
  )
}
