import type { FieldConditions } from '@/shared/fieldSchema'

import { describe, expect, it } from 'vitest'

import { shouldSendNotification } from './notifications'

// ─────────────────────────────────────────────────────────────────────────────
// shouldSendNotification
// ─────────────────────────────────────────────────────────────────────────────

describe('shouldSendNotification', () => {
  const data = { score: '10', status: 'active', tags: ['a', 'b'] }

  it('returns true when conditions is null', () => {
    expect(shouldSendNotification(null, data)).toBe(true)
  })

  it('returns true when conditions is undefined', () => {
    expect(shouldSendNotification(undefined, data)).toBe(true)
  })

  it('returns true when conditions array is empty', () => {
    const conds: FieldConditions = { conditions: [], logic: 'and' }
    expect(shouldSendNotification(conds, data)).toBe(true)
  })

  describe('equals operator', () => {
    it('returns true when field equals value (string)', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'equals', value: 'active' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('returns false when field does not equal value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'equals', value: 'inactive' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(false)
    })

    it('matches array field contains value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'tags', operator: 'equals', value: 'a' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })
  })

  describe('notEquals operator', () => {
    it('returns true when field does not equal value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'notEquals', value: 'inactive' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('returns false when field equals value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'notEquals', value: 'active' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(false)
    })
  })

  describe('contains operator', () => {
    it('returns true for case-insensitive substring match', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'contains', value: 'ACTI' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('returns false when string does not contain value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'contains', value: 'xyz' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(false)
    })

    it('matches array field where any item contains value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'tags', operator: 'contains', value: 'a' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { tags: ['alpha', 'beta'] })).toBe(true)
    })
  })

  describe('numeric operators', () => {
    // condition.value must be a number (not string) to reach the numeric
    // comparison branch — the string branch only handles equals/notEquals/contains

    it('greaterThan returns true when numeric field > value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'score', operator: 'greaterThan', value: 5 }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('lessThan returns true when numeric field < value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'score', operator: 'lessThan', value: 20 }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('greaterThanOrEquals matches exact value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'score', operator: 'greaterThanOrEquals', value: 10 }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('lessThanOrEquals returns false when field > value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'score', operator: 'lessThanOrEquals', value: 5 }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(false)
    })
  })

  describe('isEmpty / isNotEmpty operators', () => {
    it('isEmpty returns true for undefined field', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'missing', operator: 'isEmpty' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('isEmpty returns true for null field', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'x', operator: 'isEmpty' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { x: null })).toBe(true)
    })

    it('isEmpty returns true for empty string', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'x', operator: 'isEmpty' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { x: '' })).toBe(true)
    })

    it('isEmpty returns true for empty array', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'x', operator: 'isEmpty' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { x: [] })).toBe(true)
    })

    it('isEmpty returns false for non-empty value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'isEmpty' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(false)
    })

    it('isNotEmpty returns true for non-empty value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'isNotEmpty' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('isNotEmpty returns false for empty string', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'x', operator: 'isNotEmpty' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { x: '' })).toBe(false)
    })
  })

  describe('logic: and', () => {
    it('returns true only when all conditions pass', () => {
      const conds: FieldConditions = {
        conditions: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'score', operator: 'greaterThan', value: 5 },
        ],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('returns false when any condition fails', () => {
      const conds: FieldConditions = {
        conditions: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'score', operator: 'greaterThan', value: 100 },
        ],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, data)).toBe(false)
    })
  })

  describe('hasChanged operator', () => {
    it('returns true when field value changed', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { status: 'active' }, { status: 'draft' })).toBe(true)
    })

    it('returns false when field value is the same', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { status: 'active' }, { status: 'active' })).toBe(false)
    })

    it('returns true when field was absent and now has a value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { status: 'active' }, {})).toBe(true)
    })

    it('returns true when field had a value and is now absent', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, {}, { status: 'active' })).toBe(true)
    })

    it('returns false when both previous and current are absent', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, {}, {})).toBe(false)
    })

    it('returns true when previousData is omitted and field has a value (prev defaults to empty)', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { status: 'active' })).toBe(true)
    })
  })

  describe('hasNotChanged operator', () => {
    it('returns true when field value is unchanged', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasNotChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { status: 'active' }, { status: 'active' })).toBe(true)
    })

    it('returns false when field value changed', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasNotChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { status: 'active' }, { status: 'draft' })).toBe(false)
    })

    it('returns false when field was absent and now has a value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasNotChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { status: 'active' }, {})).toBe(false)
    })

    it('returns true when both previous and current are absent', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'status', operator: 'hasNotChanged' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, {}, {})).toBe(true)
    })
  })

  describe('logic: or', () => {
    it('returns true when at least one condition passes', () => {
      const conds: FieldConditions = {
        conditions: [
          { field: 'status', operator: 'equals', value: 'inactive' },
          { field: 'score', operator: 'greaterThan', value: 5 },
        ],
        logic: 'or',
      }
      expect(shouldSendNotification(conds, data)).toBe(true)
    })

    it('returns false when all conditions fail', () => {
      const conds: FieldConditions = {
        conditions: [
          { field: 'status', operator: 'equals', value: 'inactive' },
          { field: 'score', operator: 'greaterThan', value: 100 },
        ],
        logic: 'or',
      }
      expect(shouldSendNotification(conds, data)).toBe(false)
    })
  })

  describe('array field comparisons', () => {
    it('notEquals returns true when array does not include value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'tags', operator: 'notEquals', value: 'z' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { tags: ['a', 'b'] })).toBe(true)
    })

    it('notEquals returns false when array includes value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'tags', operator: 'notEquals', value: 'a' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { tags: ['a', 'b'] })).toBe(false)
    })

    it('unsupported operator on an array field returns false', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'tags', operator: 'greaterThan', value: 'a' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { tags: ['a', 'b'] })).toBe(false)
    })
  })

  describe('mixed-type fallback comparison', () => {
    // When sides are neither both-string nor both-numeric (e.g. boolean vs string,
    // or non-numeric string vs number), comparison falls back to String(a) === String(b).
    it('equals matches a boolean field against its string representation', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'agreed', operator: 'equals', value: 'true' }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { agreed: true })).toBe(true)
    })

    it('notEquals returns true when a non-numeric string differs from a numeric value', () => {
      const conds: FieldConditions = {
        conditions: [{ field: 'code', operator: 'notEquals', value: 5 }],
        logic: 'and',
      }
      expect(shouldSendNotification(conds, { code: 'abc' })).toBe(true)
    })
  })
})
