import { describe, expect, it, vi } from 'vitest'

import { makeSubmissionImportEndpoint } from './submissionImport'

const defaultSlugs = { forms: 'forms', formUploads: 'form-uploads', submissions: 'submissions' }

const validBody = {
  formId: 'form-1',
  rows: [
    { name: 'Alice', score: '10' },
    { name: 'Bob', score: '20' },
  ],
  teamId: 'team-1',
}

const mockForm = { id: 'form-1', pages: [], title: 'Test Form' }

function makeReq(body: unknown = validBody, form: unknown = mockForm) {
  return {
    json: vi.fn().mockResolvedValue(body),
    payload: {
      create: vi.fn().mockResolvedValue({ id: 'sub-new' }),
      findByID: vi.fn().mockResolvedValue(form),
      logger: { error: vi.fn() },
    },
  }
}

describe('makeSubmissionImportEndpoint', () => {
  describe('auth and validation', () => {
    it('returns 403 when isAuthorised returns false', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => false, undefined, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body).toEqual({ error: 'Forbidden', success: false })
    })

    it('returns 400 when request body is not parseable JSON', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq()
      req.json.mockRejectedValueOnce(new Error('bad json'))
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(400)
    })

    it('returns 422 when body fails schema validation', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq({ formId: '', rows: [] }) // empty formId and rows
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(422)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.issues).toBeDefined()
    })

    it('returns 404 when form is not found', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq(validBody, null)
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(404)
    })
  })

  describe('batch creation', () => {
    it('passes context: { isBatchImport: true } to every payload.create call', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq()
      await endpoint.handler(req as never)
      for (const call of req.payload.create.mock.calls) {
        expect(call[0]).toMatchObject({ context: { isBatchImport: true } })
      }
    })

    it('calls payload.create once per row', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq()
      await endpoint.handler(req as never)
      expect(req.payload.create).toHaveBeenCalledTimes(validBody.rows.length)
    })

    it('returns { success: true, count } after all rows are created', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({ count: validBody.rows.length, success: true })
    })

    it('stops on first create failure and returns 500 with partial count', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq()
      req.payload.create
        .mockResolvedValueOnce({ id: 'sub-1' }) // first row succeeds
        .mockRejectedValueOnce(new Error('DB error')) // second row fails
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body).toEqual({ created: 1, error: 'Creation failed', success: false })
    })

    it('logs an error when a create call fails', async () => {
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq()
      req.payload.create.mockRejectedValueOnce(new Error('DB error'))
      await endpoint.handler(req as never)
      expect(req.payload.logger.error).toHaveBeenCalledOnce()
    })
  })

  describe('onBatchComplete callback', () => {
    it('calls onBatchComplete once after all rows succeed', async () => {
      const onBatchComplete = vi.fn().mockResolvedValue(undefined)
      const endpoint = makeSubmissionImportEndpoint(() => true, onBatchComplete, defaultSlugs)
      const req = makeReq()
      await endpoint.handler(req as never)
      expect(onBatchComplete).toHaveBeenCalledOnce()
    })

    it('passes correct args to onBatchComplete', async () => {
      const onBatchComplete = vi.fn().mockResolvedValue(undefined)
      const endpoint = makeSubmissionImportEndpoint(() => true, onBatchComplete, defaultSlugs)
      const req = makeReq()
      await endpoint.handler(req as never)
      expect(onBatchComplete).toHaveBeenCalledWith({
        count: validBody.rows.length,
        formId: validBody.formId,
        payload: req.payload,
        teamId: validBody.teamId,
      })
    })

    it('does not call onBatchComplete when a create fails mid-batch', async () => {
      const onBatchComplete = vi.fn().mockResolvedValue(undefined)
      const endpoint = makeSubmissionImportEndpoint(() => true, onBatchComplete, defaultSlugs)
      const req = makeReq()
      req.payload.create.mockRejectedValueOnce(new Error('DB error'))
      await endpoint.handler(req as never)
      expect(onBatchComplete).not.toHaveBeenCalled()
    })

    it('logs error when onBatchComplete throws but still returns success response', async () => {
      const onBatchComplete = vi.fn().mockRejectedValue(new Error('notify fail'))
      const endpoint = makeSubmissionImportEndpoint(() => true, onBatchComplete, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      // Response is still success — notification failure must not fail the import
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(req.payload.logger.error).toHaveBeenCalledOnce()
    })

    it('does not call onBatchComplete when it is not provided', async () => {
      // Smoke test — should not throw when callback is omitted
      const endpoint = makeSubmissionImportEndpoint(() => true, undefined, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(200)
    })
  })
})
