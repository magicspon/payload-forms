import type { FormPage } from '@/form-builder/utils/formTree'

import { describe, expect, it } from 'vitest'

import {
  applyInsertMode,
  buildFieldsFromMappings,
  buildMappingsFromHeaders,
  computeNameErrors,
  inferFieldType,
  isOptionsType,
  type Mapping,
} from './importSchema.utils'

/** Build a mapping with sensible defaults for tests. */
function mapping(overrides: Partial<Mapping> = {}): Mapping {
  return {
    name: 'field',
    fieldType: 'text',
    header: 'Field',
    options: [],
    ...overrides,
  }
}

describe('inferFieldType', () => {
  it.each([
    ['Email Address', 'email'],
    ['Start Date', 'date'],
    ['Age', 'number'],
    ['Item Count', 'number'],
    ['Total Amount', 'number'],
    ['Marketing Consent', 'consent'],
    ['Do you agree', 'consent'],
    ['Notifications Enabled', 'toggle'],
    ['Is Active', 'toggle'],
    ['First Name', 'text'],
  ])('infers %s → %s', (header, expected) => {
    expect(inferFieldType(header)).toBe(expected)
  })

  it('matches case-insensitively', () => {
    expect(inferFieldType('EMAIL')).toBe('email')
  })

  it('prioritises email over later matches', () => {
    // "email" is checked before "date"; a header containing both resolves to email
    expect(inferFieldType('email date')).toBe('email')
  })
})

describe('isOptionsType', () => {
  it('is true for checkbox, radio, select', () => {
    expect(isOptionsType('checkbox')).toBe(true)
    expect(isOptionsType('radio')).toBe(true)
    expect(isOptionsType('select')).toBe(true)
  })

  it('is false for other types and null', () => {
    expect(isOptionsType('text')).toBe(false)
    expect(isOptionsType(null)).toBe(false)
  })
})

describe('computeNameErrors', () => {
  it('returns no errors for unique, valid names', () => {
    const errors = computeNameErrors(
      [mapping({ name: 'a' }), mapping({ name: 'b' })],
      new Set(),
    )
    expect(errors.size).toBe(0)
  })

  it('skips rows with a null fieldType', () => {
    const errors = computeNameErrors(
      [mapping({ name: '', fieldType: null }), mapping({ name: 'ok' })],
      new Set(),
    )
    expect(errors.size).toBe(0)
  })

  it('flags an empty name as required', () => {
    const errors = computeNameErrors([mapping({ name: '   ' })], new Set())
    expect(errors.get(0)).toBe('Name is required')
  })

  it('flags a name already present in the form', () => {
    const errors = computeNameErrors([mapping({ name: 'email' })], new Set(['email']))
    expect(errors.get(0)).toBe('"email" already exists in the form')
  })

  it('flags both occurrences of a duplicate name', () => {
    const errors = computeNameErrors(
      [mapping({ name: 'dup' }), mapping({ name: 'dup' })],
      new Set(),
    )
    expect(errors.get(0)).toBe('"dup" is used more than once')
    expect(errors.get(1)).toBe('"dup" is used more than once')
  })
})

describe('buildMappingsFromHeaders', () => {
  it('infers type and camelCases the name per header', () => {
    const [m] = buildMappingsFromHeaders(['Email Address'])
    expect(m).toMatchObject({
      name: 'emailAddress',
      fieldType: 'email',
      header: 'Email Address',
      options: [],
    })
  })

  it('leaves options empty since no options-type is inferred from a header name', () => {
    // inferFieldType never returns checkbox/radio/select, so headers never seed options.
    const [m] = buildMappingsFromHeaders(['Select One'])
    expect(m.options).toEqual([])
  })
})

describe('buildFieldsFromMappings', () => {
  it('skips mappings with a null fieldType', () => {
    const fields = buildFieldsFromMappings([
      mapping({ name: 'keep' }),
      mapping({ name: 'skip', fieldType: null }),
    ])
    expect(fields).toHaveLength(1)
    expect(fields[0]).toMatchObject({ name: 'keep', label: 'Field', type: 'text' })
  })

  it('trims the field name and uses the header as the label', () => {
    const fields = buildFieldsFromMappings([
      mapping({ name: '  spaced  ', header: 'My Header' }),
    ])
    expect(fields[0]).toMatchObject({ name: 'spaced', label: 'My Header' })
  })

  it('attaches only non-empty options for options-type fields', () => {
    const [field] = buildFieldsFromMappings([
      mapping({
        name: 'choice',
        fieldType: 'select',
        options: [
          { label: 'One', value: 'one' },
          { label: '   ', value: 'blank' },
        ],
      }),
    ])
    expect((field as { options: unknown[] }).options).toEqual([{ label: 'One', value: 'one' }])
  })
})

describe('applyInsertMode', () => {
  const page = (id: string, title: string): FormPage => ({
    id,
    backButton: 'Back',
    nextButton: 'Next',
    rows: [],
    title,
  })
  const fields = buildFieldsFromMappings([mapping({ name: 'a' }), mapping({ name: 'b' })])

  it('replace mode returns a single fresh page with all fields', () => {
    const result = applyInsertMode({
      fields,
      mode: 'replace',
      newPageTitle: '',
      pages: [page('old', 'Old')],
      targetPageId: '',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].title).toBe('Page 1')
    expect(result.pages[0].rows).toHaveLength(2)
  })

  it('append mode adds rows to the targeted page', () => {
    const result = applyInsertMode({
      fields,
      mode: 'append',
      newPageTitle: '',
      pages: [page('p1', 'One')],
      targetPageId: 'p1',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.pages[0].rows).toHaveLength(2)
  })

  it('append mode falls back to the first page when no target is set', () => {
    const result = applyInsertMode({
      fields,
      mode: 'append',
      newPageTitle: '',
      pages: [page('first', 'First')],
      targetPageId: '',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.pages[0].id).toBe('first')
    expect(result.pages[0].rows).toHaveLength(2)
  })

  it('append mode errors when there is no page to append to', () => {
    const result = applyInsertMode({
      fields,
      mode: 'append',
      newPageTitle: '',
      pages: [],
      targetPageId: '',
    })
    expect(result).toEqual({ error: 'No page available to append to.', ok: false })
  })

  it('new-page mode appends a page using the provided title', () => {
    const result = applyInsertMode({
      fields,
      mode: 'new-page',
      newPageTitle: '  Extra  ',
      pages: [page('p1', 'One')],
      targetPageId: '',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.pages).toHaveLength(2)
    expect(result.pages[1].title).toBe('Extra')
  })

  it('new-page mode defaults the title when none is given', () => {
    const result = applyInsertMode({
      fields,
      mode: 'new-page',
      newPageTitle: '   ',
      pages: [page('p1', 'One')],
      targetPageId: '',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.pages[1].title).toBe('Imported Fields')
  })
})
