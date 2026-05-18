import { useFormContext } from '@/shared/context/EditorFormContext'
import * as React from 'react'

import type {
	MessageField,
	MessageFieldEditorProps,
} from '../../../fieldSchema'

import { messageFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import styles from './MessageFieldEditor.module.css'
import { RichTextEditor } from './RichTextEditor'

export function MessageFieldEditorContent({
	field: _,
}: MessageFieldEditorProps) {
	const form = useFormContext<MessageField>()

	return (
		<form.Field name="richText">
			{(f) => (
				<div className="field-type text">
					<label className="field-label">
						Message Content <span className="required">*</span>
					</label>
					<div className={styles.isolateRelative}>
						<RichTextEditor onChange={f.handleChange} value={f.state.value} />
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
