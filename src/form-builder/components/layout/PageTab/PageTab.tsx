'use client'

import { FieldMetaProvider } from '@/shared/context/FieldMetaProvider'
import { Stack } from '@/shared/ui/layout'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PlusIcon, useField } from '@payloadcms/ui'
import clsx from 'clsx'
import * as React from 'react'

import type { FormRow as FormRowType } from '../../../utils/formTree'

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
	const id = `new-row-${pageId}`
	const { isOver, setNodeRef } = useDroppable({
		id,
		data: { type: 'new-row', pageId },
	})

	return (
		<div
			className={clsx(styles.newRowTarget, {
				[styles.newRowTargetNormal]: !isOver,
				[styles.newRowTargetOver]: isOver,
			})}
			data-testid="new-row-target"
			ref={setNodeRef}
		>
			<PlusIcon />
			{isOver && (
				<span className={styles.dropText}>Drop to create new row</span>
			)}
		</div>
	)
}

export function PageTab({ pageId, rows }: TPageTabProps) {
	const { value: locked } = useField<boolean>({ path: 'locked' })
	const rowIds = rows.map((r) => r.id)

	return (
		<Stack className={styles.container}>
			<SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
				{rows?.map((row, index) => (
					<FormRow key={row.id} pageId={pageId} row={row} rowIndex={index}>
						{row.columns.map((field) => (
							<FieldMetaProvider
								key={field.id}
								pageId={pageId}
								rowId={row.id}
							>
								<FieldItem field={field} />
							</FieldMetaProvider>
						))}
					</FormRow>
				))}
				{!locked && <NewRowTarget pageId={pageId} />}
			</SortableContext>
		</Stack>
	)
}
