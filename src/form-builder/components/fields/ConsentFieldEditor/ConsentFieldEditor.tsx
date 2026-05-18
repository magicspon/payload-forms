import { useFormContext } from '@/shared/context/EditorFormContext'
import { CheckboxInput } from '@payloadcms/ui'

import type {
	ConsentField,
	ConsentFieldEditorProps,
} from '../../../fieldSchema'

import { consentFieldSchema } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, GeneralFields } from '../SharedFields'
import styles from './ConsentFieldEditor.module.css'

export function ConsentFieldEditorPanel() {
	const form = useFormContext<ConsentField>()

	return (
		<>
			<GeneralFields />
			<hr className={styles.divider} />
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
