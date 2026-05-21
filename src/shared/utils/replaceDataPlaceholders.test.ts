import { describe, expect, it } from 'vitest'

import { replaceDataPlaceholders, replaceTemplatePlaceholders } from './replaceDataPlaceholders'

describe('replaceTemplatePlaceholders', () => {
  it('replaces a simple placeholder', () => {
    const replace = replaceTemplatePlaceholders({ name: 'Alice' })
    expect(replace('Hello {{ name }}')).toBe('Hello Alice')
  })

  it('handles placeholders without surrounding whitespace', () => {
    const replace = replaceTemplatePlaceholders({ name: 'Alice' })
    expect(replace('Hello {{name}}')).toBe('Hello Alice')
  })

  it('handles placeholders with extra whitespace', () => {
    const replace = replaceTemplatePlaceholders({ name: 'Alice' })
    expect(replace('Hello {{  name  }}')).toBe('Hello Alice')
  })

  it('replaces multiple placeholders in one string', () => {
    const replace = replaceTemplatePlaceholders({ first: 'Alice', last: 'Smith' })
    expect(replace('{{ first }} {{ last }}')).toBe('Alice Smith')
  })

  it('returns empty string for undefined values', () => {
    const replace = replaceTemplatePlaceholders({})
    expect(replace('Hello {{ name }}')).toBe('Hello ')
  })

  it('returns empty string for null values', () => {
    const replace = replaceTemplatePlaceholders({ name: null as unknown as string })
    expect(replace('Hello {{ name }}')).toBe('Hello ')
  })

  it('joins primitive array values with comma and space', () => {
    const replace = replaceTemplatePlaceholders({ tags: ['a', 'b', 'c'] })
    expect(replace('Tags: {{ tags }}')).toBe('Tags: a, b, c')
  })

  it('coerces boolean values to string', () => {
    const replace = replaceTemplatePlaceholders({ active: true })
    expect(replace('{{ active }}')).toBe('true')
  })

  it('coerces number values to string', () => {
    const replace = replaceTemplatePlaceholders({ count: 42 })
    expect(replace('{{ count }}')).toBe('42')
  })

  it('leaves non-placeholder text untouched', () => {
    const replace = replaceTemplatePlaceholders({ name: 'Alice' })
    expect(replace('No placeholders here')).toBe('No placeholders here')
  })

  it('formats a group field (object) as comma-separated values', () => {
    const replace = replaceTemplatePlaceholders({ address: { street: '123 Main St', city: 'London' } })
    expect(replace('Address: {{ address }}')).toBe('Address: 123 Main St, London')
  })

  it('formats an array field (object array) as newline-separated rows', () => {
    const replace = replaceTemplatePlaceholders({
      contacts: [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ],
    })
    expect(replace('{{ contacts }}')).toBe('Alice, alice@example.com\nBob, bob@example.com')
  })
})

describe('replaceDataPlaceholders', () => {
  describe('string replacement', () => {
    it('replaces a simple placeholder in a string', () => {
      const replace = replaceDataPlaceholders({ name: 'Alice' })
      expect(replace('Hello {{ name }}')).toBe('Hello Alice')
    })

    it('returns empty string for missing field', () => {
      const replace = replaceDataPlaceholders({})
      expect(replace('{{ missing }}')).toBe('')
    })

    it('returns empty string for null field', () => {
      const replace = replaceDataPlaceholders({ field: null })
      expect(replace('{{ field }}')).toBe('')
    })

    it('joins primitive array values with comma and space', () => {
      const replace = replaceDataPlaceholders({ colors: ['red', 'blue'] })
      expect(replace('Colors: {{ colors }}')).toBe('Colors: red, blue')
    })

    it('formats a group field as comma-separated values', () => {
      const replace = replaceDataPlaceholders({ address: { street: '123 Main St', city: 'London' } })
      expect(replace('Address: {{ address }}')).toBe('Address: 123 Main St, London')
    })

    it('formats an array field as newline-separated rows', () => {
      const replace = replaceDataPlaceholders({
        contacts: [
          { name: 'Alice', email: 'alice@example.com' },
          { name: 'Bob', email: 'bob@example.com' },
        ],
      })
      expect(replace('{{ contacts }}')).toBe('Alice, alice@example.com\nBob, bob@example.com')
    })

    it('handles an empty array field', () => {
      const replace = replaceDataPlaceholders({ items: [] })
      expect(replace('{{ items }}')).toBe('')
    })

    it('handles a nested group field (object inside array row)', () => {
      const replace = replaceDataPlaceholders({
        team: [{ name: 'Alice', role: 'dev' }],
      })
      expect(replace('Team: {{ team }}')).toBe('Team: Alice, dev')
    })
  })

  describe('nested object traversal', () => {
    it('replaces placeholders inside nested objects', () => {
      const replace = replaceDataPlaceholders({ city: 'London' })
      const input = { address: { city: '{{ city }}' } }
      expect(replace(input)).toEqual({ address: { city: 'London' } })
    })

    it('replaces placeholders inside arrays of strings', () => {
      const replace = replaceDataPlaceholders({ name: 'Bob' })
      const input = [{ label: '{{ name }}' }]
      expect(replace(input)).toEqual([{ label: 'Bob' }])
    })

    it('leaves non-string, non-object values untouched', () => {
      const replace = replaceDataPlaceholders({})
      expect(replace(42)).toBe(42)
      expect(replace(true)).toBe(true)
      expect(replace(null)).toBe(null)
    })
  })
})
