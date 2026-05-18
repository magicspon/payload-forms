import type { ToggleFieldEditorProps } from '../../../fieldSchema'

import { toggleFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, GeneralFields } from '../SharedFields'
import styles from './ToggleFieldEditor.module.css'

export function ToggleFieldEditorContent() {
	return (
		<>
			<GeneralFields />
			<hr className={styles.divider} />
			<AdvancedFields />
		</>
	)
}

export function ToggleFieldEditor({ field }: ToggleFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={toggleFieldSchema}>
			<ToggleFieldEditorContent />
		</EditorTabs>
	)
}
