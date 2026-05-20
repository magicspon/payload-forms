import {
  appendRowToPage,
  insertRowAfter,
  insertRowBefore,
  removeRow,
} from '@/form-builder/utils/formTree'
import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { nanoid } from '@/shared/utils/nanoid'
import * as React from 'react'

export type TRowReorderParams = {
  edge: 'bottom' | 'top'
  sourcePageId: string
  sourceRowId: string
  targetPageId: string
  targetRowId?: string
}

export function useRowReorder() {
  const { pages, setPages } = useFormPages()

  const handleRowReorder = React.useCallback(
    ({ edge, sourcePageId, sourceRowId, targetPageId, targetRowId }: TRowReorderParams): string | undefined => {
      if (sourcePageId === targetPageId) {
        if (!targetRowId) return undefined

        setPages(
          pages.map((page) => {
            if (page.id !== sourcePageId) return page

            const sourceIndex = page.rows.findIndex((r) => r.id === sourceRowId)
            const targetIndex = page.rows.findIndex((r) => r.id === targetRowId)
            if (sourceIndex === -1 || targetIndex === -1) return page

            const newRows = [...page.rows]
            const movedRow = newRows[sourceIndex]
            if (!movedRow) return page

            newRows.splice(sourceIndex, 1)
            let insertIndex = targetIndex
            if (edge === 'bottom') insertIndex = targetIndex + 1
            if (sourceIndex < insertIndex) insertIndex -= 1
            newRows.splice(insertIndex, 0, movedRow)

            return { ...page, rows: newRows }
          }),
        )
        return undefined
      }

      // Cross-page move
      const sourcePage = pages.find((p) => p.id === sourcePageId)
      if (!sourcePage) return undefined

      const movingRow = sourcePage.rows.find((r) => r.id === sourceRowId)
      if (!movingRow) return undefined

      let newPages = removeRow(pages, sourceRowId)

      // If source page is now empty, leave one empty row
      newPages = newPages.map((page) =>
        page.id === sourcePageId && page.rows.length === 0
          ? { ...page, rows: [{ id: nanoid(), columns: [] }] }
          : page,
      )

      if (targetRowId) {
        newPages =
          edge === 'top'
            ? insertRowBefore(newPages, targetRowId, movingRow)
            : insertRowAfter(newPages, targetRowId, movingRow)
      } else {
        newPages = appendRowToPage(newPages, targetPageId, movingRow)
      }

      setPages(newPages)
      return targetPageId
    },
    [pages, setPages],
  )

  return handleRowReorder
}
