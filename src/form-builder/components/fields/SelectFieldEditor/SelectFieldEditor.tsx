import type { SelectFieldEditorProps } from '@/shared/fieldSchema'

import { OptionsFieldEditorContent } from '@/form-builder/components/shared/OptionsFieldEditorContent'
import { selectFieldSchema } from '@/shared/fieldSchema'

import { EditorTabs } from '../../canvas/EditorTabs'

export function SelectFieldEditorContent() {
  return <OptionsFieldEditorContent />
}

export function SelectFieldEditor({ field }: SelectFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={selectFieldSchema}>
      <SelectFieldEditorContent />
    </EditorTabs>
  )
}
