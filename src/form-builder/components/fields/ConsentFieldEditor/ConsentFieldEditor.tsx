import { useFormContext } from '@/shared/context/EditorFormContext'
import { CheckboxInput } from '@payloadcms/ui'

import type {
	ConsentField,
	ConsentFieldEditorProps,
} from '../../../fieldSchema'

import { consentFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, Divider, GeneralFields } from '../SharedFields'

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
