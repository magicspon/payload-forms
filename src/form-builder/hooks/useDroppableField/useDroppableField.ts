'use client'

import { useDraggable } from '@dnd-kit/core'

type UseDroppableFieldProps = {
	fieldType: string
	label: string
	type: 'new-field'
}

export function useDroppableField({ fieldType, label }: UseDroppableFieldProps) {
	const { attributes, isDragging, listeners, setNodeRef } = useDraggable({
		id: `palette-${fieldType}`,
		data: { type: 'new-field', fieldType, label },
	})

	return { attributes, isDragging, listeners, setNodeRef }
}
