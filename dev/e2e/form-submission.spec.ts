import { expect, test } from '@playwright/test'

test.describe('Contact form', () => {
  test('renders all visible fields', async ({ page }) => {
    await page.goto('/contact-us')

    await expect(page.getByLabel('Full Name')).toBeVisible()
    await expect(page.getByLabel('Email Address')).toBeVisible()
    await expect(page.getByLabel('Phone Number')).toBeVisible()
    await expect(page.getByLabel('Message')).toBeVisible()
    await expect(page.getByLabel('I agree to be contacted about my enquiry')).toBeVisible()
    await expect(page.getByRole('button', { name: /submit/i })).toBeVisible()
  })

  test('creates a submission with valid data', async ({ page }) => {
    await page.goto('/contact-us')

    await page.getByLabel('Full Name').fill('Jane Smith')
    await page.getByLabel('Email Address').fill('jane@example.com')
    await page.getByLabel('Message').fill('This is an automated test submission.')
    await page.getByLabel('I agree to be contacted about my enquiry').click()

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/submit') && r.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /submit/i }).click()
    const response = await responsePromise

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body).toHaveProperty('doc')
    expect(body.doc).toHaveProperty('id')
  })

  test('shows validation errors when required fields are empty on submit', async ({ page }) => {
    await page.goto('/contact-us')

    // Blur through required fields without filling them
    await page.getByLabel('Full Name').focus()
    await page.getByLabel('Full Name').blur()
    await page.getByLabel('Email Address').focus()
    await page.getByLabel('Email Address').blur()

    // At least one [role="alert"] should appear
    await expect(page.locator('[role="alert"]').first()).toBeVisible()
  })

  test('submission appears in admin submissions list', async ({ page }) => {
    await page.goto('/admin/collections/submissions')
    await expect(page.getByRole('link', { name: /create new/i }).first()).toBeVisible()
    // At least one submission row should exist (created by the submission test above)
    const rows = page.getByRole('row')
    await expect(rows.nth(1)).toBeVisible()
  })
})
