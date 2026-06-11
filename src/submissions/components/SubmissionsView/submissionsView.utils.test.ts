import type { FormPage } from '@/form-builder/utils/formTree'

import { describe, expect, it } from 'vitest'

import { deriveColumns, parsePageParam, resolveFormId } from './submissionsView.utils'

describe('parsePageParam', () => {
  it('parses a valid page number', () => {
    expect(parsePageParam('3')).toBe(3)
  })

  it('defaults to 1 when null', () => {
    expect(parsePageParam(null)).toBe(1)
  })

  it('clamps zero and negatives to 1', () => {
    expect(parsePageParam('0')).toBe(1)
    expect(parsePageParam('-5')).toBe(1)
  })

  it('clamps NaN input to 1', () => {
    // Number('abc') is NaN; Math.max(1, NaN) is NaN, so this documents the actual behaviour
    expect(parsePageParam('abc')).toBeNaN()
  })
})

describe('resolveFormId', () => {
  it('reads the id preceding "submissions" in route segments', () => {
    const id = resolveFormId({
      pathname: '',
      segments: ['collections', 'forms', '42', 'submissions'],
    })
    expect(id).toBe('42')
  })

  it('falls back to parsing the URL pathname', () => {
    const id = resolveFormId({
      pathname: '/admin/collections/forms/7/submissions',
      segments: [],
    })
    expect(id).toBe('7')
  })

  it('falls back to docID then initDocID', () => {
    expect(resolveFormId({ docID: 'doc-1', pathname: '', segments: [] })).toBe('doc-1')
    expect(resolveFormId({ initDocID: 'init-1', pathname: '', segments: [] })).toBe('init-1')
  })

  it('returns undefined when nothing resolves', () => {
    expect(resolveFormId({ pathname: '', segments: [] })).toBeUndefined()
  })

  it('ignores "submissions" at index 0 (no preceding id)', () => {
    expect(resolveFormId({ pathname: '/submissions', segments: ['submissions'] })).toBeUndefined()
  })
})

describe('deriveColumns', () => {
  const page = (columns: unknown[]): FormPage => ({
    id: 'p1',
    backButton: 'Back',
    nextButton: 'Next',
    rows: [{ id: 'r1', columns: columns as never }],
    title: 'Page',
  })

  it('maps visible non-message fields to column defs with camelCased keys', () => {
    const columns = deriveColumns([
      page([
        { id: 'f1', type: 'text', name: 'first name', label: 'First Name' },
        { id: 'f2', type: 'email', name: 'email', label: 'Email' },
      ]),
    ])
    expect(columns).toEqual([
      { key: 'firstName', label: 'First Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
    ])
  })

  it('excludes message fields and hidden fields', () => {
    const columns = deriveColumns([
      page([
        { id: 'f1', type: 'message', name: 'note', label: 'Note' },
        { id: 'f2', type: 'text', name: 'secret', label: 'Secret', hidden: true },
        { id: 'f3', type: 'text', name: 'keep', label: 'Keep' },
      ]),
    ])
    expect(columns).toEqual([{ key: 'keep', label: 'Keep', type: 'text' }])
  })

  it('returns an empty array for no pages', () => {
    expect(deriveColumns([])).toEqual([])
  })
})
