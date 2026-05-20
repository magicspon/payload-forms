'use client'

import type { OptionItem } from '@/shared/fieldSchema'
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { Inline } from '@/shared/layout'
import { PlusIcon, XIcon, DragHandleIcon } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import styles from './OptionsEditor.module.css'

type OptionProps = {
  children: React.ReactNode
  index: number
  onReorder: (fromIndex: number, toIndex: number) => void
  option: OptionItem
}

function Option({ children, index, onReorder, option }: OptionProps) {
  const rowRef = React.useRef<HTMLDivElement>(null)
  const handleRef = React.useRef<HTMLSpanElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [closestEdge, setClosestEdge] = React.useState<Edge | null>(null)

  React.useEffect(() => {
    const rowEl = rowRef.current
    const handleEl = handleRef.current
    if (!rowEl || !handleEl) {
      return
    }

    return combine(
      draggable({
        element: rowEl,
        dragHandle: handleEl,
        getInitialData: () => ({ type: 'option-item', index, option }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: rowEl,
        canDrop: ({ source }) => source.data.type === 'option-item' && source.data.index !== index,
        getData: ({ input, element }) =>
          attachClosestEdge(
            { type: 'option-target', index },
            { input, element, allowedEdges: ['top', 'bottom'] },
          ),
        onDrag: ({ self, source }) => {
          if (source.data.index === index) {
            setClosestEdge(null)
            return
          }
          setClosestEdge(extractClosestEdge(self.data))
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: ({ source, self }) => {
          setClosestEdge(null)
          const sourceIndex = source.data.index as number
          const edge = extractClosestEdge(self.data)
          if (sourceIndex === index) {
            return
          }
          let newIndex = index
          if (edge === 'bottom') {
            newIndex = index + 1
          }
          if (sourceIndex < newIndex) {
            newIndex -= 1
          }
          onReorder(sourceIndex, newIndex)
        },
      }),
    )
  }, [index, option, onReorder])

  return (
    <div className={cx(styles.optionWrapper, { [styles.dragging]: isDragging })} ref={rowRef}>
      {closestEdge === 'top' && <div className={styles.indicatorTop} />}
      {closestEdge === 'bottom' && <div className={styles.indicatorBottom} />}
      <Inline className={styles.optionRow}>
        <span className={styles.handle} ref={handleRef}>
          <DragHandleIcon />
        </span>
        {children}
      </Inline>
    </div>
  )
}

type TOptionsEditorProps = {
  onChange: (options: OptionItem[]) => void
  options: OptionItem[]
}

export function OptionsEditor({ onChange, options }: TOptionsEditorProps) {
  const reorderOptions = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const next = [...options]
      const [item] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, item!)
      onChange(next)
    },
    [options, onChange],
  )

  function insertOptionAtIndex(index: number) {
    onChange([...options.slice(0, index), { label: '', value: '' }, ...options.slice(index)])
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index))
  }

  function updateOption(index: number, field: 'label' | 'value', value: string) {
    onChange(options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)))
  }

  return (
    <div className={styles.colSpan2}>
      <p className="field-label">Options</p>
      <div className={styles.list}>
        {options.map((option, index) => (
          <Option index={index} key={index} onReorder={reorderOptions} option={option}>
            <div className={`${styles.flex1} field-type text`}>
              <label htmlFor={`option-label-${index}`}>
                <span className={styles.srOnly}>Label</span>
                <input
                  aria-label="Option label"
                  className="field-type__input"
                  id={`option-label-${index}`}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  placeholder="Label"
                  type="text"
                  value={option.label}
                />
              </label>
            </div>
            <div className={`${styles.flex1} field-type text`}>
              <label htmlFor={`option-value-${index}`}>
                <span className={styles.srOnly}>Value</span>
                <input
                  aria-label="Option value"
                  className="field-type__input"
                  id={`option-value-${index}`}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  placeholder="Value"
                  type="text"
                  value={option.value}
                />
              </label>
            </div>
            <button
              className={styles.iconButton}
              onClick={() => insertOptionAtIndex(index + 1)}
              type="button"
            >
              <span className={styles.srOnly}>Add</span>
              <PlusIcon />
            </button>
            <button
              className={styles.iconButtonDisabled}
              disabled={options.length <= 1}
              onClick={() => removeOption(index)}
              type="button"
            >
              <span className={styles.srOnly}>Delete</span>
              <XIcon />
            </button>
          </Option>
        ))}
      </div>
    </div>
  )
}
