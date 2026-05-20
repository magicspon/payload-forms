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
  onHoverDrag?: (pageId: string) => void
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
  onHoverDrag,
  onReorder,
  tab,
  title,
}: TabItemProps) {
  const tabRef = React.useRef<HTMLDivElement>(null)
  const handleRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null)
  const [isRowHoverTarget, setIsRowHoverTarget] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  React.useEffect(() => {
    const tabEl = tabRef.current
    const handleEl = handleRef.current
    if (!tabEl) return

    const pieces: (() => void)[] = []

    if (!disabled && onReorder && handleEl) {
      pieces.push(
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
      )
    }

    // Single dropTargetForElements handles both page-tab reorder and existing-row
    // hover-to-switch — pragmatic-dnd only allows one drop target per element.
    const acceptsPageTab = !disabled && !!onReorder
    const acceptsRowHover = !!onHoverDrag
    if (acceptsPageTab || acceptsRowHover) {
      pieces.push(
        dropTargetForElements({
          element: tabEl,
          canDrop: ({ source }) => {
            if (source.data.type === 'page-tab') return acceptsPageTab && source.data.pageId !== id
            if (source.data.type === 'existing-row') return acceptsRowHover && source.data.pageId !== id
            return false
          },
          getData: ({ input, element, source }) => {
            if (source.data.type === 'page-tab') {
              return attachClosestEdge(
                { type: 'page-tab-target', pageId: id, index },
                { input, element, allowedEdges: ['left', 'right'] },
              )
            }
            return { type: 'row-hover-tab', pageId: id }
          },
          onDragEnter: ({ source }) => {
            if (source.data.type === 'existing-row') {
              setIsRowHoverTarget(true)
              timerRef.current = setTimeout(() => {
                onHoverDrag?.(id)
                timerRef.current = null
              }, 600)
            }
          },
          onDrag: ({ self, source }) => {
            if (source.data.type === 'page-tab') {
              setClosestEdge(source.data.pageId === id ? null : extractClosestEdge(self.data))
            }
          },
          onDragLeave: ({ source }) => {
            if (source.data.type === 'page-tab') setClosestEdge(null)
            if (source.data.type === 'existing-row') {
              setIsRowHoverTarget(false)
              if (timerRef.current !== null) {
                clearTimeout(timerRef.current)
                timerRef.current = null
              }
            }
          },
          onDrop: ({ source, self }) => {
            if (source.data.type === 'page-tab') {
              setClosestEdge(null)
              if (!onReorder) return
              const sourceIndex = source.data.index as number
              const edge = extractClosestEdge(self.data)
              if (sourceIndex === index) return
              let newIndex = index
              if (edge === 'right') newIndex = index + 1
              if (sourceIndex < newIndex) newIndex -= 1
              onReorder(sourceIndex, newIndex)
            }
            if (source.data.type === 'existing-row') {
              setIsRowHoverTarget(false)
              if (timerRef.current !== null) {
                clearTimeout(timerRef.current)
                timerRef.current = null
              }
            }
          },
        }),
      )
    }

    if (pieces.length === 0) return
    return combine(...pieces)
  }, [id, index, title, disabled, onReorder, onHoverDrag])

  return (
    <div
      className={cx(styles.tabContainer, { [styles.dragging]: isDragging })}
      data-testid="tab-item"
      ref={tabRef}
    >
      {closestEdge === 'left' && <div className={styles.indicatorLeft} />}
      {closestEdge === 'right' && <div className={styles.indicatorRight} />}
      <Inline className={cx(styles.tabInline, { [styles.tabInlineActive]: id === tab, [styles.rowHoverTarget]: isRowHoverTarget })}>
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
