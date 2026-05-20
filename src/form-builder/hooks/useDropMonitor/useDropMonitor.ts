import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import * as React from 'react'

import type { TFieldDropParams } from '../useFieldDrop/useFieldDrop'
import type { TRowReorderParams } from '../useRowReorder/useRowReorder'
import type { Field, FieldType } from '@/shared/fieldSchema'

type DropMonitorArgs = {
  handleFieldDrop: (params: TFieldDropParams) => void
  handleRowReorder: (params: TRowReorderParams) => void
}

export function useDropMonitor({ handleFieldDrop, handleRowReorder }: DropMonitorArgs) {
  React.useEffect(() => {
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const targets = location.current.dropTargets
        if (targets.length === 0) {
          return
        }

        if (source.data.type === 'existing-row') {
          const rowTarget = targets.find((t) => t.data.type === 'row-target')
          if (!rowTarget) {
            return
          }

          const edge = extractClosestEdge(rowTarget.data) as 'bottom' | 'top' | null
          if (!edge) {
            return
          }

          handleRowReorder({
            sourceRowId: source.data.rowId as string,
            sourcePageId: source.data.pageId as string,
            targetRowId: rowTarget.data.rowId as string,
            targetPageId: rowTarget.data.pageId as string,
            edge,
          })
          return
        }

        const newRowTarget = targets.find((t) => t.data.type === 'new-row-target')
        const fieldTarget = targets.find((t) => t.data.type === 'field-target')
        const rowTarget = targets.find((t) => t.data.type === 'row-target')

        const targetFieldId = fieldTarget?.data.targetFieldId as string | undefined
        const edge = fieldTarget
          ? (extractClosestEdge(fieldTarget.data) as 'left' | 'right' | null)
          : null
        const rowId = (rowTarget?.data.rowId ?? '') as string
        const pageId = (newRowTarget?.data.pageId ?? rowTarget?.data.pageId ?? '') as string
        const createNewRow = !!newRowTarget

        const base = { rowId, pageId, targetFieldId, edge, createNewRow }

        if (source.data.type === 'new-field') {
          handleFieldDrop({ ...base, type: 'new', fieldType: source.data.fieldType as FieldType })
        } else if (source.data.type === 'existing-field') {
          handleFieldDrop({ ...base, type: 'existing', sourceField: source.data.field as Field })
        }
      },
    })
  }, [handleFieldDrop, handleRowReorder])
}
