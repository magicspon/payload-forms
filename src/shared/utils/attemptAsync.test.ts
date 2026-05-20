import { describe, expect, it } from 'vitest'

import { attemptAsync } from './attemptAsync'

describe('attemptAsync', () => {
  it('returns [null, value] on success', async () => {
    const [err, result] = await attemptAsync(() => Promise.resolve(42))
    expect(err).toBeNull()
    expect(result).toBe(42)
  })

  it('returns [Error, undefined] on rejection', async () => {
    const [err, result] = await attemptAsync(() => Promise.reject(new Error('boom')))
    expect(err).toBeInstanceOf(Error)
    expect(err?.message).toBe('boom')
    expect(result).toBeUndefined()
  })

  it('wraps non-Error thrown values in an Error', async () => {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    const [err, result] = await attemptAsync(() => Promise.reject('string error'))
    expect(err).toBeInstanceOf(Error)
    expect(err?.message).toBe('string error')
    expect(result).toBeUndefined()
  })

  it('wraps thrown exceptions from sync-throwing functions', async () => {
    const [err] = await attemptAsync(() => {
      throw new Error('sync throw')
    })
    expect(err?.message).toBe('sync throw')
  })

  it('preserves the resolved value type', async () => {
    const [, result] = await attemptAsync(() => Promise.resolve({ ok: true }))
    expect(result).toEqual({ ok: true })
  })
})
