import type { EditorFormProps, Field } from '@/shared/fieldSchema'
import type { ComponentType } from 'react'

import { renderers } from './renderers'

export function FieldRenderer(props: EditorFormProps) {
	// Type cast: each renderer accepts its specific field subtype; the dispatch key guarantees correctness
	const Component = renderers[props.type] as ComponentType<{ field: Field }>
	return <Component field={props} />
}
