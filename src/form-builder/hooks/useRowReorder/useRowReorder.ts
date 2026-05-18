import { useFormPages } from '@/form-builder/hooks/useFormPages'
import * as React from 'react'

export type TRowReorderParams = {
	edge: 'bottom' | 'top'
	sourcePageId: string
	sourceRowId: string
	targetPageId: string
	targetRowId: string
}

export function useRowReorder() {
	const { pages, setPages } = useFormPages()

	const handleRowReorder = React.useCallback(
		({
			edge,
			sourcePageId,
			sourceRowId,
			targetPageId,
			targetRowId,
		}: TRowReorderParams) => {
			// Only handle same-page reordering for now
			if (sourcePageId !== targetPageId) {return}

			setPages(
				pages.map((page) => {
					if (page.id !== sourcePageId) {return page}

					const sourceIndex = page.rows.findIndex((r) => r.id === sourceRowId)
					const targetIndex = page.rows.findIndex((r) => r.id === targetRowId)
					if (sourceIndex === -1 || targetIndex === -1) {return page}

					const newRows = [...page.rows]
					const movedRow = newRows[sourceIndex]
					if (!movedRow) {return page}

					newRows.splice(sourceIndex, 1)

					// Calculate insert position
					let insertIndex = targetIndex
					if (edge === 'bottom') {
						insertIndex = targetIndex + 1
					}
					// Adjust if we removed from before the insert point
					if (sourceIndex < insertIndex) {
						insertIndex -= 1
					}

					newRows.splice(insertIndex, 0, movedRow)

					return { ...page, rows: newRows }
				}),
			)
			// No need to update fields - they reference rows by ID, not index
		},
		[pages, setPages],
	)

	return handleRowReorder
}
