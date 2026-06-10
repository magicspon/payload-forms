import type { RadioFieldEditorProps } from '@/shared/fieldSchema'

import { OptionsFieldEditorContent } from '@/form-builder/components/shared/OptionsFieldEditorContent'
import { radioFieldSchema } from '@/shared/fieldSchema'

import { EditorTabs } from '../../canvas/EditorTabs'

export function RadioFieldEditorContent() {
  return <OptionsFieldEditorContent />
}

export function RadioFieldEditor({ field }: RadioFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={radioFieldSchema}>
      <RadioFieldEditorContent />
    </EditorTabs>
  )
}
