'use client'

import type { Field } from '@/shared/fieldSchema'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import { FormFieldsProvider } from '@/form-builder/context/FormFieldsContext'
import { safeClosestCenter } from '@/form-builder/utils/safeClosestCenter'
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import * as React from 'react'

import styles from './FormBuilderProvider.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActiveDragItem =
	| { field: Field; kind: 'existing-field' }
	| { fieldType: string; kind: 'new-field'; label: string }
	| { kind: 'existing-row'; label: string; pageId: string; rowId: string }

type DndHandlers = {
	onDragEnd: (event: DragEndEvent) => void
	onDragOver: (event: DragOverEvent) => void
}

type FormBuilderDndContextValue = {
	registerDndHandlers: (handlers: DndHandlers) => () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FormBuilderDndContext = React.createContext<FormBuilderDndContextValue | null>(null)

export function useFormBuilderDnd() {
	const ctx = React.use(FormBuilderDndContext)
	if (!ctx) {throw new Error('useFormBuilderDnd must be used within FormBuilderProvider')}
	return ctx
}

// ─── Drag preview ─────────────────────────────────────────────────────────────

function DragPreview({ label, type }: { label: string; type: string }) {
	return (
		<div className={styles.dragPreview}>
			<span className={styles.dragPreviewHandle}>⋮⋮</span>
			<div>
				<div className={styles.dragPreviewTitle}>{label}</div>
				<div className={styles.dragPreviewType}>{type}</div>
			</div>
		</div>
	)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FormBuilderProvider({ children }: { children: React.ReactNode }) {
	const [activeItem, setActiveItem] = React.useState<ActiveDragItem | null>(null)

	const onDragOverRef = React.useRef<(e: DragOverEvent) => void>(() => {})
	const onDragEndRef = React.useRef<(e: DragEndEvent) => void>(() => {})

	const registerDndHandlers = React.useCallback((handlers: DndHandlers) => {
		onDragOverRef.current = handlers.onDragOver
		onDragEndRef.current = handlers.onDragEnd
		return () => {
			onDragOverRef.current = () => {}
			onDragEndRef.current = () => {}
		}
	}, [])

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	)

	const dndId = React.useId()

	function handleDragStart({ active }: DragStartEvent) {
		const data = active.data.current
		if (!data) {return}
		if (data.type === 'new-field') {
			setActiveItem({ fieldType: data.fieldType as string, kind: 'new-field', label: data.label as string })
		} else if (data.type === 'field') {
			setActiveItem({ field: data.field as Field, kind: 'existing-field' })
		} else if (data.type === 'row') {
			setActiveItem({
				kind: 'existing-row',
				label: 'Row',
				pageId: data.pageId as string,
				rowId: data.rowId as string,
			})
		}
	}

	function handleDragOver(event: DragOverEvent) {
		onDragOverRef.current(event)
	}

	function handleDragEnd(event: DragEndEvent) {
		onDragEndRef.current(event)
		setActiveItem(null)
	}

	return (
		<FormBuilderDndContext value={{ registerDndHandlers }}>
			<FormFieldsProvider>
				<DndContext
					collisionDetection={safeClosestCenter}
					id={dndId}
					onDragEnd={handleDragEnd}
					onDragOver={handleDragOver}
					onDragStart={handleDragStart}
					sensors={sensors}
				>
					{children}
					<DragOverlay>
						{activeItem ? (
							<DragPreview
								label={
									activeItem.kind === 'new-field'
										? activeItem.label
										: activeItem.kind === 'existing-field'
											? ('label' in activeItem.field ? (activeItem.field.label ?? activeItem.field.type) : activeItem.field.type)
											: activeItem.label
								}
								type={
									activeItem.kind === 'new-field'
										? activeItem.fieldType
										: activeItem.kind === 'existing-field'
											? activeItem.field.type
											: 'row'
								}
							/>
						) : null}
					</DragOverlay>
				</DndContext>
			</FormFieldsProvider>
		</FormBuilderDndContext>
	)
}
