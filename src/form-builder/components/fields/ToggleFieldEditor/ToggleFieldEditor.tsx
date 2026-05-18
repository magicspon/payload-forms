import type { ToggleFieldEditorProps } from '../../../fieldSchema'

import { toggleFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, Divider, GeneralFields } from '../SharedFields'

export function ToggleFieldEditorContent() {
	return (
		<>
			<GeneralFields />
			<Divider />
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
