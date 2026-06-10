import { describe, expect, it, vi } from 'vitest'

import { resolveDropIntent } from './dropIntent'

type Data = Record<string, unknown>

const src = (data: Data) => ({ data })
const tgt = (data: Data) => ({ data })
/** Default edge extractor returns a fixed edge; override per-test as needed. */
const edge = (value: null | string) => vi.fn().mockReturnValue(value)

describe('resolveDropIntent', () => {
  it('is a no-op when there are no drop targets', () => {
    const intent = resolveDropIntent({
      extractEdge: edge('top'),
      source: src({ type: 'new-field' }),
      targets: [],
    })
    expect(intent).toEqual({ kind: 'none' })
  })

  describe('row reorder', () => {
    it('reorders relative to a row target using the closest edge', () => {
      const intent = resolveDropIntent({
        extractEdge: edge('bottom'),
        source: src({ type: 'existing-row', rowId: 'r1', pageId: 'p1' }),
        targets: [tgt({ type: 'row-target', rowId: 'r2', pageId: 'p1' })],
      })
      expect(intent).toEqual({
        kind: 'row-reorder',
        params: {
          edge: 'bottom',
          sourcePageId: 'p1',
          sourceRowId: 'r1',
          targetPageId: 'p1',
          targetRowId: 'r2',
        },
      })
    })

    it('is a no-op when the row target has no resolvable edge', () => {
      const intent = resolveDropIntent({
        extractEdge: edge(null),
        source: src({ type: 'existing-row', rowId: 'r1', pageId: 'p1' }),
        targets: [tgt({ type: 'row-target', rowId: 'r2', pageId: 'p1' })],
      })
      expect(intent).toEqual({ kind: 'none' })
    })

    it('appends to the bottom of a page for a new-row target', () => {
      const intent = resolveDropIntent({
        extractEdge: edge(null),
        source: src({ type: 'existing-row', rowId: 'r1', pageId: 'p1' }),
        targets: [tgt({ type: 'new-row-target', pageId: 'p2' })],
      })
      expect(intent).toEqual({
        kind: 'row-reorder',
        params: { edge: 'bottom', sourcePageId: 'p1', sourceRowId: 'r1', targetPageId: 'p2' },
      })
    })

    it('is a no-op for an existing-row drop with no row targets', () => {
      const intent = resolveDropIntent({
        extractEdge: edge('top'),
        source: src({ type: 'existing-row', rowId: 'r1', pageId: 'p1' }),
        targets: [tgt({ type: 'field-target', targetFieldId: 'f1' })],
      })
      expect(intent).toEqual({ kind: 'none' })
    })
  })

  describe('field drop', () => {
    it('drops a new field before a target field (left edge)', () => {
      const intent = resolveDropIntent({
        extractEdge: edge('left'),
        source: src({ type: 'new-field', fieldType: 'email' }),
        targets: [tgt({ type: 'field-target', targetFieldId: 'f1' })],
      })
      expect(intent).toEqual({
        kind: 'field-drop',
        params: {
          createNewRow: false,
          edge: 'left',
          fieldType: 'email',
          pageId: '',
          rowId: '',
          targetFieldId: 'f1',
          type: 'new',
        },
      })
    })

    it('drops an existing field into a new row, carrying the source field', () => {
      const field = { id: 'f9', type: 'text' }
      const intent = resolveDropIntent({
        extractEdge: edge(null),
        source: src({ type: 'existing-field', field }),
        targets: [tgt({ type: 'new-row-target', pageId: 'p3' })],
      })
      expect(intent).toEqual({
        kind: 'field-drop',
        params: {
          createNewRow: true,
          edge: null,
          pageId: 'p3',
          rowId: '',
          sourceField: field,
          targetFieldId: undefined,
          type: 'existing',
        },
      })
    })

    it('falls back to the row target page/row when no field target is present', () => {
      const intent = resolveDropIntent({
        extractEdge: edge('right'),
        source: src({ type: 'new-field', fieldType: 'text' }),
        targets: [tgt({ type: 'row-target', rowId: 'r5', pageId: 'p5' })],
      })
      expect(intent).toMatchObject({
        kind: 'field-drop',
        params: { createNewRow: false, edge: null, pageId: 'p5', rowId: 'r5', type: 'new' },
      })
    })

    it('is a no-op for an unrecognised source type', () => {
      const intent = resolveDropIntent({
        extractEdge: edge('top'),
        source: src({ type: 'mystery' }),
        targets: [tgt({ type: 'row-target', rowId: 'r1', pageId: 'p1' })],
      })
      expect(intent).toEqual({ kind: 'none' })
    })
  })
})
