'use client'

import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import * as React from 'react'

type UseDroppableFieldProps = {
  fieldType: string
  label: string
  type: 'new-field'
}

export function useDroppableField({ fieldType, label }: UseDroppableFieldProps) {
  const rowRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  React.useEffect(() => {
    const el = rowRef.current
    if (!el) {
      return
    }

    return draggable({
      element: el,
      getInitialData: () => ({ type: 'new-field', fieldType, label }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          render: ({ container }) => {
            const preview = document.createElement('div')
            preview.textContent = label
            container.appendChild(preview)
          },
        })
      },
    })
  }, [fieldType, label])

  return { isDragging, rowRef }
}
