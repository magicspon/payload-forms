'use client'

import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { useFormFields } from '@/form-builder/context/FormFieldsContext'
import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { fieldTypes } from '@/form-builder/utils/fieldTypes'
import {
  appendFieldToRow,
  type FormRow as FormRowType,
  insertRowAtIndex,
} from '@/form-builder/utils/formTree'
import { createDefaultField } from '@/shared/fieldSchema'
import { Inline } from '@/shared/layout'
import { nanoid } from '@/shared/utils/nanoid'
import { PlusIcon, Popup, PopupList, useField, DragHandleIcon } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import { DeleteRow } from '../../actions/DeleteRow'
import styles from './FormRow.module.css'

type FormRowProps = {
  children?: React.ReactNode
  pageId: string
  row: FormRowType
  rowIndex: number
}

export function FormRow({ children, pageId, row, rowIndex }: FormRowProps) {
  const rowRef = React.useRef<HTMLDivElement>(null)
  const handleRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isDraggedOver, setIsDraggedOver] = React.useState(false)
  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null)

  const { setSelectedFieldMeta } = useFormFields()
  const { value: locked } = useField<boolean>({ path: 'locked' })
  const rowFields = row.columns
  const isEmpty = rowFields.length === 0
  const { pages, setPages } = useFormPages()

  React.useEffect(() => {
    const rowEl = rowRef.current
    const handleEl = handleRef.current
    if (!rowEl || !handleEl || locked) {
      return
    }

    return combine(
      draggable({
        element: rowEl,
        dragHandle: handleEl,
        getInitialData: () => ({
          type: 'existing-row',
          rowId: row.id,
          pageId,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            render: ({ container }) => {
              const preview = document.createElement('div')
              preview.textContent = `Row ${rowIndex + 1}`
              container.appendChild(preview)
            },
          })
        },
      }),
      dropTargetForElements({
        element: rowEl,
        canDrop: ({ source }) => {
          if (source.data.type === 'new-field') {
            return true
          }
          if (source.data.type === 'existing-field') {
            return true
          }
          if (source.data.type === 'existing-row') {
            return source.data.rowId !== row.id
          }
          return false
        },
        getData: ({ input, element, source }) => {
          const data = { type: 'row-target', rowId: row.id, pageId }
          if (source.data.type === 'existing-row') {
            return attachClosestEdge(data, { input, element, allowedEdges: ['top', 'bottom'] })
          }
          return data
        },
        onDragEnter: ({ source }) => {
          if (source.data.type !== 'existing-row') {
            setIsDraggedOver(true)
          }
        },
        onDrag: ({ self, source }) => {
          if (source.data.type === 'existing-row') {
            if (source.data.rowId === row.id) {
              setClosestEdge(null)
              return
            }
            setClosestEdge(extractClosestEdge(self.data))
          }
        },
        onDragLeave: () => {
          setIsDraggedOver(false)
          setClosestEdge(null)
        },
        onDrop: () => {
          setIsDraggedOver(false)
          setClosestEdge(null)
        },
      }),
    )
  }, [row.id, rowIndex, pageId, locked])

  return (
    <div className={styles.row}>
      <div
        className={cx(styles.rowBody, {
          [styles.rowBodyDragging]: isDragging,
          [styles.rowBodyDraggingOver]: isDraggedOver,
          [styles.rowBodyNormal]: !isDraggedOver && !isDragging,
        })}
        data-testid="form-row"
        ref={rowRef}
      >
        {closestEdge === 'top' && <div className={styles.indicatorTop} />}
        {closestEdge === 'bottom' && <div className={styles.indicatorBottom} />}

        <div className={styles.rowContent}>
          <div className={styles.handle} data-testid="handle" ref={handleRef}>
            <DragHandleIcon />
          </div>

          <div className={styles.rowFields}>
            {isEmpty ? (
              <span className={styles.emptyText}>
                {isDraggedOver ? 'Drop field here' : 'Empty row - drag a field here'}
              </span>
            ) : (
              <Inline className={styles.chipWrap}>{children}</Inline>
            )}
          </div>

          {!locked && (
            <Popup
              button={
                <button className={styles.addButton} data-testid="add-new-field" type="button">
                  <PlusIcon />
                </button>
              }
              buttonType="custom"
            >
              <PopupList.ButtonGroup>
                {fieldTypes.map((field) => (
                  <PopupList.Button
                    id={`field-type-${field.value}`}
                    key={field.value}
                    onClick={() => {
                      const data = createDefaultField(nanoid(), field.value)
                      setPages(appendFieldToRow(pages, row.id, data))
                      setSelectedFieldMeta({ field: data, pageId, rowId: row.id })
                    }}
                  >
                    {field.label}
                  </PopupList.Button>
                ))}
              </PopupList.ButtonGroup>
            </Popup>
          )}
        </div>
      </div>
      {rowIndex > 0 && !locked && <DeleteRow rowId={row.id} shouldWarn={rowFields.length > 0} />}
      {!locked && (
        <button
          className={styles.addRowButton}
          data-testid="add-row-button"
          onClick={() => setPages(insertRowAtIndex(pages, rowIndex + 1))}
          type="button"
        >
          <span className={styles.srOnly}>Add Row</span>
          <PlusIcon />
        </button>
      )}
    </div>
  )
}
