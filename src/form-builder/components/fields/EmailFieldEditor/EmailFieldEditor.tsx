import {
	type EmailFieldEditorProps,
	emailFieldSchema,
} from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, Divider, GeneralFields } from '../SharedFields'

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
