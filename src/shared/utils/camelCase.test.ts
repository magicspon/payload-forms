import { describe, expect, it } from 'vitest'

import { camelCase } from './camelCase'

describe('camelCase', () => {
	it('converts underscore-separated words', () => {
		expect(camelCase('first_name')).toBe('firstName')
	})

	it('converts space-separated words', () => {
		expect(camelCase('First Name')).toBe('firstName')
	})

	it('converts hyphen-separated words', () => {
		expect(camelCase('hello-world')).toBe('helloWorld')
	})

	it('lowercases the first word', () => {
		expect(camelCase('Hello World')).toBe('helloWorld')
	})

	it('handles already-camelCase input', () => {
		expect(camelCase('firstName')).toBe('firstName')
	})

	it('handles a single word', () => {
		expect(camelCase('name')).toBe('name')
	})

	it('handles empty string', () => {
		expect(camelCase('')).toBe('')
	})

	it('handles multiple separators', () => {
		expect(camelCase('foo_bar-baz qux')).toBe('fooBarBazQux')
	})

	it('handles all-uppercase words', () => {
		expect(camelCase('MY_FIELD_NAME')).toBe('myFieldName')
	})
})
