'use client'

import type { ChangeEvent } from 'react'

import { safeClosestCenter } from '@/form-builder/utils/safeClosestCenter'
import { useFormContext } from '@/shared/context/EditorFormContext'
import { Inline, Stack  } from '@/shared/ui/layout'
import { nanoid } from '@/shared/utils/nanoid'
import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	arrayMove,
	horizontalListSortingStrategy,
	SortableContext,
	useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EditIcon, PlusIcon, Popup, PopupList, TextInput, XIcon } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import type {
	ArrayField,
	ArrayFieldEditorProps,
	ArrayItemField,
	ArrayItemFieldType,
	ArrayRow,
} from '../../../fieldSchema'

import { arrayFieldSchema, createDefaultField } from '../../../fieldSchema'
import { EditorTabs } from '../../layout/EditorTabs'
import { AdvancedFields, GeneralFields } from '../SharedFields'
import styles from './ArrayFieldEditor.module.css'
import { SubEditorForm } from './SubEditorForm'

const ARRAY_ITEM_FIELD_TYPES: { label: string; value: ArrayItemFieldType }[] = [
	{ label: 'Text', value: 'text' },
	{ label: 'TextArea', value: 'textarea' },
	{ label: 'Email', value: 'email' },
	{ label: 'Number', value: 'number' },
	{ label: 'Radio', value: 'radio' },
	{ label: 'Checkbox', value: 'checkbox' },
	{ label: 'Select', value: 'select' },
	{ label: 'Date', value: 'date' },
	{ label: 'File', value: 'file' },
	{ label: 'Toggle', value: 'toggle' },
	{ label: 'Consent', value: 'consent' },
]

// ─── Sub-field chip ───────────────────────────────────────────────────────────

type SubFieldChipProps = {
	isActive: boolean
	onDelete: () => void
	onEdit: () => void
	subField: ArrayItemField
}

function SubFieldChip({ isActive, onDelete, onEdit, subField }: SubFieldChipProps) {
	const {
		attributes,
		isDragging,
		listeners,
		setActivatorNodeRef,
		setNodeRef,
		transform,
		transition,
	} = useSortable({ id: subField.id })

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			className={cx(
				styles.chip,
				isActive ? styles.chipActive : styles.chipInactive,
				{ [styles.dragging]: isDragging },
			)}
			data-testid="field-item"
			ref={setNodeRef}
			style={style}
			{...attributes}
		>
			<span
				className={styles.handle}
				ref={setActivatorNodeRef}
				title="Drag to reorder"
				{...listeners}
			>
				⋮⋮
			</span>

			<div className={styles.chipContent}>
				<div className={styles.chipTitle}>
					{subField.label || '(untitled)'}
				</div>
				<div className={styles.chipType}>{subField.type}</div>
			</div>

			<button
				className={styles.iconButton}
				data-testid="field-item-edit-button"
				onClick={onEdit}
				type="button"
			>
				<span className={styles.srOnly}>Edit</span>
				<EditIcon />
				<div className={styles.absoluteInset} />
			</button>

			<button
				className={styles.iconButtonZ}
				onClick={onDelete}
				title="Delete field"
				type="button"
			>
				<span className={styles.srOnly}>Delete</span>
				<XIcon />
			</button>
		</div>
	)
}

// ─── Single array row ─────────────────────────────────────────────────────────

type ArrayRowItemProps = {
	onAddField: (rowId: string, type: ArrayItemFieldType) => void
	onMoveRowDown: (rowId: string) => void
	onMoveRowUp: (rowId: string) => void
	onRemoveField: (rowId: string, fieldId: string) => void
	onRemoveRow: (rowId: string) => void
	onReorderFields: (rowId: string, newColumns: ArrayItemField[]) => void
	onUpdateField: (rowId: string, fieldId: string, updated: ArrayItemField) => void
	row: ArrayRow
	rowIndex: number
	selectedSubFieldId: null | string
	setSelectedSubFieldId: (id: null | string) => void
	totalRows: number
}

function ArrayRowItem({
	onAddField,
	onMoveRowDown,
	onMoveRowUp,
	onRemoveField,
	onRemoveRow,
	onReorderFields,
	onUpdateField,
	row,
	rowIndex,
	selectedSubFieldId,
	setSelectedSubFieldId,
	totalRows,
}: ArrayRowItemProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	)

	const fieldIds = row.columns.map((f) => f.id)

	function handleDragEnd({ active, over }: DragEndEvent) {
		if (!over || active.id === over.id) {return}
		const oldIndex = row.columns.findIndex((f) => f.id === active.id)
		const newIndex = row.columns.findIndex((f) => f.id === over.id)
		if (oldIndex < 0 || newIndex < 0) {return}
		onReorderFields(row.id, arrayMove(row.columns, oldIndex, newIndex))
	}

	const selectedSubField = row.columns.find((sf) => sf.id === selectedSubFieldId) ?? null

	return (
		<div className={styles.rowItem}>
			<div className={styles.rowHeader}>
				<span className={styles.rowHeaderLabel}>
					Row {rowIndex + 1}
				</span>
				<button
					className={styles.rowMoveButton}
					disabled={rowIndex === 0}
					onClick={() => onMoveRowUp(row.id)}
					title="Move row up"
					type="button"
				>
					↑
				</button>
				<button
					className={styles.rowMoveButton}
					disabled={rowIndex === totalRows - 1}
					onClick={() => onMoveRowDown(row.id)}
					title="Move row down"
					type="button"
				>
					↓
				</button>
				<button
					className={styles.rowDeleteButton}
					onClick={() => onRemoveRow(row.id)}
					title="Delete row"
					type="button"
				>
					<span className={styles.srOnly}>Delete row</span>
					<XIcon />
				</button>
			</div>

			<DndContext
				collisionDetection={safeClosestCenter}
				id={`array-row-dnd-${row.id}`}
				onDragEnd={handleDragEnd}
				sensors={sensors}
			>
				<SortableContext items={fieldIds} strategy={horizontalListSortingStrategy}>
					<div className={styles.dropZone}>
						{row.columns.length === 0 ? (
							<span className={styles.dropZoneEmpty}>
								Add a field below
							</span>
						) : (
							<Inline className={styles.chipWrap}>
								{row.columns.map((subField) => (
									<SubFieldChip
										isActive={selectedSubFieldId === subField.id}
										key={subField.id}
										onDelete={() => {
											onRemoveField(row.id, subField.id)
											if (selectedSubFieldId === subField.id) {
												setSelectedSubFieldId(null)
											}
										}}
										onEdit={() =>
											setSelectedSubFieldId(
												selectedSubFieldId === subField.id ? null : subField.id,
											)
										}
										subField={subField}
									/>
								))}
							</Inline>
						)}
					</div>
				</SortableContext>
			</DndContext>

			{selectedSubField && (
				<SubEditorForm
					onChange={(updated) => onUpdateField(row.id, updated.id, updated)}
					onClose={() => setSelectedSubFieldId(null)}
					subField={selectedSubField}
				/>
			)}

			<Popup
				button={
					<button
						className={styles.addFieldButton}
						data-testid="add-sub-field"
						type="button"
					>
						<PlusIcon />
						<span className={styles.addFieldLabel}>Add field to row</span>
					</button>
				}
				buttonType="custom"
			>
				<PopupList.ButtonGroup>
					{ARRAY_ITEM_FIELD_TYPES.map((t) => (
						<PopupList.Button key={t.value} onClick={() => onAddField(row.id, t.value)}>
							{t.label}
						</PopupList.Button>
					))}
				</PopupList.ButtonGroup>
			</Popup>
		</div>
	)
}

// ─── Sub-fields canvas ────────────────────────────────────────────────────────

type SubFieldsManagerProps = {
	onChange: (rows: ArrayRow[]) => void
	rows: ArrayRow[]
	selectedSubFieldId: null | string
	setSelectedSubFieldId: (id: null | string) => void
}

function SubFieldsManager({
	onChange,
	rows,
	selectedSubFieldId,
	setSelectedSubFieldId,
}: SubFieldsManagerProps) {
	function addRow() {
		onChange([...rows, { id: nanoid(), columns: [] }])
	}

	function addField(rowId: string, type: ArrayItemFieldType) {
		const newField = createDefaultField(nanoid(), type) as ArrayItemField
		onChange(
			rows.map((row) =>
				row.id === rowId ? { ...row, columns: [...row.columns, newField] } : row,
			),
		)
		setSelectedSubFieldId(newField.id)
	}

	function reorderFields(rowId: string, newColumns: ArrayItemField[]) {
		onChange(rows.map((row) => (row.id === rowId ? { ...row, columns: newColumns } : row)))
	}

	function updateField(rowId: string, fieldId: string, updated: ArrayItemField) {
		onChange(
			rows.map((row) =>
				row.id === rowId
					? { ...row, columns: row.columns.map((f) => (f.id === fieldId ? updated : f)) }
					: row,
			),
		)
	}

	function removeField(rowId: string, fieldId: string) {
		onChange(
			rows.map((row) =>
				row.id === rowId
					? { ...row, columns: row.columns.filter((f) => f.id !== fieldId) }
					: row,
			),
		)
	}

	function removeRow(rowId: string) {
		onChange(rows.filter((r) => r.id !== rowId))
	}

	function moveRow(rowId: string, direction: 'down' | 'up') {
		const i = rows.findIndex((r) => r.id === rowId)
		if (i < 0) {return}
		const next = [...rows]
		const target = direction === 'up' ? i - 1 : i + 1
		if (target < 0 || target >= next.length) {return
		;}[next[i], next[target]] = [next[target], next[i]]
		onChange(next)
	}

	return (
		<Stack className={styles.subFieldsContainer}>
			<label className="field-label">Sub-fields layout</label>

			<div className={styles.subFieldsDropArea}>
				{rows.length === 0 ? (
					<span className={styles.subFieldsEmpty}>Add a row to get started</span>
				) : (
					rows.map((row, i) => (
						<ArrayRowItem
							key={row.id}
							onAddField={addField}
							onMoveRowDown={(id) => moveRow(id, 'down')}
							onMoveRowUp={(id) => moveRow(id, 'up')}
							onRemoveField={removeField}
							onRemoveRow={removeRow}
							onReorderFields={reorderFields}
							onUpdateField={updateField}
							row={row}
							rowIndex={i}
							selectedSubFieldId={selectedSubFieldId}
							setSelectedSubFieldId={setSelectedSubFieldId}
							totalRows={rows.length}
						/>
					))
				)}
			</div>

			<button
				className={styles.addRowButton}
				data-testid="add-row"
				onClick={addRow}
				type="button"
			>
				<PlusIcon />
				Add row
			</button>
		</Stack>
	)
}

// ─── Main editor ─────────────────────────────────────────────────────────────

function ArrayFieldEditorContent() {
	const form = useFormContext<ArrayField>()
	const [selectedSubFieldId, setSelectedSubFieldId] = React.useState<null | string>(null)

	return (
		<>
			<GeneralFields>
				<form.Field name="rows">
					{(f) => (
						<SubFieldsManager
							onChange={(rows) => f.handleChange(rows)}
							rows={(f.state.value ?? [])}
							selectedSubFieldId={selectedSubFieldId}
							setSelectedSubFieldId={setSelectedSubFieldId}
						/>
					)}
				</form.Field>
			</GeneralFields>
			<hr className={styles.divider} />
			<AdvancedFields exclude={['placeholder', 'defaultValue', 'errorMessage', 'hidden']}>
				<div className={styles.twoColGrid}>
					<form.Field name="minRows">
						{(f) => (
							<TextInput
								label="Min Rows"
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									f.handleChange(e.target.value ? Number(e.target.value) : 0)
								}
								path="minRows"
								value={f.state.value?.toString() ?? '0'}
							/>
						)}
					</form.Field>
					<form.Field name="maxRows">
						{(f) => (
							<TextInput
								label="Max Rows"
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									f.handleChange(e.target.value ? Number(e.target.value) : undefined)
								}
								path="maxRows"
								value={f.state.value?.toString() ?? ''}
							/>
						)}
					</form.Field>
				</div>
			</AdvancedFields>
		</>
	)
}

export function ArrayFieldEditor({ field }: ArrayFieldEditorProps) {
	return (
		<EditorTabs field={field} onChangeValidator={arrayFieldSchema}>
			<ArrayFieldEditorContent />
		</EditorTabs>
	)
}
