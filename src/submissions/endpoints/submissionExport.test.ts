import { describe, expect, it, vi } from 'vitest'

import { makeSubmissionExportEndpoint } from './submissionExport'

const defaultSlugs = { forms: 'forms', formUploads: 'form-uploads', submissions: 'submissions' }

const mockForm = {
  id: 'form-1',
  pages: [
    {
      id: 'page-1',
      rows: [
        {
          id: 'row-1',
          columns: [
            { id: 'col-1', name: 'full_name', type: 'text', label: 'Full Name' },
            { id: 'col-2', name: 'email', type: 'email', label: 'Email' },
          ],
        },
      ],
      title: 'Page 1',
    },
  ],
  title: 'Test Form',
}

const mockSubmissions = {
  docs: [
    {
      id: 'sub-1',
      createdAt: '2024-01-15T10:00:00.000Z',
      identifier: 'alice@example.com',
      submissionData: { email: 'alice@example.com', fullName: 'Alice' },
    },
    {
      id: 'sub-2',
      createdAt: '2024-01-16T12:00:00.000Z',
      identifier: 'bob@example.com',
      submissionData: { email: 'bob@example.com', fullName: 'Bob' },
    },
  ],
  totalDocs: 2,
}

function makeReq(
  searchParams: Record<string, string> = { formId: 'form-1' },
  form: unknown = mockForm,
  submissions: unknown = mockSubmissions,
) {
  return {
    payload: {
      find: vi.fn().mockResolvedValue(submissions),
      findByID: vi.fn().mockResolvedValue(form),
      logger: { error: vi.fn() },
    },
    url: `http://localhost/api/submissions/export-csv?${new URLSearchParams(searchParams).toString()}`,
  }
}

describe('makeSubmissionExportEndpoint', () => {
  describe('auth and validation', () => {
    it('returns 403 when isAuthorised returns false', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => false, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body).toEqual({ error: 'Forbidden', success: false })
    })

    it('returns 400 when formId is missing', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq({})
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body).toEqual({ error: 'formId is required', success: false })
    })

    it('returns 404 when form is not found', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq({ formId: 'form-1' }, null)
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body).toEqual({ error: 'Form not found', success: false })
    })

    it('returns 500 when payload.find fails', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq()
      req.payload.find.mockRejectedValueOnce(new Error('DB error'))
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(500)
      expect(req.payload.logger.error).toHaveBeenCalledOnce()
    })
  })

  describe('CSV response', () => {
    it('returns text/csv content-type', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/csv')
    })

    it('sets Content-Disposition attachment header with form title and date', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      const disposition = res.headers.get('Content-Disposition') ?? ''
      expect(disposition).toContain('attachment')
      expect(disposition).toContain('test-form')
      expect(disposition).toMatch(/\d{4}-\d{2}-\d{2}\.csv/)
    })

    it('includes CSV header row with field labels', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      const csv = await res.text()
      const firstLine = csv.split('\n')[0]
      expect(firstLine).toBe('Identifier,Submitted,Full Name,Email')
    })

    it('includes one data row per submission', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      const csv = await res.text()
      const lines = csv.split('\n')
      // Header + 2 data rows
      expect(lines).toHaveLength(3)
    })

    it('writes submission data values in correct columns', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq()
      const res = await endpoint.handler(req as never)
      const csv = await res.text()
      const lines = csv.split('\n')
      expect(lines[1]).toContain('alice@example.com')
      expect(lines[1]).toContain('Alice')
    })
  })

  describe('querying', () => {
    it('queries submissions with form filter', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq()
      await endpoint.handler(req as never)
      expect(req.payload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ form: { equals: 'form-1' } }),
        }),
      )
    })

    it('adds id filter when ids param is provided', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq({ formId: 'form-1', ids: 'sub-1,sub-2' })
      await endpoint.handler(req as never)
      expect(req.payload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: ['sub-1', 'sub-2'] } }),
        }),
      )
    })

    it('omits id filter when ids param is empty string', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq({ formId: 'form-1', ids: '' })
      await endpoint.handler(req as never)
      const call = req.payload.find.mock.calls[0]?.[0]
      expect(call.where).not.toHaveProperty('id')
    })

    it('uses pagination: false to fetch all submissions', async () => {
      const endpoint = makeSubmissionExportEndpoint(() => true, defaultSlugs)
      const req = makeReq()
      await endpoint.handler(req as never)
      expect(req.payload.find).toHaveBeenCalledWith(expect.objectContaining({ pagination: false }))
    })
  })
})
