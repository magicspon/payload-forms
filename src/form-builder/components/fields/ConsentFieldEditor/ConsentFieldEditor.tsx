import type {
	ConsentField,
	ConsentFieldEditorProps,
} from '@/shared/fieldSchema'

import { AdvancedFields, Divider, GeneralFields } from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { consentFieldSchema } from '@/shared/fieldSchema'
import { CheckboxInput } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

export function ConsentFieldEditorPanel() {
	const form = useFormContext<ConsentField>()

	return (
		<>
			<GeneralFields />
			<Divider />
			<AdvancedFields exclude={['defaultValue']}>
				<form.Field name="defaultValue">
					{(f) => (
						<CheckboxInput
							checked={(f.state.value as boolean) ?? false}
							label="Default Value (pre-checked)"
							onToggle={(e) => f.handleChange(e.target.checked)}
						/>
					)}
				</form.Field>
			</AdvancedFields>
		</>
	)
}

export function ConsentFieldEditor({ field }: ConsentFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={consentFieldSchema}>
			<ConsentFieldEditorPanel />
		</EditorTabs>
	)
}
