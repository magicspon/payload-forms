import { expect, test } from '@playwright/test'
import path from 'node:path'
import { loginAsAdmin } from './helpers/auth'

export const ADMIN_AUTH_FILE = path.resolve(
	import.meta.dirname,
	'../.auth/admin.json',
)

test.describe('Admin user — dashboard access', () => {
	test('site admin can log in and view the dashboard', async ({ page }) => {
		await loginAsAdmin(page)

		// After login, Payload redirects to /admin
		await expect(page).toHaveURL(/\/admin($|\/)(?!login)/, { timeout: 10_000 })

		// The Payload dashboard renders a heading or nav that confirms we're in
		await page.waitForURL((url) => !url.pathname.includes('/login'), {
			waitUntil: 'networkidle',
		})

		// Persist the authenticated session for all downstream browser projects
		await page.context().storageState({ path: ADMIN_AUTH_FILE })
	})
})
