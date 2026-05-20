'use client'

import type { Field, FieldType } from '@/shared/fieldSchema'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/core'

import { FieldMetaProvider } from '@/form-builder/context/FieldMetaProvider'
import { useFormBuilderDnd } from '@/form-builder/context/FormBuilderProvider'
import { useFormFields } from '@/form-builder/context/FormFieldsContext'
import { useFieldDrop } from '@/form-builder/hooks/useFieldDrop'
import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { useRowReorder } from '@/form-builder/hooks/useRowReorder'
import { FieldRenderer } from '@/form-builder/components/shared/FieldRenderer'
import { safeClosestCenter } from '@/form-builder/utils/safeClosestCenter'
import { Inline, Stack } from '@/shared/layout'
import { nanoid } from '@/shared/utils/nanoid'
import {
	DndContext,
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

import { DeletePage } from '../../actions/DeletePage'
import { EditPage } from '../../actions/EditPage'
import { PageTab } from '../PageTab'
import { TabItem } from '../TabItem'
import { type DndEdge, DndIndicatorProvider } from './DndIndicatorContext'
import styles from './FormCanvas.module.css'

// ─── Inner canvas — registers DnD handlers and wraps children ─────────────────

function FormCanvasInner({ children }: { children: React.ReactNode }) {
	const handleFieldDrop = useFieldDrop()
	const handleRowReorder = useRowReorder()
	const { registerDndHandlers } = useFormBuilderDnd()

	const { clearSelectedField, editorDrawerSlug, selectedField, selectedFieldMeta } = useFormFields()
	const { modalState } = useModal()
	const isEditorOpen = !!modalState[editorDrawerSlug]?.isOpen

	React.useEffect(() => {
		if (!isEditorOpen && selectedField) {
			clearSelectedField()
		}
	}, [isEditorOpen, clearSelectedField, selectedField])

	const editorDrawerTitle = selectedField
		? ('label' in selectedField ? (selectedField.label ?? selectedField.type) : selectedField.type)
		: 'Edit field'

	const [targetId, setTargetId] = React.useState<null | string>(null)
	const [edge, setEdge] = React.useState<DndEdge | null>(null)

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
			const overRect = over.rect
			const overCenterY = overRect.top + overRect.height / 2
			const translated = active.rect.current.translated
			if (translated) {
				const activeCenterY = translated.top + translated.height / 2
				setEdge(activeCenterY < overCenterY ? 'top' : 'bottom')
			}
		} else if (overType === 'field' && activeType !== 'row') {
			const overRect = over.rect
			const overCenterX = overRect.left + overRect.width / 2
			const translated = active.rect.current.translated
			if (translated) {
				const activeCenterX = translated.left + translated.width / 2
				setEdge(activeCenterX < overCenterX ? 'left' : 'right')
			}
		} else {
			setEdge(null)
		}
	}

	function handleDragEnd({ active, over }: DragEndEvent) {
		const cleanup = () => {
			setTargetId(null)
			setEdge(null)
		}

		if (!over) { cleanup(); return }

		const activeType = active.data.current?.type as string | undefined
		const overType = over.data.current?.type as string | undefined

		if (activeType === 'row') {
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

	// Always point to latest handlers so the effect only runs once
	const handlersRef = React.useRef({ handleDragOver, handleDragEnd })
	handlersRef.current = { handleDragOver, handleDragEnd }

	React.useEffect(() => {
		return registerDndHandlers({
			onDragOver: (e) => handlersRef.current.handleDragOver(e),
			onDragEnd: (e) => handlersRef.current.handleDragEnd(e),
		})
	}, [registerDndHandlers])

	const indicatorValue = { edge, targetId }

	return (
		<DndIndicatorProvider value={indicatorValue}>
			{children}
			<Drawer slug={editorDrawerSlug} title={editorDrawerTitle}>
				{selectedFieldMeta && (
					<FieldMetaProvider pageId={selectedFieldMeta.pageId} rowId={selectedFieldMeta.rowId}>
						<FieldRenderer {...selectedFieldMeta.field} />
					</FieldMetaProvider>
				)}
			</Drawer>
		</DndIndicatorProvider>
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
											key="btn"
											onClick={() => setActiveTab(page.id)}
										>
											{page.title}
										</Button>

										{!locked && pages.length > 1 && page.id === activeTab && (
											<DeletePage
												key="delete"
												onDelete={() => {
													setActiveTab(pages?.[0]?.id)
												}}
												pageId={page.id}
											/>
										)}
										{page.id === activeTab && !locked && (
											<EditPage key={`${page.id}:edit`} pageId={page.id} />
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

export function FormCanvas({ multipage = true }: { multipage?: boolean }) {
	return (
		<FormCanvasInner>
			{multipage ? <Multipage /> : <SinglePage />}
		</FormCanvasInner>
	)
}
