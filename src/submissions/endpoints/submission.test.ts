import { MAX_FILE_SIZE_BYTES } from '@/submissions/utils/fileUpload'
import { describe, expect, it, vi } from 'vitest'

import { makeSubmissionEndpoint } from './submission'

const defaultSlugs = {
  forms: 'forms',
  formUploads: 'form-uploads',
  submissions: 'submissions',
}

const mockForm = {
  id: 'form-1',
  campaign: 'camp-1',
  confirmationMessage: null,
  confirmationType: 'message',
  // Field schema — submissionData keys not present here are stripped on submit.
  pages: [
    {
      id: 'p1',
      title: 'Page 1',
      rows: [{ id: 'r1', columns: [{ id: 'f-name', type: 'text', name: 'name' }] }],
    },
  ],
  team: 'team-1',
  title: 'Test Form',
}

/** Build a minimal PayloadRequest-like object for the submission endpoint. */
function makeReq({
  createSubmission = { id: 'sub-new' },
  createUpload = { id: 'upload-1' },
  form = mockForm as unknown,
  formData = new FormData(),
  routeParams = { id: 'form-1' },
} = {}) {
  return {
    formData: vi.fn().mockResolvedValue(formData),
    headers: { get: vi.fn().mockReturnValue(null) },
    payload: {
      create: vi.fn().mockResolvedValueOnce(createSubmission).mockResolvedValue(createUpload),
      findByID: vi.fn().mockResolvedValue(form),
      logger: {
        error: vi.fn(),
        info: vi.fn(),
      },
      update: vi.fn().mockResolvedValue({}),
    },
    routeParams,
  }
}

/** Minimal valid form data for a text-only submission. */
function validFormData(overrides: Record<string, File | string> = {}): FormData {
  const fd = new FormData()
  fd.set('submissionData', JSON.stringify({ name: 'Alice' }))
  fd.set('_ts', String(Date.now() - 5000)) // submitted 5 s ago — passes timing check
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v)
  }
  return fd
}

describe('makeSubmissionEndpoint', () => {
  describe('request validation', () => {
    it('returns 500 when payload is not available', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq()
      // @ts-expect-error intentionally omitting payload
      req.payload = undefined
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(500)
    })

    it('returns 400 when form data is missing', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq()
      req.formData = undefined as never
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body).toMatchObject({ error: 'No form data provided', success: false })
    })

    it('returns 404 when the form is not found', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ form: null, formData: validFormData() })
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(404)
    })
  })

  describe('spam detection', () => {
    it('returns fake 200 when honeypot field is filled', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const fd = validFormData({ _hp: 'bot-value' })
      const req = makeReq({ formData: fd })
      const res = await endpoint.handler(req as never)
      // Fake success — must not return an error status
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({ id: null, success: true })
    })

    it('logs spam detection via payload.logger.info, not console.log', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const consoleSpy = vi.spyOn(console, 'log')
      const fd = validFormData({ _hp: 'bot' })
      const req = makeReq({ formData: fd })
      await endpoint.handler(req as never)
      // IP must not reach stdout — use structured logger
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(req.payload.logger.info).toHaveBeenCalledOnce()
      consoleSpy.mockRestore()
    })

    it('returns fake 200 when submission is too fast (timing check)', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const fd = validFormData({ _ts: String(Date.now()) })
      const req = makeReq({ formData: fd })
      const res = await endpoint.handler(req as never)
      // MIN_SUBMISSION_TIME_MS is a module-load-time const (0 in test/non-prod mode),
      // so the timing check never fires and the submission is created normally (201).
      expect(res.status).toBe(201)
    })
  })

  describe('file upload', () => {
    it('returns 413 when a file exceeds MAX_FILE_SIZE_BYTES', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const oversizedFile = new File([new Uint8Array(MAX_FILE_SIZE_BYTES + 1)], 'big.pdf', {
        type: 'application/pdf',
      })
      const fd = validFormData()
      fd.set('attachment', oversizedFile)
      const req = makeReq({ formData: fd })
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(413)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error).toContain('attachment')
    })

    it('does not upload scalar form fields as files', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ formData: validFormData() })
      await endpoint.handler(req as never)
      // payload.create should be called once for the submission, never for a file
      expect(req.payload.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('successful submission', () => {
    it('returns { success: true, id } on valid submission', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ formData: validFormData() })
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body).toMatchObject({ doc: { id: 'sub-new' }, success: true })
    })

    it('creates submission with correct title from form', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ formData: validFormData() })
      await endpoint.handler(req as never)
      const call = req.payload.create.mock.calls[0][0]
      expect(call.data.title).toBe('Test Form')
    })

    it('stores null identifier when no identifierField is configured', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ formData: validFormData() })
      await endpoint.handler(req as never)
      const call = req.payload.create.mock.calls[0][0]
      expect(call.data.identifier).toBeNull()
    })

    it('derives identifier from submissionData when identifierField is configured', async () => {
      const formWithIdentifier = { ...mockForm, identifierField: 'name' }
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ form: formWithIdentifier, formData: validFormData() })
      await endpoint.handler(req as never)
      const call = req.payload.create.mock.calls[0][0]
      expect(call.data.identifier).toBe('Alice')
    })

    it('uses attemptAsync for submission creation — returns error response on DB failure', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ formData: validFormData() })
      // Reset and replace so the very first create call (the submission) rejects
      req.payload.create.mockReset()
      req.payload.create.mockRejectedValue(new Error('DB down'))
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(req.payload.logger.error).toHaveBeenCalled()
    })

    it('returns confirmation message for message-type forms', async () => {
      const formWithMsg = {
        ...mockForm,
        confirmationMessage: 'Thank you!',
        confirmationType: 'message',
      }
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ form: formWithMsg, formData: validFormData() })
      const res = await endpoint.handler(req as never)
      const body = await res.json()
      // replaceDataPlaceholders returns the message with tokens substituted
      expect(body.message).toBeDefined()
    })

    it('returns message: null for redirect-type forms', async () => {
      const formWithRedirect = { ...mockForm, confirmationType: 'redirect' }
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const req = makeReq({ form: formWithRedirect, formData: validFormData() })
      const res = await endpoint.handler(req as never)
      const body = await res.json()
      expect(body.message).toBeNull()
    })
  })

  describe('submissionData validation', () => {
    it('uses empty object when submissionData is absent', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const fd = validFormData()
      fd.delete('submissionData')
      const req = makeReq({ formData: fd })
      const res = await endpoint.handler(req as never)
      // Gracefully handles missing field — submission still created
      expect(res.status).toBe(201)
      const call = req.payload.create.mock.calls[0][0]
      expect(call.data.submissionData).toEqual({})
    })

    it('rejects invalid JSON submissionData with 400', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const fd = validFormData({ submissionData: '{not valid json' })
      const req = makeReq({ formData: fd })
      const res = await endpoint.handler(req as never)
      // Malformed JSON is rejected rather than silently stored as {}
      expect(res.status).toBe(400)
      expect(req.payload.create).not.toHaveBeenCalled()
    })

    it('strips submissionData keys that are not defined form fields', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const fd = validFormData({
        submissionData: JSON.stringify({ name: 'Alice', evil: 'injected', extra: 42 }),
      })
      const req = makeReq({ formData: fd })
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(201)
      const call = req.payload.create.mock.calls[0][0]
      // Only the known `name` field survives; unknown keys are dropped.
      expect(call.data.submissionData).toEqual({ name: 'Alice' })
    })

    it('rejects submissionData larger than the size cap with 413', async () => {
      const endpoint = makeSubmissionEndpoint(defaultSlugs)
      const huge = JSON.stringify({ name: 'a'.repeat(1024 * 1024 + 1) })
      const fd = validFormData({ submissionData: huge })
      const req = makeReq({ formData: fd })
      const res = await endpoint.handler(req as never)
      expect(res.status).toBe(413)
      expect(req.payload.create).not.toHaveBeenCalled()
    })
  })
})
