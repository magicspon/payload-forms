'use client'

import type { FormRow as FormRowType } from '@/form-builder/utils/formTree'

import { FieldMetaProvider } from '@/form-builder/context/FieldMetaProvider'
import { Stack } from '@/shared/layout'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { PlusIcon, useField } from '@payloadcms/ui'
import clsx from 'clsx'
import * as React from 'react'

import { FieldItem } from '../FieldItem'
import { FormRow } from '../FormRow'
import styles from './PageTab.module.css'

type TPageTabProps = {
  pageId: string
  rows: FormRowType[]
}

type TNewRowTargetProps = {
  pageId: string
}

function NewRowTarget({ pageId }: TNewRowTargetProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isDraggedOver, setIsDraggedOver] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) =>
        source.data.type === 'new-field' ||
        source.data.type === 'existing-field' ||
        source.data.type === 'existing-row',
      getData: () => ({ type: 'new-row-target', pageId }),
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: () => setIsDraggedOver(false),
    })
  }, [pageId])

  return (
    <div
      className={clsx(styles.newRowTarget, {
        [styles.newRowTargetNormal]: !isDraggedOver,
        [styles.newRowTargetOver]: isDraggedOver,
      })}
      data-testid="new-row-target"
      ref={ref}
    >
      <PlusIcon />
      {isDraggedOver && <span className={styles.dropText}>Drop to create new row</span>}
    </div>
  )
}

export function PageTab({ pageId, rows }: TPageTabProps) {
  const { value: locked } = useField<boolean>({ path: 'locked' })

  return (
    <Stack className={styles.container}>
      {rows?.map((row, index) => (
        <FormRow key={row.id} pageId={pageId} row={row} rowIndex={index}>
          {row.columns.map((field) => (
            <FieldMetaProvider key={field.id} pageId={pageId} rowId={row.id}>
              <FieldItem field={field} />
            </FieldMetaProvider>
          ))}
        </FormRow>
      ))}
      {!locked && <NewRowTarget pageId={pageId} />}
    </Stack>
  )
}
