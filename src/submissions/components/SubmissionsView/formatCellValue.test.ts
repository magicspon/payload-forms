import { describe, expect, it } from 'vitest'

import { formatCellValue } from './formatCellValue'

describe('formatCellValue', () => {
  it('renders an em-dash for null or undefined', () => {
    expect(formatCellValue(null, 'text')).toEqual({ kind: 'text', text: '—' })
    expect(formatCellValue(undefined, 'text')).toEqual({ kind: 'text', text: '—' })
  })

  describe('array', () => {
    it('badges the item count with singular/plural', () => {
      expect(formatCellValue([1], 'array')).toEqual({ kind: 'badge', text: '1 item' })
      expect(formatCellValue([1, 2], 'array')).toEqual({ kind: 'badge', text: '2 items' })
    })

    it('treats a non-array value as zero items', () => {
      expect(formatCellValue('x', 'array')).toEqual({ kind: 'badge', text: '0 items' })
    })
  })

  it('badges group values', () => {
    expect(formatCellValue({}, 'group')).toEqual({ kind: 'badge', text: 'Group' })
  })

  describe('file', () => {
    it('badges the file count with singular/plural', () => {
      expect(formatCellValue([1], 'file')).toEqual({ kind: 'badge', text: '1 file' })
      expect(formatCellValue([1, 2], 'file')).toEqual({ kind: 'badge', text: '2 files' })
    })

    it('shows the filename when a single file object has one', () => {
      expect(formatCellValue({ filename: 'doc.pdf' }, 'file')).toEqual({
        kind: 'text',
        text: 'doc.pdf',
      })
    })

    it('badges "1 file" when a single file object has no filename', () => {
      expect(formatCellValue({}, 'file')).toEqual({ kind: 'badge', text: '1 file' })
    })

    it('renders an em-dash for a non-object, non-array file value', () => {
      expect(formatCellValue('nope', 'file')).toEqual({ kind: 'text', text: '—' })
    })
  })

  describe('toggle / consent', () => {
    it('renders Yes/No from truthiness', () => {
      expect(formatCellValue(true, 'toggle')).toEqual({ kind: 'text', text: 'Yes' })
      // Only null/undefined short-circuit to '—'; other falsy values render 'No'.
      expect(formatCellValue(false, 'toggle')).toEqual({ kind: 'text', text: 'No' })
      expect(formatCellValue(0, 'consent')).toEqual({ kind: 'text', text: 'No' })
    })
  })

  describe('checkbox', () => {
    it('joins array values with commas', () => {
      expect(formatCellValue(['a', 'b'], 'checkbox')).toEqual({ kind: 'text', text: 'a, b' })
    })

    it('renders an em-dash for an empty array or non-array', () => {
      expect(formatCellValue([], 'checkbox')).toEqual({ kind: 'text', text: '—' })
      expect(formatCellValue('x', 'checkbox')).toEqual({ kind: 'text', text: '—' })
    })
  })

  it('passes the raw value through for plain text types', () => {
    expect(formatCellValue('hello', 'text')).toEqual({ kind: 'raw', value: 'hello' })
  })
})
