import type { ToggleFieldEditorProps } from '@/shared/fieldSchema'

import { AdvancedFields, Divider, GeneralFields } from '@/form-builder/components/shared/SharedFields'
import { toggleFieldSchema } from '@/shared/fieldSchema'

import { EditorTabs } from '../../canvas/EditorTabs'

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
