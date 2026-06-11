import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import * as React from 'react'

import type { TFieldDropParams } from '../useFieldDrop/useFieldDrop'
import type { TRowReorderParams } from '../useRowReorder/useRowReorder'

import { resolveDropIntent } from './dropIntent'

type DropMonitorArgs = {
  handleFieldDrop: (params: TFieldDropParams) => void
  handleRowReorder: (params: TRowReorderParams) => void
}

export function useDropMonitor({ handleFieldDrop, handleRowReorder }: DropMonitorArgs) {
  React.useEffect(() => {
    return monitorForElements({
      onDrop: ({ source, location }) => {
        const intent = resolveDropIntent({
          extractEdge: (data) => extractClosestEdge(data),
          source,
          targets: location.current.dropTargets,
        })

        switch (intent.kind) {
          case 'field-drop':
            handleFieldDrop(intent.params)
            break
          case 'row-reorder':
            handleRowReorder(intent.params)
            break
        }
      },
    })
  }, [handleFieldDrop, handleRowReorder])
}
