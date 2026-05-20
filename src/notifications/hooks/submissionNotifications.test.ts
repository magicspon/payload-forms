import { describe, expect, it, vi } from 'vitest'

import { makeSubmissionNotifications } from './submissionNotifications'

const defaultSlugs = { forms: 'forms', formUploads: 'form-uploads', submissions: 'submissions' }
const submissionNotifications = makeSubmissionNotifications(defaultSlugs)

vi.mock('@payloadcms/richtext-lexical/html', () => ({
  convertLexicalToHTML: vi.fn().mockReturnValue('<p>notification body</p>'),
}))

vi.mock('@payloadcms/richtext-lexical/plaintext', () => ({
  convertLexicalToPlaintext: vi.fn().mockReturnValue('notification body'),
}))

// Minimal notification item on a form
const makeNotification = (overrides: Record<string, unknown> = {}) => ({
  conditions: null,
  email: 'notify@example.com',
  message: { root: { children: [] } },
  subject: 'New submission',
  ...overrides,
})

// Form returned by payload.findByID
const makeForm = (notifications: unknown[] = [makeNotification()]) => ({
  id: 'form-1',
  formSchema: { fields: [] },
  notification: notifications,
})

function makeReq(form = makeForm()) {
  return {
    payload: {
      findByID: vi.fn().mockResolvedValue(form),
      logger: { error: vi.fn(), info: vi.fn() },
      sendEmail: vi.fn().mockResolvedValue(undefined),
    },
  }
}

const baseData = {
  form: 'form-1',
  submissionData: { name: 'Alice' },
}

describe('submissionNotifications', () => {
  it('returns data unchanged on update operation', async () => {
    const req = makeReq()
    const result = await submissionNotifications({
      collection: {} as never,
      context: {},
      data: baseData,
      operation: 'update',
      req: req as never,
    })
    expect(result).toBe(baseData)
    expect(req.payload.findByID).not.toHaveBeenCalled()
    expect(req.payload.sendEmail).not.toHaveBeenCalled()
  })

  it('returns data unchanged and skips all emails when context.isBatchImport is true', async () => {
    const req = makeReq()
    const result = await submissionNotifications({
      collection: {} as never,
      context: { isBatchImport: true },
      data: baseData,
      operation: 'create',
      req: req as never,
    })
    expect(result).toBe(baseData)
    expect(req.payload.findByID).not.toHaveBeenCalled()
    expect(req.payload.sendEmail).not.toHaveBeenCalled()
  })

  it('returns data unchanged when form has no notification config', async () => {
    const req = makeReq(makeForm([]))
    const result = await submissionNotifications({
      collection: {} as never,
      context: {},
      data: baseData,
      operation: 'create',
      req: req as never,
    })
    expect(result).toBe(baseData)
    expect(req.payload.sendEmail).not.toHaveBeenCalled()
  })

  it('sends email to the configured address when conditions pass', async () => {
    const req = makeReq()
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: baseData,
      operation: 'create',
      req: req as never,
    })
    expect(req.payload.sendEmail).toHaveBeenCalledOnce()
    expect(req.payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['notify@example.com'] }),
    )
  })

  it('resolves {{fieldName}} token to the submission data value', async () => {
    const req = makeReq(makeForm([makeNotification({ email: '{{email}}' })]))
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: { ...baseData, submissionData: { email: 'submitter@example.com' } },
      operation: 'create',
      req: req as never,
    })
    expect(req.payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['submitter@example.com'] }),
    )
  })

  it('skips sending when conditions do not match submission data', async () => {
    const req = makeReq(
      makeForm([
        makeNotification({
          conditions: {
            conditions: [{ field: 'status', operator: 'equals', value: 'approved' }],
            logic: 'and',
          },
        }),
      ]),
    )
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: { ...baseData, submissionData: { status: 'pending' } },
      operation: 'create',
      req: req as never,
    })
    expect(req.payload.sendEmail).not.toHaveBeenCalled()
  })

  it('sends when conditions match submission data', async () => {
    const req = makeReq(
      makeForm([
        makeNotification({
          conditions: {
            conditions: [{ field: 'status', operator: 'equals', value: 'approved' }],
            logic: 'and',
          },
        }),
      ]),
    )
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: { ...baseData, submissionData: { status: 'approved' } },
      operation: 'create',
      req: req as never,
    })
    expect(req.payload.sendEmail).toHaveBeenCalledOnce()
  })

  it('skips a notification item when the resolved recipient list is empty', async () => {
    // {{email}} token but submissionData has no email field
    const req = makeReq(makeForm([makeNotification({ email: '{{email}}' })]))
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: { ...baseData, submissionData: { name: 'No Email Here' } },
      operation: 'create',
      req: req as never,
    })
    expect(req.payload.sendEmail).not.toHaveBeenCalled()
  })

  it('attaches formSnapshot from form.formSchema to the returned data', async () => {
    const req = makeReq(makeForm([]))
    const result = (await submissionNotifications({
      collection: {} as never,
      context: {},
      data: baseData,
      operation: 'create',
      req: req as never,
    })) as Record<string, unknown>
    expect(result.formSnapshot).toEqual({ fields: [] })
  })

  it('replaces {{token}} in subject with submission data value', async () => {
    const req = makeReq(makeForm([makeNotification({ subject: 'Hello {{name}}' })]))
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: { ...baseData, submissionData: { name: 'Bob' } },
      operation: 'create',
      req: req as never,
    })
    expect(req.payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Hello Bob' }),
    )
  })

  it('resolves comma-separated mixed static and field token email to both addresses', async () => {
    const req = makeReq(makeForm([makeNotification({ email: 'static@example.com, {{email}}' })]))
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: { ...baseData, submissionData: { email: 'dynamic@example.com' } },
      operation: 'create',
      req: req as never,
    })
    expect(req.payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.arrayContaining(['static@example.com', 'dynamic@example.com']),
      }),
    )
  })

  it('deduplicates recipients when the same address appears via multiple tokens', async () => {
    // Both {{email}} and the static address resolve to the same address
    const req = makeReq(makeForm([makeNotification({ email: 'same@example.com, {{email}}' })]))
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: { ...baseData, submissionData: { email: 'same@example.com' } },
      operation: 'create',
      req: req as never,
    })
    const call = (req.payload.sendEmail as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.to).toHaveLength(1)
    expect(call.to).toEqual(['same@example.com'])
  })

  it('nested object submission data value in token renders as string (documents current behaviour)', async () => {
    // When a submission field is an object, String(value) → '[object Object]'
    // which is not a valid email — so the recipient is dropped and no email is sent
    const req = makeReq(makeForm([makeNotification({ email: '{{nested}}' })]))
    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: { ...baseData, submissionData: { nested: { deep: 'value' } } },
      operation: 'create',
      req: req as never,
    })
    // '[object Object]' fails z.email() so no recipient is added → no email sent
    expect(req.payload.sendEmail).not.toHaveBeenCalled()
  })

  it('logs an error when sendEmail fails and does not propagate the failure', async () => {
    // A failed notification must never roll back the submission — the hook
    // must catch the error, log it, and still return the data unchanged.
    const req = makeReq()
    ;(req.payload.sendEmail as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('SMTP connection refused'),
    )

    const result = await submissionNotifications({
      collection: {} as never,
      context: {},
      data: baseData,
      operation: 'create',
      req: req as never,
    })

    // The hook must return data (not throw) so the submission is saved
    expect(result).toBeDefined()
    // The failure must be logged with payload.logger.error, not console.error
    expect(req.payload.logger.error).toHaveBeenCalledOnce()
    expect(req.payload.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      expect.stringContaining('notification email'),
    )
  })

  it('continues sending subsequent notifications after one fails', async () => {
    // Two notification rules; first send fails — second must still fire
    const req = makeReq(
      makeForm([makeNotification(), makeNotification({ email: 'second@example.com' })]),
    )
    ;(req.payload.sendEmail as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('SMTP timeout'))
      .mockResolvedValueOnce(undefined)

    await submissionNotifications({
      collection: {} as never,
      context: {},
      data: baseData,
      operation: 'create',
      req: req as never,
    })

    // Both sends were attempted — one failed, one succeeded
    expect(req.payload.sendEmail).toHaveBeenCalledTimes(2)
    expect(req.payload.logger.error).toHaveBeenCalledOnce()
  })

  it('logs error and returns data when form fetch fails', async () => {
    // If findByID throws, the hook must not crash — it must log and return data
    const req = makeReq()
    ;(req.payload.findByID as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('DB timeout'),
    )

    const result = await submissionNotifications({
      collection: {} as never,
      context: {},
      data: baseData,
      operation: 'create',
      req: req as never,
    })

    expect(result).toBe(baseData)
    expect(req.payload.logger.error).toHaveBeenCalledOnce()
    expect(req.payload.sendEmail).not.toHaveBeenCalled()
  })
})
