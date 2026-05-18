import { type Page } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'dev@payloadcms.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'test'

/**
 * Log in to the Payload admin panel via the REST API.
 *
 * Payload's `/api/users/login` endpoint sets a `payload-token` cookie on
 * the response. Because we use `page.request`, the cookie lands on the
 * page context, so the subsequent navigation to /admin arrives authenticated
 * without going through the browser login UI.
 */
export async function loginAsAdmin(page: Page) {
	const response = await page.request.post('/api/users/login', {
		data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
	})

	if (!response.ok()) {
		throw new Error(
			`Admin sign-in failed: ${response.status()} — ${await response.text()}`,
		)
	}

	await page.goto('/admin')
	await page.waitForURL((url) => !url.pathname.includes('/login'), {
		waitUntil: 'networkidle',
		timeout: 15_000,
	})
}

export async function logoutAdmin(page: Page) {
	await page.request.post('/api/users/logout').catch(() => {})
}
