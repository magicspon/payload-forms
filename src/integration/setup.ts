import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig, getPayload, type Payload } from 'payload'

import { formsPlugin } from '../index'

// Module-level singleton — getPayload must only be called once per process.
// singleFork: true in the Vitest config ensures this process is not reused
// across test file boundaries.
let payload: null | Payload = null

export async function getTestPayload(): Promise<Payload> {
  if (payload) {
    return payload
  }

  const config = buildConfig({
    db: sqliteAdapter({
      client: { url: ':memory:' },
    }),
    secret: 'test-secret-32-chars-minimum-abcd',
    // Prevents Payload from resolving admin component string paths at startup
    // (e.g. '@spon/payload-forms/client#FormCanvas')
    admin: { disable: true },
    collections: [
      // Minimal users stub — required because submissions has relationTo: 'users'
      { slug: 'users', auth: true, fields: [] },
    ],
    plugins: [formsPlugin()],
    typescript: { outputFile: '/tmp/payload-types-forms-test.ts' },
  })

  payload = await getPayload({ config })
  return payload
}

export async function teardownTestPayload(): Promise<void> {
  if (payload) {
    await payload.destroy()
    payload = null
  }
}
