'use client'

import type { GroupField, GroupFieldEditorProps } from '@/shared/fieldSchema'

import {
  AdvancedFields,
  Divider,
  GeneralFields,
} from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { groupFieldSchema } from '@/shared/fieldSchema'

import { EditorTabs } from '../../canvas/EditorTabs'
import { SubFieldsManager } from '../ArrayFieldEditor'

function GroupFieldEditorContent() {
  const form = useFormContext<GroupField>()

  return (
    <>
      <GeneralFields>
        <form.Field name="rows">
          {(f) => (
            <SubFieldsManager
              label="Fields layout"
              onChange={(rows) => f.handleChange(rows)}
              rows={f.state.value ?? []}
            />
          )}
        </form.Field>
      </GeneralFields>
      <Divider />
      <AdvancedFields exclude={['placeholder', 'defaultValue', 'errorMessage', 'hidden']} />
    </>
  )
}

export function GroupFieldEditor({ field }: GroupFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={groupFieldSchema}>
      <GroupFieldEditorContent />
    </EditorTabs>
  )
}
