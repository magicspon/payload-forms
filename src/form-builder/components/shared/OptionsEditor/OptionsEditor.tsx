'use client'

import type { OptionItem } from '@/shared/fieldSchema'

import { safeClosestCenter } from '@/form-builder/utils/safeClosestCenter'
import { Inline } from '@/shared/layout'
import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PlusIcon, XIcon } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import styles from './OptionsEditor.module.css'

type OptionProps = {
	children: React.ReactNode
	id: string
}

function Option({ id, children }: OptionProps) {
	const {
		attributes,
		isDragging,
		listeners,
		setActivatorNodeRef,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ id })

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			className={cx({ [styles.dragging]: isDragging })}
			ref={setNodeRef}
			style={style}
			{...attributes}
		>
			<Inline className={styles.optionRow}>
				<span
					className={styles.handle}
					ref={setActivatorNodeRef}
					{...listeners}
				>
					⋮⋮
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
	const dndId = React.useId()
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	)

	// Index-as-ID works here because reorder commits via onChange before next render
	const ids = options.map((_, i) => String(i))

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) {return}
		onChange(arrayMove(options, Number(active.id), Number(over.id)))
	}

	function insertOptionAtIndex(index: number) {
		onChange([
			...options.slice(0, index),
			{ label: '', value: '' },
			...options.slice(index),
		])
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
			<DndContext
				collisionDetection={safeClosestCenter}
				id={dndId}
				onDragEnd={handleDragEnd}
				sensors={sensors}
			>
				<SortableContext items={ids} strategy={verticalListSortingStrategy}>
					<div className={styles.list}>
						{options.map((option, index) => (
							<Option id={String(index)} key={index}>
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
				</SortableContext>
			</DndContext>
		</div>
	)
}
