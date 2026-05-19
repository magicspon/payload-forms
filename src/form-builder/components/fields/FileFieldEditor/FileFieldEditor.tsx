import type {
	FileField,
	FileFieldEditorProps} from '@/shared/fieldSchema';
import type { ChangeEvent } from 'react'

import { AdvancedFields, Divider, GeneralFields } from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import {
	fileFieldSchema,
} from '@/shared/fieldSchema'
import { TextInput } from '@payloadcms/ui'

import { EditorTabs } from '../../canvas/EditorTabs'

export function FileFieldEditorContent() {
	const form = useFormContext<FileField>()

	return (
		<>
			<GeneralFields />
			<Divider />
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
