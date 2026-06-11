import type { Field, FieldType } from '@/shared/fieldSchema'

import type { TFieldDropParams } from '../useFieldDrop/useFieldDrop'
import type { TRowReorderParams } from '../useRowReorder/useRowReorder'

type DropData = Record<string, unknown>

/** A normalized drag-and-drop outcome, decoupled from the DnD library. */
export type DropIntent =
  | { kind: 'field-drop'; params: TFieldDropParams }
  | { kind: 'none' }
  | { kind: 'row-reorder'; params: TRowReorderParams }

/**
 * Translate a raw drop (source payload + hovered drop targets) into a single
 * intent. `extractEdge` is injected so this stays pure and testable without the
 * pragmatic-drag-and-drop runtime.
 */
export function resolveDropIntent(args: {
  extractEdge: (data: DropData) => null | string
  source: { data: DropData }
  targets: { data: DropData }[]
}): DropIntent {
  const { extractEdge, source, targets } = args

  if (targets.length === 0) {
    return { kind: 'none' }
  }

  // ── Row reorder ──
  if (source.data.type === 'existing-row') {
    const rowTarget = targets.find((t) => t.data.type === 'row-target')
    const newRowTarget = targets.find((t) => t.data.type === 'new-row-target')

    if (rowTarget) {
      const edge = extractEdge(rowTarget.data) as 'bottom' | 'top' | null
      if (!edge) {
        return { kind: 'none' }
      }
      return {
        kind: 'row-reorder',
        params: {
          edge,
          sourcePageId: source.data.pageId as string,
          sourceRowId: source.data.rowId as string,
          targetPageId: rowTarget.data.pageId as string,
          targetRowId: rowTarget.data.rowId as string,
        },
      }
    }

    if (newRowTarget) {
      return {
        kind: 'row-reorder',
        params: {
          edge: 'bottom',
          sourcePageId: source.data.pageId as string,
          sourceRowId: source.data.rowId as string,
          targetPageId: newRowTarget.data.pageId as string,
        },
      }
    }

    return { kind: 'none' }
  }

  // ── Field drop (new or existing) ──
  const newRowTarget = targets.find((t) => t.data.type === 'new-row-target')
  const fieldTarget = targets.find((t) => t.data.type === 'field-target')
  const rowTarget = targets.find((t) => t.data.type === 'row-target')

  const targetFieldId = fieldTarget?.data.targetFieldId as string | undefined
  const edge = fieldTarget ? (extractEdge(fieldTarget.data) as 'left' | 'right' | null) : null
  const rowId = (rowTarget?.data.rowId ?? '') as string
  const pageId = (newRowTarget?.data.pageId ?? rowTarget?.data.pageId ?? '') as string
  const createNewRow = !!newRowTarget

  const base = { createNewRow, edge, pageId, rowId, targetFieldId }

  if (source.data.type === 'new-field') {
    return {
      kind: 'field-drop',
      params: { ...base, type: 'new', fieldType: source.data.fieldType as FieldType },
    }
  }

  if (source.data.type === 'existing-field') {
    return {
      kind: 'field-drop',
      params: { ...base, type: 'existing', sourceField: source.data.field as Field },
    }
  }

  return { kind: 'none' }
}
