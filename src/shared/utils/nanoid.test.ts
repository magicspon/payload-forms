import { describe, expect, it } from 'vitest'

import { nanoid } from './nanoid'

describe('nanoid', () => {
	it('returns a valid UUID v4', () => {
		const id = nanoid()
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		)
	})

	it('returns a unique value on each call', () => {
		const ids = Array.from({ length: 100 }, () => nanoid())
		expect(new Set(ids).size).toBe(100)
	})

	it('returns a string', () => {
		expect(typeof nanoid()).toBe('string')
	})
})
