export interface ImportResult {
  count?: number
  error?: string
  success: boolean
}

export const BATCH_SIZE = 50

/** Split rows into fixed-size batches (the last batch may be smaller). */
export function chunkRows<T>(rows: T[], size: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < rows.length; i += size) {
    batches.push(rows.slice(i, i + size))
  }
  return batches
}

/**
 * POST each batch to the import endpoint in sequence, reporting progress after
 * every batch. Resolves with the total number of created submissions, or
 * rejects with an Error carrying the server message on the first failed batch.
 */
export async function importBatches(args: {
  batches: Record<string, string>[][]
  formId: string
  onProgress: (done: number, total: number) => void
}): Promise<number> {
  const { batches, formId, onProgress } = args
  let totalCreated = 0

  for (let i = 0; i < batches.length; i++) {
    const res = await fetch(`/api/submissions/import-csv`, {
      body: JSON.stringify({ formId, rows: batches[i] }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    const json = (await res.json()) as ImportResult
    onProgress(i + 1, batches.length)

    if (!json.success) {
      throw new Error(json.error ?? 'Import failed')
    }
    totalCreated += json.count ?? 0
  }

  return totalCreated
}
