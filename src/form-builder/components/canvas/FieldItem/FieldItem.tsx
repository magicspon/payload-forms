'use client'

import type { Field } from '@/shared/fieldSchema'
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { useFieldMeta } from '@/form-builder/context/FieldMetaProvider'
import { useFormFields } from '@/form-builder/context/FormFieldsContext'
import { EditIcon, useField, DragHandleIcon } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import { DeleteField } from '../../actions/DeleteField'
import styles from './FieldItem.module.css'

type FieldItemProps = {
  className?: string
  field: Field
}

export function FieldItem({ className, field }: FieldItemProps) {
  const rowRef = React.useRef<HTMLDivElement>(null)
  const handleRef = React.useRef<HTMLSpanElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null)

  const { pageId, rowId } = useFieldMeta()
  const { value: handle } = useField<string>({ path: 'handle' })
  const { value: locked } = useField<boolean>({ path: 'locked' })
  const { setSelectedFieldMeta } = useFormFields()

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
          type: 'existing-field',
          fieldId: field.id,
          field,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            render: ({ container }) => {
              const preview = document.createElement('div')
              preview.textContent = 'label' in field ? (field.label ?? field.type) : field.type
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
            return source.data.fieldId !== field.id
          }
          return false
        },
        getData: ({ input, element }) => {
          return attachClosestEdge(
            { type: 'field-target', targetFieldId: field.id, targetField: field },
            { input, element, allowedEdges: ['left', 'right'] },
          )
        },
        onDrag: ({ self, source }) => {
          if (source.data.fieldId === field.id) {
            setClosestEdge(null)
            return
          }
          setClosestEdge(extractClosestEdge(self.data))
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      }),
    )
  }, [field, locked])

  return (
    <div
      className={cx(styles.chip, { [styles.dragging]: isDragging }, className)}
      data-testid="field-item"
      ref={rowRef}
    >
      {closestEdge === 'left' && <div className={styles.indicatorLeft} />}
      {closestEdge === 'right' && <div className={styles.indicatorRight} />}

      <span className={styles.handle} data-testid="field-item-handle" ref={handleRef}>
        <DragHandleIcon />
      </span>

      <div className={styles.content}>
        <div className={styles.title}>
          {'label' in field ? (field.label ?? '(empty)') : 'Message'}
        </div>
        <div className={styles.type}>{field.type}</div>
      </div>

      <button
        className={styles.iconButton}
        data-testid="field-item-edit-button"
        onClick={() => setSelectedFieldMeta({ field, pageId, rowId })}
        type="button"
      >
        <span className={styles.srOnly}>Edit</span>
        <EditIcon />
        <div className={styles.absoluteInset} />
      </button>

      {!locked && <DeleteField handle={handle} id={field.id} />}
    </div>
  )
}
