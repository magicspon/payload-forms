import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

let payload: Payload

afterAll(async () => {
  await payload.destroy()
})

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('Plugin integration tests', () => {
  test('plugin registers the forms collection', async () => {
    expect(payload.collections['forms']).toBeDefined()
    const result = await payload.find({ collection: 'forms' })
    expect(result).toHaveProperty('docs')
  })

  test('plugin registers the submissions collection', async () => {
    expect(payload.collections['submissions']).toBeDefined()
    const result = await payload.find({ collection: 'submissions' })
    expect(result).toHaveProperty('docs')
  })

  test('plugin registers the form-uploads collection', async () => {
    expect(payload.collections['form-uploads']).toBeDefined()
    const result = await payload.find({ collection: 'form-uploads' })
    expect(result).toHaveProperty('docs')
  })

  test('can create a form', async () => {
    const form = await payload.create({
      collection: 'forms',
      data: {
        title: 'Test Form',
        slug: 'test-form-int',
        pages: [{ title: 'Page 1', rows: [] }],
      },
    })
    expect(form.title).toBe('Test Form')
    expect(form.slug).toBe('test-form-int')
  })
})
