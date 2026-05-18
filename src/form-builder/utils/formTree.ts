import type { Field } from '@/shared/fieldSchema'

import { nanoid } from '@/shared/utils/nanoid'

export type FormRow = {
	columns: Field[]
	id: string
}

export type FormPage = {
	backButton: string
	id: string
	nextButton: string
	rows: FormRow[]
	title: string
}

// ============================================================================
// Find operations
// ============================================================================

export function findPage(
	pages: FormPage[],
	pageId: string,
): FormPage | undefined {
	return pages.find((p) => p.id === pageId)
}

export function findRow(
	pages: FormPage[],
	rowId: string,
): { page: FormPage; row: FormRow } | undefined {
	for (const page of pages) {
		const row = page.rows.find((r) => r.id === rowId)
		if (row) {
			return { page, row }
		}
	}
	return undefined
}

export function findField(
	pages: FormPage[],
	fieldId: string,
): { field: Field; page: FormPage; row: FormRow } | undefined {
	for (const page of pages) {
		for (const row of page.rows) {
			const field = row.columns.find((f) => f.id === fieldId)
			if (field) {
				return { field, page, row }
			}
		}
	}
	return undefined
}

// ============================================================================
// Remove operations
// ============================================================================

export function removePage(pages: FormPage[], pageId: string): FormPage[] {
	return pages.filter((p) => p.id !== pageId)
}

export function removeRow(pages: FormPage[], rowId: string): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.filter((r) => r.id !== rowId),
	}))
}

export function removeField(pages: FormPage[], fieldId: string): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) => ({
			...row,
			columns: row.columns.filter((f) => f.id !== fieldId),
		})),
	}))
}

// ============================================================================
// Insert operations - Rows
// ============================================================================

export function insertRowBefore(
	pages: FormPage[],
	targetRowId: string,
	newRow: FormRow,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.flatMap((row) =>
			row.id === targetRowId ? [newRow, row] : [row],
		),
	}))
}

export function insertRowAfter(
	pages: FormPage[],
	targetRowId: string,
	newRow: FormRow,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.flatMap((row) =>
			row.id === targetRowId ? [row, newRow] : [row],
		),
	}))
}

export function insertRowAtIndex(
	pages: FormPage[],
	index: number,
	newRow?: FormRow,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: [
			...page.rows.slice(0, index),
			newRow ?? { id: nanoid(), columns: [] },
			...page.rows.slice(index),
		],
	}))
}

export function appendRowToPage(
	pages: FormPage[],
	pageId: string,
	newRow: FormRow,
): FormPage[] {
	return pages.map((page) =>
		page.id === pageId ? { ...page, rows: [...page.rows, newRow] } : page,
	)
}

// ============================================================================
// Insert operations - Fields
// ============================================================================

export function insertFieldBefore(
	pages: FormPage[],
	targetFieldId: string,
	newField: Field,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) => ({
			...row,
			columns: row.columns.flatMap((field) =>
				field.id === targetFieldId ? [newField, field] : [field],
			),
		})),
	}))
}

export function insertFieldAfter(
	pages: FormPage[],
	targetFieldId: string,
	newField: Field,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) => ({
			...row,
			columns: row.columns.flatMap((field) =>
				field.id === targetFieldId ? [field, newField] : [field],
			),
		})),
	}))
}

export function appendFieldToRow(
	pages: FormPage[],
	rowId: string,
	newField: Field,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) =>
			row.id === rowId ? { ...row, columns: [...row.columns, newField] } : row,
		),
	}))
}

export function prependFieldToRow(
	pages: FormPage[],
	rowId: string,
	newField: Field,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) =>
			row.id === rowId ? { ...row, columns: [newField, ...row.columns] } : row,
		),
	}))
}

// ============================================================================
// Update operations
// ============================================================================

export function updateField(
	pages: FormPage[],
	fieldId: string,
	updates: Partial<Field>,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) => ({
			...row,
			columns: row.columns.map((field) =>
				field.id === fieldId ? ({ ...field, ...updates } as Field) : field,
			),
		})),
	}))
}

export function replaceField(
	pages: FormPage[],
	fieldId: string,
	newField: Field,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) => ({
			...row,
			columns: row.columns.map((field) =>
				field.id === fieldId ? newField : field,
			),
		})),
	}))
}

export function updatePage(
	pages: FormPage[],
	pageId: string,
	updates: Partial<Omit<FormPage, 'id' | 'rows'>>,
): FormPage[] {
	return pages.map((page) =>
		page.id === pageId ? { ...page, ...updates } : page,
	)
}

export function updateRow(
	pages: FormPage[],
	rowId: string,
	updates: Partial<Omit<FormRow, 'columns' | 'id'>>,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) =>
			row.id === rowId ? { ...row, ...updates } : row,
		),
	}))
}

// ============================================================================
// Move operations
// ============================================================================

export function moveField(
	pages: FormPage[],
	fieldId: string,
	targetRowId: string,
	position: 'end' | 'start' = 'end',
): FormPage[] {
	const found = findField(pages, fieldId)
	if (!found) {return pages}

	let result = removeField(pages, fieldId)

	if (position === 'start') {
		result = prependFieldToRow(result, targetRowId, found.field)
	} else {
		result = appendFieldToRow(result, targetRowId, found.field)
	}

	return result
}

export function moveRow(
	pages: FormPage[],
	rowId: string,
	targetPageId: string,
	position: 'end' | 'start' = 'end',
): FormPage[] {
	const found = findRow(pages, rowId)
	if (!found) {return pages}

	let result = removeRow(pages, rowId)

	result = result.map((page) => {
		if (page.id !== targetPageId) {return page}
		return {
			...page,
			rows:
				position === 'start'
					? [found.row, ...page.rows]
					: [...page.rows, found.row],
		}
	})

	return result
}

// ============================================================================
// Reorder operations
// ============================================================================

export function reorderRows(
	pages: FormPage[],
	pageId: string,
	fromIndex: number,
	toIndex: number,
): FormPage[] {
	return pages.map((page) => {
		if (page.id !== pageId) {return page}

		const rows = [...page.rows]
		const [removed] = rows.splice(fromIndex, 1)
		if (!removed) {return page}
		rows.splice(toIndex, 0, removed)

		return { ...page, rows }
	})
}

export function reorderFields(
	pages: FormPage[],
	rowId: string,
	fromIndex: number,
	toIndex: number,
): FormPage[] {
	return pages.map((page) => ({
		...page,
		rows: page.rows.map((row) => {
			if (row.id !== rowId) {return row}

			const columns = [...row.columns]
			const [removed] = columns.splice(fromIndex, 1)
			if (!removed) {return row}
			columns.splice(toIndex, 0, removed)

			return { ...row, columns }
		}),
	}))
}

// ============================================================================
// Utility - get all fields flat (for schema generation, etc.)
// ============================================================================

export function getAllFields(pages: FormPage[]): Field[] {
	return pages.flatMap((page) => page.rows.flatMap((row) => row.columns))
}
