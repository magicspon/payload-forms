import { createFormEndpoint } from '../../../../form/api'

const handler = createFormEndpoint(process.env.PAYLOAD_URL)

export const POST = handler
