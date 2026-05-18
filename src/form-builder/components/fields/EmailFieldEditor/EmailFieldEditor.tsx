import {
	type EmailFieldEditorProps,
	emailFieldSchema,
} from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, GeneralFields } from '../SharedFields'
import styles from './EmailFieldEditor.module.css'

export function EmailFieldEditorContent() {
	return (
		<>
			<GeneralFields />
			<hr className={styles.divider} />
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
