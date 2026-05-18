'use client'

import type { Field } from '@/shared/fieldSchema'

import { useDndIndicator } from '@/form-builder/components/canvas/FormCanvas/DndIndicatorContext'
import { useFieldMeta } from '@/form-builder/context/FieldMetaProvider'
import { useFormFields } from '@/form-builder/context/FormFieldsContext'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditIcon, useField } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import { DeleteField } from '../../actions/DeleteField'
import styles from './FieldItem.module.css'

type FieldItemProps = {
	className?: string
	field: Field
}

export function FieldItem({ className, field }: FieldItemProps) {
	const { pageId, rowId } = useFieldMeta()
	const { value: handle } = useField<string>({ path: 'handle' })
	const { value: locked } = useField<boolean>({ path: 'locked' })
	const { setSelectedFieldMeta } = useFormFields()
	const indicator = useDndIndicator()

	const {
		attributes,
		isDragging,
		listeners,
		setActivatorNodeRef,
		setNodeRef,
		transform,
		transition,
	} = useSortable({
		id: field.id,
		data: { type: 'field', field, fieldId: field.id, pageId, rowId },
		disabled: !!locked,
	})

	const showLeftIndicator = indicator.targetId === field.id && indicator.edge === 'left'
	const showRightIndicator = indicator.targetId === field.id && indicator.edge === 'right'

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			className={cx(styles.chip, { [styles.dragging]: isDragging }, className)}
			data-testid="field-item"
			ref={setNodeRef}
			style={style}
			{...attributes}
		>
			{showLeftIndicator && <div className={styles.indicatorLeft} />}
			{showRightIndicator && <div className={styles.indicatorRight} />}

			<span
				className={styles.handle}
				data-testid="field-item-handle"
				ref={setActivatorNodeRef}
				{...listeners}
			>
				⋮⋮
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
