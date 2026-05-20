export function createFormEndpoint(endpoint: string) {
  return async (request: Request) => {
    try {
      const formData = await request.formData()

      // Forward request headers for IP/user-agent detection
      const userAgent = request.headers.get('user-agent') ?? ''
      const forwardedFor = request.headers.get('x-forwarded-for')
      const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? ''

      // Add headers to formData for the Payload endpoint
      formData.set('_userAgent', userAgent)
      formData.set('_ipAddress', ipAddress)

      const response = await fetch(`${endpoint}/api/submissions/${formData.get('id')}`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Form submission error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'An error occurred while processing the form',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }
}

export function createFormBody({
  value,
  id,
  _hp,
  _ts,
}: {
  value: Record<string, unknown>
  id: string
  _hp: string
  _ts: string
}) {
  const submissionData: Record<string, unknown> = {}
  const from = ((value?.emailAddress ?? value.email) as string) ?? 'unknown'
  const formData = new FormData()

  formData.append('id', id)
  formData.append('from', from)
  formData.append('_hp', _hp ?? '')
  formData.append('_ts', _ts ?? '')

  // Separate files from regular form values
  for (const [fieldName, fieldValue] of Object.entries(value)) {
    if (Array.isArray(fieldValue) && fieldValue.length > 0 && fieldValue[0] instanceof File) {
      // Store file metadata in submissionData
      const fileMeta = (fieldValue as File[]).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }))
      submissionData[fieldName] = fileMeta

      // Append each file to FormData
      for (const file of fieldValue as File[]) {
        formData.append(fieldName, file)
      }
    } else {
      submissionData[fieldName] = fieldValue
    }
  }

  formData.append('submissionData', JSON.stringify(submissionData))

  return formData
}
