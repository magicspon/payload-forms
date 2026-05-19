import path from 'path'
import { fileURLToPath } from 'url'
import { test as setup } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ADMIN_AUTH_FILE = path.resolve(__dirname, '../.auth/admin.json')

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/admin/login')
  await page.locator('input[name="email"]').fill('dev@payloadcms.com')
  await page.locator('input[name="password"]').fill('test')
  await page.getByRole('button', { name: /login/i }).click()
  await page.waitForURL(/\/admin($|\/)(?!login)/)
  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})
