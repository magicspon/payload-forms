import type { SerializedEditorState } from '@/shared/fieldSchema'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import { RenderLexical } from '@payloadcms/richtext-lexical/client'

export type RichTextEditorProps = {
	onChange: (value: SerializedEditorState) => void
	value: SerializedEditorState | undefined
}

export function RichTextEditor({ onChange, value }: RichTextEditorProps) {
	return (
		<RenderLexical
			field={{ name: 'richText' }}
			initialValue={value as DefaultTypedEditorState | undefined}
			schemaPath="collection.forms.richText"
			setValue={(val) => {
				onChange(val as SerializedEditorState)
			}}
			value={value as DefaultTypedEditorState | undefined}
		/>
	)
}
