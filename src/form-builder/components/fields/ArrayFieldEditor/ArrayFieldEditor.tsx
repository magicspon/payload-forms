

import type {
	ArrayField,
	ArrayFieldEditorProps,
	ArrayItemField,
	ArrayItemFieldType,
	ArrayRow,
} from '@/shared/fieldSchema'
import type { ChangeEvent } from 'react'

import { AdvancedFields, Divider, GeneralFields } from '@/form-builder/components/shared/SharedFields'
import { useFormContext } from '@/form-builder/context/EditorFormContext'
import { safeClosestCenter } from '@/form-builder/utils/safeClosestCenter'
import { arrayFieldSchema, createDefaultField } from '@/shared/fieldSchema'
import { Inline, Stack  } from '@/shared/layout'
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
import { PlusIcon, Popup, PopupList, TextInput, XIcon } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import { EditorTabs } from '../../canvas/EditorTabs'
import styles from './ArrayFieldEditor.module.css'
import { SubFieldEditorDrawer } from './SubFieldEditorDrawer'

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
	onDelete: () => void
	onUpdate: (updated: ArrayItemField) => void
	subField: ArrayItemField
}

function SubFieldChip({ onDelete, onUpdate, subField }: SubFieldChipProps) {
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
			className={cx(styles.chip, styles.chipInactive, { [styles.dragging]: isDragging })}
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

			<SubFieldEditorDrawer onChange={onUpdate} subField={subField} />

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
				id={`row-dnd-${row.id}`}
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
										key={subField.id}
										onDelete={() => onRemoveField(row.id, subField.id)}
										onUpdate={(updated) => onUpdateField(row.id, updated.id, updated)}
										subField={subField}
									/>
								))}
							</Inline>
						)}
					</div>
				</SortableContext>
			</DndContext>

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

export type SubFieldsManagerProps = {
	label?: string
	onChange: (rows: ArrayRow[]) => void
	rows: ArrayRow[]
}

export function SubFieldsManager({ label = 'Sub-fields layout', onChange, rows }: SubFieldsManagerProps) {
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
			<p className="field-label">{label}</p>

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

	return (
		<>
			<GeneralFields>
				<form.Field name="rows">
					{(f) => (
						<SubFieldsManager
							onChange={(rows) => f.handleChange(rows)}
							rows={(f.state.value ?? [])}
						/>
					)}
				</form.Field>
			</GeneralFields>
			<Divider />
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
