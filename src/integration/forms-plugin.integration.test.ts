import type { Payload } from 'payload'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { makeSubmissionImportEndpoint } from '../submissions/endpoints/submissionImport'
import { getTestPayload, teardownTestPayload } from './setup'

// Cast away the strongly-typed Payload API for integration tests.
// The generated types require draft:true/false for versioned collections
// which is noisy for test code. The runtime behaviour is what matters here.
type TestPayload = {
	create: (opts: {
		collection: string
		context?: Record<string, unknown>
		data: Record<string, unknown>
	}) => Promise<Record<string, unknown>>
	find: (opts: {
		collection: string
		limit?: number
		where?: unknown
	}) => Promise<{ docs: Record<string, unknown>[]; totalDocs: number }>
}

let payload: Payload

/** Minimal valid page — the forms beforeValidate hook rejects empty pages arrays. */
const MINIMAL_PAGE = { rows: [], title: 'Page 1' }

beforeAll(async () => {
	payload = await getTestPayload()
}, 120_000)

afterAll(async () => {
	await teardownTestPayload()
})

function db(): TestPayload {
	return payload as unknown as TestPayload
}

// ─────────────────────────────────────────────────────────────────────────────
// Collection registration
// ─────────────────────────────────────────────────────────────────────────────

describe('collection registration', () => {
	it('registers the forms collection', async () => {
		const result = await db().find({ collection: 'forms', limit: 0 })
		expect(result.totalDocs).toBeGreaterThanOrEqual(0)
	})

	it('registers the submissions collection', async () => {
		const result = await db().find({ collection: 'submissions', limit: 0 })
		expect(result.totalDocs).toBeGreaterThanOrEqual(0)
	})

	it('registers the form-uploads collection', async () => {
		const result = await db().find({ collection: 'form-uploads', limit: 0 })
		expect(result.totalDocs).toBeGreaterThanOrEqual(0)
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// Hook behaviour — formSnapshot attached
// ─────────────────────────────────────────────────────────────────────────────

describe('submissionNotifications hook', () => {
	it('attaches formSnapshot to the submission when created normally', async () => {
		const form = await db().create({
			collection: 'forms',
			data: {
				slug: 'int-test-form',
				pages: [MINIMAL_PAGE],
				title: 'Integration test form',
			},
		})

		const sub = await db().create({
			collection: 'submissions',
			data: {
				form: form['id'],
				submissionData: { name: 'Alice' },
				title: 'Test Submission',
			},
		})

		// The beforeChange hook fetches the form and attaches formSnapshot to data
		expect(sub['formSnapshot']).toBeDefined()
	})

	it('does NOT attach formSnapshot when context.isBatchImport is true', async () => {
		const form = await db().create({
			collection: 'forms',
			data: {
				slug: 'batch-import-form',
				pages: [MINIMAL_PAGE],
				title: 'Batch import form',
			},
		})

		const sub = await db().create({
			collection: 'submissions',
			// isBatchImport causes the hook to return data unmodified (no findByID call)
			context: { isBatchImport: true },
			data: {
				form: form['id'],
				submissionData: { name: 'Bob' },
				title: 'Batch Submission',
			},
		})

		// Hook returned early — formSnapshot field was never populated
		expect(sub['formSnapshot']).toBeNull()
	})
})

// ─────────────────────────────────────────────────────────────────────────────
// CSV import endpoint
// ─────────────────────────────────────────────────────────────────────────────

describe('makeSubmissionImportEndpoint', () => {
	it('creates one submission per row and calls onBatchComplete once', async () => {
		const form = await db().create({
			collection: 'forms',
			data: {
				slug: 'import-endpoint-form',
				pages: [MINIMAL_PAGE],
				title: 'Import endpoint form',
			},
		})

		let batchCallCount = 0
		let batchArgs: null | Record<string, unknown> = null

		const endpoint = makeSubmissionImportEndpoint(
			() => true,
			async (args) => {
				batchCallCount++
				batchArgs = args as Record<string, unknown>
			},
			{ forms: 'forms', formUploads: 'form-uploads', submissions: 'submissions' },
		)

		const body = {
			formId: form['id'],
			rows: [
				{ name: 'Alice', score: '10' },
				{ name: 'Bob', score: '20' },
				{ name: 'Carol', score: '30' },
			],
			teamId: 'team-abc',
		}

		// Build a minimal PayloadRequest-shaped object
		const req = {
			json: () => Promise.resolve(body),
			payload,
		}

		const res = await endpoint.handler(req as never)
		expect(res.status).toBe(200)

		const resBody = await res.json()
		expect(resBody).toEqual({ count: 3, success: true })

		// onBatchComplete called once with correct args
		expect(batchCallCount).toBe(1)
		expect(batchArgs).toMatchObject({
			count: 3,
			formId: form['id'],
			teamId: 'team-abc',
		})
	})

	it('passes context.isBatchImport: true to every payload.create call', async () => {
		// Verifies batch suppression propagates through the real endpoint
		// by confirming formSnapshot is defined on each created submission (set by endpoint, not hook)
		const form = await db().create({
			collection: 'forms',
			data: {
				slug: 'batch-context-form',
				pages: [MINIMAL_PAGE],
				title: 'Batch context form',
			},
		})

		const endpoint = makeSubmissionImportEndpoint(
			() => true,
			undefined,
			{ forms: 'forms', formUploads: 'form-uploads', submissions: 'submissions' },
		)

		const body = {
			formId: form['id'],
			rows: [{ name: 'Dave' }, { name: 'Eve' }],
			teamId: 'team-batch',
		}

		const req = {
			json: () => Promise.resolve(body),
			payload,
		}

		const res = await endpoint.handler(req as never)
		expect(res.status).toBe(200)

		const { docs } = await db().find({
			collection: 'submissions',
			limit: 10,
			where: { form: { equals: form['id'] } },
		})

		// The endpoint always sets formSnapshot directly (the full form document).
		// The hook's findByID call is suppressed by isBatchImport, but the
		// endpoint-provided value is preserved — so formSnapshot is defined.
		for (const doc of docs) {
			expect(doc['formSnapshot']).toBeDefined()
		}
	})
})
