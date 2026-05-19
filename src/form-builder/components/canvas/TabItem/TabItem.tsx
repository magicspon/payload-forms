'use client'

import { Inline } from '@/shared/layout'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import cx from 'clsx'
import * as React from 'react'

import styles from './TabItem.module.css'

export type TabItemProps = {
	children: React.ReactNode
	count: number
	disabled?: boolean
	id: string
	index: number
	tab: string
	title: string
}

export function TabItem({ id, children, count, disabled, tab }: TabItemProps) {
	const {
		attributes,
		isDragging,
		listeners,
		setActivatorNodeRef,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ id, disabled })

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			className={cx(styles.tabContainer, { [styles.dragging]: isDragging })}
			data-testid="tab-item"
			ref={setNodeRef}
			style={style}
		>
			<Inline
				className={cx(styles.tabInline, { [styles.tabInlineActive]: id === tab })}
			>
				<div
					className={cx(styles.handle, { [styles.hidden]: count <= 1 || id !== tab })}
					data-testid="handle"
					ref={setActivatorNodeRef}
					{...listeners}
					{...attributes}
				>
					⋮⋮
				</div>
				{children}
			</Inline>
		</div>
	)
}
