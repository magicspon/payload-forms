export function createFormEndpoint(endpoint?: string) {
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

      // Derive base URL from the incoming request origin so this works on any port
      const base = endpoint ?? new URL(request.url).origin
      const response = await fetch(`${base}/api/submissions/${formData.get('id')}`, {
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
    if (
      Array.isArray(fieldValue) &&
      fieldValue.length > 0 &&
      typeof (fieldValue[0] as { kind?: string })?.kind === 'string'
    ) {
      // File field: send kind:'local' files as FormData entries.
      // kind:'remote' entries are already uploaded — nothing to send.
      // File fields are omitted from submissionData; the server builds fileUploads.
      for (const entry of fieldValue as Array<{ kind: string; file?: File }>) {
        if (entry.kind === 'local' && entry.file) {
          formData.append(fieldName, entry.file)
        }
      }
    } else {
      submissionData[fieldName] = fieldValue
    }
  }

  formData.append('submissionData', JSON.stringify(submissionData))

  return formData
}
