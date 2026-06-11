import { describe, expect, it } from 'vitest'

import {
  formatSubmissionValue,
  generateSubmissionsCSV,
  generateTemplateHeaders,
  parseCsvRowToSubmissionData,
} from './csvTemplateUtils'

// Minimal page factory helpers
const page = (columns: unknown[]) => ({
  id: 'p1',
  rows: [{ id: 'r1', columns }],
  title: 'Page 1',
})

const field = (type: string, name: string, extra: Record<string, unknown> = {}) => ({
  id: `id-${name}`,
  name,
  type,
  hidden: true,
  label: name,
  required: false,
  ...extra,
})

const arrayField = (name: string, subFields: string[], maxRows?: number) => ({
  ...field('array', name),
  rows: [{ id: 'ar1', columns: subFields.map((s) => field('text', s)) }],
  ...(maxRows !== undefined ? { maxRows } : {}),
})

// ---------------------------------------------------------------------------

describe('generateTemplateHeaders', () => {
  it('includes simple field names in camelCase', () => {
    const headers = generateTemplateHeaders([
      page([field('text', 'full_name'), field('email', 'emailAddress')]),
    ])
    expect(headers).toEqual(['fullName', 'emailAddress'])
  })

  it('excludes message fields', () => {
    const headers = generateTemplateHeaders([
      page([field('text', 'name'), { id: 'msg1', type: 'message', richText: undefined }]),
    ])
    expect(headers).not.toContain('message')
    expect(headers).toEqual(['name'])
  })

  it('excludes file fields', () => {
    const headers = generateTemplateHeaders([
      page([field('text', 'name'), field('file', 'attachment')]),
    ])
    expect(headers).not.toContain('attachment')
    expect(headers).toEqual(['name'])
  })

  it('expands array field with maxRows=3 into 3 sets of sub-columns', () => {
    const headers = generateTemplateHeaders([
      page([arrayField('followUp', ['reason', 'detail'], 3)]),
    ])
    expect(headers).toEqual([
      'followUp.[0].reason',
      'followUp.[0].detail',
      'followUp.[1].reason',
      'followUp.[1].detail',
      'followUp.[2].reason',
      'followUp.[2].detail',
    ])
  })

  it('expands array field with no maxRows into 1 set of sub-columns', () => {
    const headers = generateTemplateHeaders([page([arrayField('items', ['label'])])])
    expect(headers).toEqual(['items.[0].label'])
  })

  it('expands array field with maxRows=1 into 1 set', () => {
    const headers = generateTemplateHeaders([page([arrayField('items', ['label'], 1)])])
    expect(headers).toEqual(['items.[0].label'])
  })

  it('flattens fields across multiple pages and rows', () => {
    const pages = [
      {
        id: 'p1',
        rows: [{ id: 'r1', columns: [field('text', 'name')] }],
        title: 'P1',
      },
      {
        id: 'p2',
        rows: [{ id: 'r2', columns: [field('email', 'email')] }],
        title: 'P2',
      },
    ]
    const headers = generateTemplateHeaders(pages)
    expect(headers).toEqual(['name', 'email'])
  })

  it('returns [] for empty pages', () => {
    expect(generateTemplateHeaders([])).toEqual([])
    expect(generateTemplateHeaders(null as never)).toEqual([])
  })
})

// ---------------------------------------------------------------------------

describe('parseCsvRowToSubmissionData', () => {
  it('maps simple fields directly', () => {
    const pages = [page([field('text', 'name'), field('email', 'email')])]
    const row = { name: 'Alice', email: 'alice@example.com' }
    const data = parseCsvRowToSubmissionData(row, pages)
    expect(data).toEqual({ name: 'Alice', email: 'alice@example.com' })
  })

  it('does not include unknown keys in submissionData', () => {
    const pages = [page([field('text', 'name')])]
    const data = parseCsvRowToSubmissionData({ name: 'Y', identifier: 'x' }, pages)
    expect(data).not.toHaveProperty('identifier')
  })

  it('reconstructs array fields from dot-notation keys', () => {
    const af = arrayField('followUp', ['reason', 'detail'], 2)
    const pages = [page([af])]
    const row = {
      'followUp.[0].detail': 'More detail',
      'followUp.[0].reason': 'Better comms',
      'followUp.[1].detail': '',
      'followUp.[1].reason': '',
    }
    const data = parseCsvRowToSubmissionData(row, pages)
    expect(data).toEqual({
      followUp: [
        { detail: 'More detail', reason: 'Better comms' },
        { detail: '', reason: '' },
      ],
    })
  })

  it('coerces toggle to boolean', () => {
    const pages = [page([field('toggle', 'agree')])]
    expect(parseCsvRowToSubmissionData({ agree: 'true' }, pages)).toEqual({
      agree: true,
    })
    expect(parseCsvRowToSubmissionData({ agree: 'false' }, pages)).toEqual({
      agree: false,
    })
    expect(parseCsvRowToSubmissionData({ agree: '' }, pages)).toEqual({
      agree: false,
    })
  })

  it('coerces consent to boolean', () => {
    const pages = [page([field('consent', 'gdpr')])]
    expect(parseCsvRowToSubmissionData({ gdpr: 'true' }, pages)).toEqual({
      gdpr: true,
    })
    expect(parseCsvRowToSubmissionData({ gdpr: '1' }, pages)).toEqual({
      gdpr: true,
    })
  })

  it('coerces number fields to number', () => {
    const pages = [page([field('number', 'age')])]
    expect(parseCsvRowToSubmissionData({ age: '42' }, pages)).toEqual({
      age: 42,
    })
    expect(parseCsvRowToSubmissionData({ age: '' }, pages)).toEqual({
      age: null,
    })
  })

  it('splits checkbox values by comma', () => {
    const pages = [page([field('checkbox', 'options')])]
    const data = parseCsvRowToSubmissionData({ options: 'a,b,c' }, pages)
    expect(data).toEqual({ options: ['a', 'b', 'c'] })
  })

  it('returns empty array for empty checkbox', () => {
    const pages = [page([field('checkbox', 'options')])]
    const data = parseCsvRowToSubmissionData({ options: '' }, pages)
    expect(data).toEqual({ options: [] })
  })

  it('round-trips simple form headers back to submissionData', () => {
    const pages = [page([field('text', 'name'), field('email', 'email'), field('radio', 'rating')])]
    const row = { name: 'Alice', email: 'a@b.com', rating: '5' }
    const data = parseCsvRowToSubmissionData(row, pages)
    expect(data).toEqual({ name: 'Alice', email: 'a@b.com', rating: '5' })
  })
})

// ---------------------------------------------------------------------------

describe('generateSubmissionsCSV — formula injection (CWE-1236)', () => {
  const pages = [page([field('text', 'note')])]

  const csvFor = (note: string) =>
    generateSubmissionsCSV([{ submissionData: { note } }], pages)

  it.each(['=cmd', '+1+1', '-2+3', '@SUM(A1)', '\tnote', '\rnote'])(
    'prefixes a quote to neutralise leading %j',
    (value) => {
      const csv = csvFor(value)
      // Row layout is `identifier,submitted,note` — both leading cells empty.
      const noteCell = (csv.split('\n')[1] ?? '').replace(/^,,/, '')
      expect(noteCell.startsWith("'")).toBe(true)
    },
  )

  it('neutralises a classic =cmd formula', () => {
    const csv = csvFor("=cmd|'/c calc'!A1")
    // No comma/quote/newline → not wrapped, but the leading = is defused.
    expect(csv).toContain(`,,'=cmd|'/c calc'!A1`)
  })

  it('quotes and neutralises a formula that also contains a comma', () => {
    const csv = csvFor('=SUM(1,2)')
    expect(csv).toContain(`"'=SUM(1,2)"`)
  })

  it('leaves safe values untouched', () => {
    const csv = csvFor('Alice')
    expect(csv.split('\n')[1]).toBe(',,Alice')
  })
})

describe('formatSubmissionValue', () => {
  it('returns empty string for null', () => {
    expect(formatSubmissionValue(null, 'text')).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatSubmissionValue(undefined, 'text')).toBe('')
  })

  describe('checkbox', () => {
    it('maps array values to option labels when options are provided', () => {
      const options = [
        { label: 'Apple', value: 'a' },
        { label: 'Banana', value: 'b' },
      ]
      expect(formatSubmissionValue(['a', 'b'], 'checkbox', options)).toBe('Apple, Banana')
    })

    it('falls back to the raw value when an option has no matching label', () => {
      const options = [{ label: 'Apple', value: 'a' }]
      expect(formatSubmissionValue(['a', 'z'], 'checkbox', options)).toBe('Apple, z')
    })

    it('joins array values when no options are provided', () => {
      expect(formatSubmissionValue(['x', 'y'], 'checkbox')).toBe('x, y')
    })

    it('stringifies a non-array checkbox value', () => {
      expect(formatSubmissionValue(true, 'checkbox')).toBe('true')
    })
  })

  describe('consent / toggle', () => {
    it('renders true as "Yes"', () => {
      expect(formatSubmissionValue(true, 'toggle')).toBe('Yes')
      expect(formatSubmissionValue(true, 'consent')).toBe('Yes')
    })

    it('renders false as "No"', () => {
      expect(formatSubmissionValue(false, 'toggle')).toBe('No')
    })

    it('renders a non-boolean as empty string', () => {
      expect(formatSubmissionValue('maybe', 'toggle')).toBe('')
    })
  })

  describe('date', () => {
    it('formats a valid ISO string to YYYY-MM-DD', () => {
      expect(formatSubmissionValue('2024-03-15T10:30:00.000Z', 'date')).toBe('2024-03-15')
    })

    it('returns the original string when the date is unparseable', () => {
      expect(formatSubmissionValue('not-a-date', 'date')).toBe('not-a-date')
    })

    it('stringifies a non-string date value', () => {
      expect(formatSubmissionValue(0, 'date')).toBe('0')
    })
  })

  describe('text-like types', () => {
    it.each(['email', 'text', 'textarea'])('stringifies %s values', (type) => {
      expect(formatSubmissionValue('hello', type)).toBe('hello')
    })
  })

  describe('file', () => {
    it('joins file names from an array', () => {
      expect(formatSubmissionValue([{ name: 'a.pdf' }, { name: 'b.png' }], 'file')).toBe(
        'a.pdf, b.png',
      )
    })

    it('uses "File" for entries missing a name', () => {
      expect(formatSubmissionValue([{ name: 'a.pdf' }, {}], 'file')).toBe('a.pdf, File')
    })

    it('stringifies a non-array file value', () => {
      expect(formatSubmissionValue('single.pdf', 'file')).toBe('single.pdf')
    })
  })

  it('stringifies number values', () => {
    expect(formatSubmissionValue(42, 'number')).toBe('42')
  })

  describe('radio / select', () => {
    it('maps the value to its option label', () => {
      const options = [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ]
      expect(formatSubmissionValue('active', 'select', options)).toBe('Active')
      expect(formatSubmissionValue('inactive', 'radio', options)).toBe('Inactive')
    })

    it('stringifies the value when no option matches', () => {
      const options = [{ label: 'Active', value: 'active' }]
      expect(formatSubmissionValue('archived', 'select', options)).toBe('archived')
    })

    it('stringifies the value when no options are provided', () => {
      expect(formatSubmissionValue('active', 'radio')).toBe('active')
    })
  })

  describe('default / unknown type', () => {
    it('joins array values', () => {
      expect(formatSubmissionValue(['one', 'two'], 'mystery')).toBe('one, two')
    })

    it('JSON-stringifies object values', () => {
      expect(formatSubmissionValue({ a: 1 }, 'mystery')).toBe('{"a":1}')
    })

    it('stringifies primitive values', () => {
      expect(formatSubmissionValue(99, 'mystery')).toBe('99')
    })
  })
})
