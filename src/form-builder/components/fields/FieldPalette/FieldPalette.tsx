'use client'

import { useDroppableField } from '@/form-builder/hooks/useDroppableField'
import { useField } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import { fieldTypes } from '../../../utils/fieldTypes'
import styles from './FieldPalette.module.css'

type PaletteItemProps = {
	children: React.ReactNode
	label: string
	value: string
}

function PaletteItem({ children, label, value }: PaletteItemProps) {
	const { attributes, isDragging, listeners, setNodeRef } = useDroppableField({
		type: 'new-field',
		fieldType: value,
		label,
	})

	return (
		<div
			className={cx(styles.paletteItem, { [styles.paletteItemDragging]: isDragging })}
			data-testid={`palette-item-${value}`}
			ref={setNodeRef}
			{...attributes}
			{...listeners}
		>
			<span className={styles.paletteItemIcon}>
				⋮⋮
			</span>
			{children}
		</div>
	)
}

export function FieldPalette() {
	const { value: locked } = useField<boolean>({ path: 'locked' })

	if (locked) {return null}

	return (
		<div className={styles.container}>
			<h4 className={styles.heading}>Add field</h4>
			<div className={styles.paletteList}>
				{fieldTypes.map((field) => (
					<PaletteItem
						key={field.value}
						label={field.label}
						value={field.value}
					>
						<span>{field.label}</span>
					</PaletteItem>
				))}
			</div>
		</div>
	)
}
