export async function attemptAsync<T>(
  fn: () => Promise<T>,
): Promise<[Error, undefined] | [null, T]> {
  try {
    return [null, await fn()]
  } catch (err) {
    return [err instanceof Error ? err : new Error(String(err)), undefined]
  }
}
