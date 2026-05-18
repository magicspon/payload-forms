import type { ChangeEvent } from 'react'

import { useFormContext } from '@/shared/context/EditorFormContext'
import { TextInput } from '@payloadcms/ui'

import type {
	FileField,
	FileFieldEditorProps} from '../../../fieldSchema';

import {
	fileFieldSchema,
} from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, GeneralFields } from '../SharedFields'
import styles from './FileFieldEditor.module.css'

export function FileFieldEditorContent() {
	const form = useFormContext<FileField>()

	return (
		<>
			<GeneralFields />
			<hr className={styles.divider} />
			<AdvancedFields>
				<form.Field name="allowedFileTypes">
					{(f) => (
						<TextInput
							description="Comma-separated list of file extensions or MIME types (e.g., .pdf,.doc,image/*)"
							label="Allowed File Types"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								f.handleChange(e.target.value)
							}
							path="allowedFileTypes"
							value={(f.state.value as string) ?? ''}
						/>
					)}
				</form.Field>
				<form.Field name="maxFileSize">
					{(f) => (
						<TextInput
							description="Maximum file size in megabytes"
							label="Max File Size (MB)"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								f.handleChange(
									e.target.value
										? Number(e.target.value) * 1024 * 1024
										: undefined,
								)
							}
							path="maxFileSize"
							value={
								f.state.value
									? String((f.state.value) / (1024 * 1024))
									: ''
							}
						/>
					)}
				</form.Field>
			</AdvancedFields>
		</>
	)
}

export function FileFieldEditor({ field }: FileFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={fileFieldSchema}>
			<FileFieldEditorContent />
		</EditorTabs>
	)
}
