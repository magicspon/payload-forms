import { expect, test } from '@playwright/test'

test.describe('Admin smoke tests', () => {
  test('dashboard loads and shows navigation', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin($|\/)(?!login)/)
    await expect(page).toHaveTitle(/Dashboard/)
  })

  test('forms collection is registered and accessible', async ({ page }) => {
    await page.goto('/admin/collections/forms')
    await expect(page).toHaveURL(/\/collections\/forms/)
    // The create button confirms the collection is registered
    await expect(page.getByRole('link', { name: /create new/i }).first()).toBeVisible()
  })

  test('submissions collection is registered and accessible', async ({ page }) => {
    await page.goto('/admin/collections/submissions')
    await expect(page).toHaveURL(/\/collections\/submissions/)
    await expect(page.getByRole('link', { name: /create new/i }).first()).toBeVisible()
  })
})
