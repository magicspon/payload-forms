'use client'

import { useDndIndicator } from '@/form-builder/components/canvas/FormCanvas/DndIndicatorContext'
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
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PlusIcon, Popup, PopupList, useField } from '@payloadcms/ui'
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
	const { setSelectedFieldMeta } = useFormFields()
	const { value: locked } = useField<boolean>({ path: 'locked' })
	const { pages, setPages } = useFormPages()
	const indicator = useDndIndicator()

	const rowFields = row.columns
	const isEmpty = rowFields.length === 0
	const fieldIds = rowFields.map((f) => f.id)

	const insertOptionAtIndex = (index: number) => {
		setPages(insertRowAtIndex(pages, index))
	}

	const {
		attributes,
		isDragging,
		isOver,
		listeners,
		setActivatorNodeRef,
		setNodeRef,
		transform,
		transition,
	} = useSortable({
		id: row.id,
		data: { type: 'row', pageId, rowId: row.id },
		disabled: !!locked,
	})

	const showTopIndicator = indicator.targetId === row.id && indicator.edge === 'top'
	const showBottomIndicator = indicator.targetId === row.id && indicator.edge === 'bottom'
	const isFieldDraggedOver = isOver && indicator.edge === null

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div className={styles.row} style={style}>
			<div
				className={cx(styles.rowBody, {
					[styles.rowBodyDragging]: isDragging,
					[styles.rowBodyDraggingOver]: isFieldDraggedOver,
					[styles.rowBodyNormal]: !isFieldDraggedOver && !isDragging,
				})}
				data-testid="form-row"
				ref={setNodeRef}
				{...attributes}
			>
				{showTopIndicator && <div className={styles.indicatorTop} />}
				{showBottomIndicator && <div className={styles.indicatorBottom} />}

				<div className={styles.rowContent}>
					<div
						className={styles.handle}
						data-testid="handle"
						ref={setActivatorNodeRef}
						{...listeners}
					>
						⋮⋮
					</div>

					<div className={styles.rowFields}>
						{isEmpty ? (
							<span className={styles.emptyText}>
								{isFieldDraggedOver
									? 'Drop field here'
									: 'Empty row - drag a field here'}
							</span>
						) : (
							<SortableContext items={fieldIds} strategy={horizontalListSortingStrategy}>
								<Inline className={styles.chipWrap}>{children}</Inline>
							</SortableContext>
						)}
					</div>

					{!locked && (
						<Popup
							button={
								<button
									className={styles.addButton}
									data-testid="add-new-field"
									type="button"
								>
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
			{rowIndex > 0 && !locked && (
				<DeleteRow rowId={row.id} shouldWarn={rowFields.length > 0} />
			)}
			{!locked && (
				<button
					className={styles.addRowButton}
					data-testid="add-row-button"
					onClick={() => insertOptionAtIndex(rowIndex + 1)}
					type="button"
				>
					<span className={styles.srOnly}>Add Row</span>
					<PlusIcon />
				</button>
			)}
		</div>
	)
}
