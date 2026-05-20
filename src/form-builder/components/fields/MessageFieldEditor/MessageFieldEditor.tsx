import type { MessageField, MessageFieldEditorProps } from '@/shared/fieldSchema'

import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { messageFieldSchema } from '@/shared/fieldSchema'
import * as React from 'react'

import { EditorTabs } from '../../canvas/EditorTabs'
import styles from './MessageFieldEditor.module.css'
import { RichTextEditor } from './RichTextEditor'

export function MessageFieldEditorContent({ field: _ }: MessageFieldEditorProps) {
  const form = useFormContext<MessageField>()

  return (
    <form.Field name="richText">
      {(f) => (
        <div className="field-type text">
          <p className="field-label">
            Message Content <span className="required">*</span>
          </p>
          <div className={styles.isolateRelative}>
            <RichTextEditor onChange={(v) => f.handleChange(v)} value={f.state.value} />
          </div>
          {f.state.meta.isTouched && f.state.meta.errors.length > 0 && (
            <p className="field-error">{f.state.meta.errors.join(', ')}</p>
          )}
          <p className="field-description">
            This text will be displayed to users (not a form input)
          </p>
        </div>
      )}
    </form.Field>
  )
}

export function MessageFieldEditor({ field }: MessageFieldEditorProps) {
  return (
    <EditorTabs field={field} onChangeValidator={messageFieldSchema}>
      <MessageFieldEditorContent field={field} />
    </EditorTabs>
  )
}
