'use client'

import { useFieldDrop } from '@/form-builder/hooks/useFieldDrop'
import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { useRowReorder } from '@/form-builder/hooks/useRowReorder'
import { safeClosestCenter } from '@/form-builder/utils/safeClosestCenter'
import { FieldMetaProvider } from '@/shared/context/FieldMetaProvider'
import { FormFieldsProvider, useFormFields } from '@/shared/context/FormFieldsContext'
import { Inline, Stack  } from '@/shared/ui/layout'
import { nanoid } from '@/shared/utils/nanoid'
import {
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
} from '@dnd-kit/sortable'
import { Button, Drawer, PlusIcon, useField, useModal } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import type { Field, FieldType } from '../../../fieldSchema'

import { DeletePage } from '../../actions/DeletePage'
import { EditPage } from '../../actions/EditPage'
import { FieldPalette } from '../../fields/FieldPalette'
import { FieldRenderer } from '../../fields/FieldRenderer'
import { PageTab } from '../../layout/PageTab'
import { TabItem } from '../../layout/TabItem'
import { type DndEdge, DndIndicatorProvider } from './DndIndicatorContext'
import styles from './FormCanvas.module.css'

// ─── Drag preview shown in the overlay during drag ────────────────────────────

function DragPreview({ type, label }: { label: string; type: string }) {
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

// ─── Inner canvas — holds DnD state and wraps children ───────────────────────

type ActiveDragItem =
	| { field: Field; kind: 'existing-field' }
	| { fieldType: string; kind: 'new-field'; label: string }
	| { kind: 'existing-row'; label: string; pageId: string; rowId: string }

function FormCanvasInner({ children, palette }: { children: React.ReactNode; palette?: React.ReactNode }) {
	const handleFieldDrop = useFieldDrop()
	const handleRowReorder = useRowReorder()
	const dndId = React.useId()

	const { clearSelectedField, editorDrawerSlug, selectedField, selectedFieldMeta } = useFormFields()
	const { modalState } = useModal()
	const isEditorOpen = !!modalState[editorDrawerSlug]?.isOpen

	// Sync: if the Drawer is closed externally (X button), clear selected field state
	React.useEffect(() => {
		if (!isEditorOpen && selectedField) {
			clearSelectedField()
		}
	}, [isEditorOpen, clearSelectedField, selectedField])

	const editorDrawerTitle = selectedField
		? ('label' in selectedField ? (selectedField.label ?? selectedField.type) : selectedField.type)
		: 'Edit field'

	const [activeItem, setActiveItem] = React.useState<ActiveDragItem | null>(null)
	const [targetId, setTargetId] = React.useState<null | string>(null)
	const [edge, setEdge] = React.useState<DndEdge | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			// require a small movement before drag starts to avoid accidental drags on click
			activationConstraint: { distance: 6 },
		}),
	)

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
				label: `Row`,
				pageId: data.pageId as string,
				rowId: data.rowId as string,
			})
		}
	}

	function handleDragOver({ active, over }: DragOverEvent) {
		if (!over) {
			setTargetId(null)
			setEdge(null)
			return
		}

		const activeType = active.data.current?.type
		const overType = over.data.current?.type

		setTargetId(over.id as string)

		if (activeType === 'row' && overType === 'row') {
			// Determine top/bottom insertion edge for row reordering
			const overRect = over.rect
			const overCenterY = overRect.top + overRect.height / 2
			const translated = active.rect.current.translated
			if (translated) {
				const activeCenterY = translated.top + translated.height / 2
				setEdge(activeCenterY < overCenterY ? 'top' : 'bottom')
			}
		} else if (overType === 'field' && activeType !== 'row') {
			// Determine left/right insertion edge for field reordering
			const overRect = over.rect
			const overCenterX = overRect.left + overRect.width / 2
			const translated = active.rect.current.translated
			if (translated) {
				const activeCenterX = translated.left + translated.width / 2
				setEdge(activeCenterX < overCenterX ? 'left' : 'right')
			}
		} else {
			// Dropping onto a row (append) or new-row target — no edge indicator
			setEdge(null)
		}
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		const cleanup = () => {
			setActiveItem(null)
			setTargetId(null)
			setEdge(null)
		}

		if (!over) { cleanup(); return }

		const activeType = active.data.current?.type as string | undefined
		const overType = over.data.current?.type as string | undefined

		if (activeType === 'row') {
			// Row reordering — only if dropped onto another row
			if (overType === 'row' && edge) {
				handleRowReorder({
					edge: edge as 'bottom' | 'top',
					sourcePageId: active.data.current?.pageId as string,
					sourceRowId: active.id as string,
					targetPageId: over.data.current?.pageId as string,
					targetRowId: over.id as string,
				})
			}
			cleanup()
			return
		}

		const isNewRow = overType === 'new-row'
		const rowId = (over.data.current?.rowId ?? '') as string
		const pageId = (over.data.current?.pageId ?? '') as string
		const targetFieldId = overType === 'field' ? (over.id as string) : undefined
		const fieldEdge = overType === 'field' ? (edge as 'left' | 'right' | null) : null

		if (activeType === 'new-field') {
			handleFieldDrop({
				type: 'new',
				createNewRow: isNewRow,
				edge: fieldEdge,
				fieldType: active.data.current?.fieldType as FieldType,
				pageId,
				rowId,
				targetFieldId,
			})
		} else if (activeType === 'field') {
			handleFieldDrop({
				type: 'existing',
				createNewRow: isNewRow,
				edge: fieldEdge,
				pageId,
				rowId,
				sourceField: active.data.current?.field as Field,
				targetFieldId,
			})
		}

		cleanup()
	}

	const indicatorValue = { edge, targetId }

	return (
		<DndContext
			collisionDetection={safeClosestCenter}
			id={dndId}
			onDragEnd={handleDragEnd}
			onDragOver={handleDragOver}
			onDragStart={handleDragStart}
			sensors={sensors}
		>
			{palette && (
				<div className={styles.paletteWrapper}>
					{palette}
				</div>
			)}
			<DndIndicatorProvider value={indicatorValue}>
				{children}
			</DndIndicatorProvider>
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
			<Drawer slug={editorDrawerSlug} title={editorDrawerTitle}>
				{selectedFieldMeta && (
					<FieldMetaProvider pageId={selectedFieldMeta.pageId} rowId={selectedFieldMeta.rowId}>
						<FieldRenderer {...selectedFieldMeta.field} />
					</FieldMetaProvider>
				)}
			</Drawer>
		</DndContext>
	)
}

// ─── Multi-page layout ────────────────────────────────────────────────────────

function Multipage() {
	const { pages, setPages } = useFormPages()
	const [activeTab, setActiveTab] = React.useState<string | undefined>(
		pages?.[0]?.id,
	)
	const { value: locked } = useField<boolean>({ path: 'locked' })
	const tabDndId = React.useId()

	// Sync active tab when pages load (e.g. on locale switch)
	React.useEffect(() => {
		if (!activeTab && pages?.[0]?.id) {
			setActiveTab(pages[0].id)
		}
	}, [activeTab, pages])

	const pageIds = pages?.map((p) => p.id) ?? []

	const tabSensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	)

	function handleTabDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id || locked) {return}
		const oldIndex = pages.findIndex((p) => p.id === active.id)
		const newIndex = pages.findIndex((p) => p.id === over.id)
		if (oldIndex < 0 || newIndex < 0) {return}
		setPages(arrayMove(pages, oldIndex, newIndex))
	}

	return (
		<Stack className={styles.multipage} data-testid="form-canvas">
			<div className={styles.pagesLayout}>
				<Inline className={styles.tabsRow}>
					<DndContext
						collisionDetection={safeClosestCenter}
						id={tabDndId}
						onDragEnd={handleTabDragEnd}
						sensors={tabSensors}
					>
						<SortableContext items={pageIds} strategy={horizontalListSortingStrategy}>
							<div
								aria-label="Select form page"
								className={styles.tabList}
								role="tablist"
							>
								{pages?.map((page, index) => (
									<TabItem
										count={pages.length}
										disabled={!!locked}
										id={page.id}
										index={index}
										key={page.id}
										tab={activeTab!}
										title={page.title ?? ''}
									>
										<Button
											aria-selected={page.id === activeTab}
											buttonStyle={page.id === activeTab ? 'primary' : 'subtle'}
											className={styles.m0}
											el="button"
											onClick={() => setActiveTab(page.id)}
										>
											{page.title}
										</Button>

										{!locked && pages.length > 1 && page.id === activeTab && (
											<DeletePage
												onDelete={() => {
													setActiveTab(pages?.[0]?.id)
												}}
												pageId={page.id}
											/>
										)}
										{page.id === activeTab && !locked && (
											<EditPage pageId={page.id} />
										)}
									</TabItem>
								))}
							</div>
						</SortableContext>
					</DndContext>
					{!locked && (
						<Button
							className={styles.mlAuto}
							onClick={() => {
								setPages([
									...pages,
									{
										id: nanoid(),
										backButton: 'Back',
										nextButton: 'Next',
										rows: [{ id: nanoid(), columns: [] }],
										title: `Page ${pages.length + 1}`,
									},
								])
							}}
							type="button"
						>
							<PlusIcon /> Add page
						</Button>
					)}
				</Inline>

				{pages?.map((page) => (
					<div
						className={cx({ [styles.hidden]: page.id !== activeTab })}
						key={page.id}
						role="tabpanel"
					>
						<PageTab pageId={page.id} rows={page.rows} />
					</div>
				))}
			</div>
		</Stack>
	)
}

function SinglePage() {
	const { pages } = useFormPages()
	const [page] = pages

	if (!page) {return null}

	return <PageTab pageId={page.id} rows={page.rows} />
}

// ─── Public export ────────────────────────────────────────────────────────────

export function FormCanvas({ fieldPalette = false, multipage = true }: { fieldPalette?: boolean; multipage?: boolean }) {
	return (
		<FormFieldsProvider>
			<FormCanvasInner palette={fieldPalette ? <FieldPalette /> : undefined}>
				{multipage ? <Multipage /> : <SinglePage />}
			</FormCanvasInner>
		</FormFieldsProvider>
	)
}
