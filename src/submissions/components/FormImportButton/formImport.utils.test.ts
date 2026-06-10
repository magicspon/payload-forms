import { afterEach, describe, expect, it, vi } from 'vitest'

import { chunkRows, importBatches } from './formImport.utils'

describe('chunkRows', () => {
  it('splits rows into fixed-size batches with a smaller final batch', () => {
    expect(chunkRows([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns a single batch when rows fit within the size', () => {
    expect(chunkRows([1, 2], 50)).toEqual([[1, 2]])
  })

  it('returns an empty array for no rows', () => {
    expect(chunkRows([], 50)).toEqual([])
  })
})

describe('importBatches', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubFetch(responses: { count?: number; error?: string; success: boolean }[]) {
    const fetchMock = vi.fn()
    for (const r of responses) {
      fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve(r) })
    }
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('posts each batch and sums the created counts', async () => {
    const fetchMock = stubFetch([
      { count: 2, success: true },
      { count: 3, success: true },
    ])
    const onProgress = vi.fn()
    const total = await importBatches({
      batches: [[{ a: '1' }], [{ a: '2' }]],
      formId: 'form-1',
      onProgress,
    })
    expect(total).toBe(5)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2)
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2)
  })

  it('sends the formId and rows in the request body', async () => {
    const fetchMock = stubFetch([{ count: 1, success: true }])
    await importBatches({
      batches: [[{ name: 'Alice' }]],
      formId: 'form-9',
      onProgress: vi.fn(),
    })
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ formId: 'form-9', rows: [{ name: 'Alice' }] })
  })

  it('throws the server error message and stops on the first failed batch', async () => {
    const fetchMock = stubFetch([
      { count: 1, success: true },
      { error: 'Row 3 invalid', success: false },
      { count: 1, success: true },
    ])
    await expect(
      importBatches({
        batches: [[{ a: '1' }], [{ a: '2' }], [{ a: '3' }]],
        formId: 'form-1',
        onProgress: vi.fn(),
      }),
    ).rejects.toThrow('Row 3 invalid')
    // Third batch must never be requested after the second fails.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('falls back to a default message when the failure has no error text', async () => {
    stubFetch([{ success: false }])
    await expect(
      importBatches({ batches: [[{ a: '1' }]], formId: 'f', onProgress: vi.fn() }),
    ).rejects.toThrow('Import failed')
  })
})
