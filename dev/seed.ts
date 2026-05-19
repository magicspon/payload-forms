import type { Payload } from 'payload'

import { devUser } from './helpers/credentials'
import { seedForms } from './seeds/forms'

export const seed = async (payload: Payload) => {
  const { totalDocs } = await payload.count({
    collection: 'users',
    where: {
      email: {
        equals: devUser.email,
      },
    },
  })

  if (!totalDocs) {
    await payload.create({
      collection: 'users',
      data: devUser,
    })
  }

  await seedForms(payload)
}
