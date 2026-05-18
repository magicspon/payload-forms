import { createFormEndpoint } from '../../../../form/api'

const handler = createFormEndpoint(process.env.PAYLOAD_URL ?? 'http://localhost:3000')

export const POST = handler
