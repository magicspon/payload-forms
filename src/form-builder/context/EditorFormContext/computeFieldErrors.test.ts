import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { computeFieldErrors } from './computeFieldErrors'

describe('computeFieldErrors', () => {
  const schema = z.object({
    age: z.number().min(18, 'Must be 18 or older'),
    name: z.string().min(1, 'Name is required'),
  })

  it('returns no errors when there is no schema', () => {
    expect(computeFieldErrors(undefined, { anything: true })).toEqual({})
  })

  it('returns no errors when validation passes', () => {
    expect(computeFieldErrors(schema, { age: 21, name: 'Alice' })).toEqual({})
  })

  it('groups issue messages by top-level field key', () => {
    const errs = computeFieldErrors(schema, { age: 10, name: '' })
    expect(errs).toEqual({
      age: ['Must be 18 or older'],
      name: ['Name is required'],
    })
  })

  it('collects multiple messages for the same field', () => {
    const multi = z.object({
      pw: z.string().min(8, 'Too short').regex(/\d/, 'Needs a digit'),
    })
    const errs = computeFieldErrors(multi, { pw: 'abc' })
    expect(errs.pw).toEqual(['Too short', 'Needs a digit'])
  })
})
