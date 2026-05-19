/**
 * Construct a standardised JSON error response.
 *
 * All endpoints use this factory so the shape `{ success: false, error }` stays
 * consistent and tests can assert against a single structure.
 */
export function errorResponse(message: string, status: number): Response {
	return Response.json({ error: message, success: false }, { status })
}
