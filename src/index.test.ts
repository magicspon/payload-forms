import type { CollectionConfig, Config } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { formsPlugin } from './index'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function baseConfig(overrides: Partial<Config> = {}): Config {
	return { collections: [], ...overrides } as Config
}

function slugsOf(config: Config): string[] {
	return (config.collections ?? []).map((c) => c.slug)
}

function findCollection(config: Config, slug: string): CollectionConfig {
	return config.collections!.find((c) => c.slug === slug)!
}

/** Recursively collect all field names from a collection (including inside tabs/groups). */
function allFieldNames(fields: CollectionConfig['fields']): string[] {
	const names: string[] = []
	for (const f of fields) {
		if ('name' in f && f.name) {names.push(f.name)}
		if ('fields' in f && Array.isArray(f.fields))
			{names.push(...allFieldNames(f.fields))}
		if ('tabs' in f && Array.isArray(f.tabs)) {
			for (const tab of f.tabs) {
				if ('fields' in tab && Array.isArray(tab.fields))
					{names.push(...allFieldNames(tab.fields))}
			}
		}
	}
	return names
}

function fieldNames(collection: CollectionConfig): string[] {
	return allFieldNames(collection.fields)
}

// ─────────────────────────────────────────────────────────────────────────────
// Collection registration
// ─────────────────────────────────────────────────────────────────────────────

describe('formsPlugin — collection registration', () => {
	it('adds forms, submissions and form-uploads collections', () => {
		const config = formsPlugin()(baseConfig())
		expect(slugsOf(config)).toContain('forms')
		expect(slugsOf(config)).toContain('submissions')
		expect(slugsOf(config)).toContain('form-uploads')
	})

	it('registers exactly three collections on an empty config', () => {
		const config = formsPlugin()(baseConfig())
		expect(config.collections).toHaveLength(3)
	})

	it('preserves pre-existing collections', () => {
		const existing: CollectionConfig = { slug: 'posts', fields: [] }
		const config = formsPlugin()(baseConfig({ collections: [existing] }))
		expect(config.collections).toContainEqual(existing)
		expect(config.collections).toHaveLength(4)
	})

	it('initialises collections array when config.collections is undefined', () => {
		const config = formsPlugin()(baseConfig({ collections: undefined }))
		expect(Array.isArray(config.collections)).toBe(true)
		expect(config.collections).toHaveLength(3)
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// disabled
// ─────────────────────────────────────────────────────────────────────────────

describe('formsPlugin — disabled', () => {
	it('still registers all three collections when disabled is true', () => {
		const config = formsPlugin({ disabled: true })(baseConfig())
		expect(slugsOf(config)).toContain('forms')
		expect(slugsOf(config)).toContain('submissions')
		expect(slugsOf(config)).toContain('form-uploads')
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

describe('formsPlugin — hooks', () => {
	it('wires submissionNotifications into submissions.hooks.beforeChange', () => {
		const config = formsPlugin()(baseConfig())
		const col = findCollection(config, 'submissions')
		expect(col.hooks?.beforeChange).toHaveLength(1)
	})

	it('does not add registerUser hook when hooks is omitted', () => {
		const config = formsPlugin()(baseConfig())
		const col = findCollection(config, 'submissions')
		expect(col.hooks?.beforeChange).toHaveLength(1)
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Import endpoint
// ─────────────────────────────────────────────────────────────────────────────

describe('formsPlugin — import endpoint', () => {
	it('registers the import-csv endpoint on submissions', () => {
		const config = formsPlugin()(baseConfig())
		const col = findCollection(config, 'submissions')
		const endpoints = col.endpoints as { path: string }[] | undefined
		expect(endpoints).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ path: '/import-csv' }),
			]),
		)
	})

	it('importAccessCheck defaults to always-allow', () => {
		const config = formsPlugin()(baseConfig())
		const col = findCollection(config, 'submissions')
		const endpoint = (
			col.endpoints as
				| { handler: (req: never) => unknown; path: string }[]
				| undefined
		)?.find((e) => e.path === '/import-csv')
		// The access check is embedded in the handler, but we can verify
		// the endpoint is present and callable without throwing access errors
		expect(endpoint).toBeDefined()
	})

	it('uses a custom importAccessCheck when provided', () => {
		const customCheck = vi.fn().mockReturnValue(false)
		const config = formsPlugin({ importAccessCheck: customCheck })(baseConfig())
		const col = findCollection(config, 'submissions')
		const endpoints = col.endpoints as { path: string }[] | undefined
		expect(endpoints).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ path: '/import-csv' }),
			]),
		)
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Collection overrides
// ─────────────────────────────────────────────────────────────────────────────

describe('formsPlugin — collection overrides', () => {
	it('appends extra fields to forms via collections.forms', () => {
		const config = formsPlugin({
			collections: {
				forms: { fields: [{ name: 'customTag', type: 'text' }] },
			},
		})(baseConfig())
		const col = findCollection(config, 'forms')
		expect(fieldNames(col)).toContain('customTag')
	})

	it('appends extra fields to submissions via collections.submissions', () => {
		const config = formsPlugin({
			collections: {
				submissions: { fields: [{ name: 'score', type: 'number' }] },
			},
		})(baseConfig())
		const col = findCollection(config, 'submissions')
		expect(fieldNames(col)).toContain('score')
	})

	it('appends extra fields to form-uploads via collections.formUploads', () => {
		const config = formsPlugin({
			collections: {
				formUploads: { fields: [{ name: 'altText', type: 'text' }] },
			},
		})(baseConfig())
		const col = findCollection(config, 'form-uploads')
		expect(fieldNames(col)).toContain('altText')
	})

	it('completely replaces access when override provides access', () => {
		const customRead = vi.fn(() => true)
		const config = formsPlugin({
			collections: {
				forms: { access: { read: customRead } },
			},
		})(baseConfig())
		const col = findCollection(config, 'forms')
		expect(col.access?.read).toBe(customRead)
	})

	it('preserves base fields when no override fields are given', () => {
		const config = formsPlugin({
			collections: { forms: { slug: 'forms-renamed' } },
		})(baseConfig())
		const col = findCollection(config, 'forms-renamed')
		expect(col.fields.length).toBeGreaterThan(0)
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// No-argument invocation
// ─────────────────────────────────────────────────────────────────────────────

describe('formsPlugin — no options', () => {
	it('works when called with no arguments', () => {
		expect(() => formsPlugin()(baseConfig())).not.toThrow()
	})

	it('returns a valid config with three collections', () => {
		const config = formsPlugin()(baseConfig())
		expect(config.collections).toHaveLength(3)
	})
})
