'use client'

import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { Inline } from '@/shared/layout'
import cx from 'clsx'
import * as React from 'react'
import { DragHandleIcon } from '@payloadcms/ui'

import styles from './TabItem.module.css'

export type TabItemProps = {
  children: React.ReactNode
  count: number
  disabled?: boolean
  id: string
  index: number
  onReorder?: (fromIndex: number, toIndex: number) => void
  tab: string
  title: string
}

export function TabItem({
  id,
  children,
  count,
  disabled,
  index,
  onReorder,
  tab,
  title,
}: TabItemProps) {
  const tabRef = React.useRef<HTMLDivElement>(null)
  const handleRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null)

  React.useEffect(() => {
    const tabEl = tabRef.current
    const handleEl = handleRef.current
    if (!tabEl || !handleEl || disabled || !onReorder) {
      return
    }

    return combine(
      draggable({
        element: tabEl,
        dragHandle: handleEl,
        getInitialData: () => ({ type: 'page-tab', pageId: id, index, title }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            render: ({ container }) => {
              const preview = document.createElement('div')
              preview.textContent = title
              container.appendChild(preview)
            },
          })
        },
      }),
      dropTargetForElements({
        element: tabEl,
        canDrop: ({ source }) => source.data.type === 'page-tab' && source.data.pageId !== id,
        getData: ({ input, element }) =>
          attachClosestEdge(
            { type: 'page-tab-target', pageId: id, index },
            { input, element, allowedEdges: ['left', 'right'] },
          ),
        onDrag: ({ self, source }) => {
          if (source.data.pageId === id) {
            setClosestEdge(null)
            return
          }
          setClosestEdge(extractClosestEdge(self.data))
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: ({ source, self }) => {
          setClosestEdge(null)
          if (!onReorder) {
            return
          }
          const sourceIndex = source.data.index as number
          const edge = extractClosestEdge(self.data)
          if (sourceIndex === index) {
            return
          }
          let newIndex = index
          if (edge === 'right') {
            newIndex = index + 1
          }
          if (sourceIndex < newIndex) {
            newIndex -= 1
          }
          onReorder(sourceIndex, newIndex)
        },
      }),
    )
  }, [id, index, title, disabled, onReorder])

  return (
    <div
      className={cx(styles.tabContainer, { [styles.dragging]: isDragging })}
      data-testid="tab-item"
      ref={tabRef}
    >
      {closestEdge === 'left' && <div className={styles.indicatorLeft} />}
      {closestEdge === 'right' && <div className={styles.indicatorRight} />}
      <Inline className={cx(styles.tabInline, { [styles.tabInlineActive]: id === tab })}>
        <div
          className={cx(styles.handle, { [styles.hidden]: count <= 1 || id !== tab })}
          data-testid="handle"
          ref={handleRef}
        >
          <DragHandleIcon />
        </div>
        {children}
      </Inline>
    </div>
  )
}
