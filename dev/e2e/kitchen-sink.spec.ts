import { expect, test, type Page } from '@playwright/test'

// Navigate page 1 → page 2 (fills required fields first_name, last_name, email)
async function advanceFromPage1(page: Page) {
  await page.getByLabel('First Name').fill('Jane')
  await page.getByLabel('Last Name').fill('Smith')
  await page.getByLabel('Email Address').fill('jane@example.com')
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.getByLabel('Country')).toBeVisible()
}

// Navigate page 2 → page 3 (no required fields on page 2)
async function advanceFromPage2(page: Page) {
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.getByLabel('Street Address')).toBeVisible()
}

test.describe('All Fields Demo — page 1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/all-fields-demo')
  })

  test('renders personal details fields', async ({ page }) => {
    await expect(page.getByLabel('First Name')).toBeVisible()
    await expect(page.getByLabel('Last Name')).toBeVisible()
    await expect(page.getByLabel('Email Address')).toBeVisible()
    await expect(page.getByLabel('Phone Number')).toBeVisible()
    await expect(page.getByLabel('Age')).toBeVisible()
    await expect(page.getByLabel('Date of Birth')).toBeVisible()
    await expect(page.getByLabel('Short Bio')).toBeVisible()
  })

  test('blocks navigation and shows errors when required fields are empty', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /continue/i }).click()

    // Should still be on page 1 — Country (page 2) must not be visible
    await expect(page.getByLabel('Country')).not.toBeVisible()
    // Validation errors should appear for at least one required field
    await expect(page.locator('[role="alert"]').first()).toBeVisible()
  })
})

test.describe('All Fields Demo — page navigation', () => {
  test('advances to page 2 after filling required fields', async ({ page }) => {
    await page.goto('/all-fields-demo')
    await advanceFromPage1(page)
    await expect(page.getByLabel('First Name')).not.toBeVisible()
  })

  test('back button returns to page 1', async ({ page }) => {
    await page.goto('/all-fields-demo')
    await advanceFromPage1(page)
    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.getByLabel('First Name')).toBeVisible()
  })

  test('preserves values when navigating back', async ({ page }) => {
    await page.goto('/all-fields-demo')
    await page.getByLabel('First Name').fill('Preserved')
    await page.getByLabel('Last Name').fill('Value')
    await page.getByLabel('Email Address').fill('preserved@example.com')
    await page.getByRole('button', { name: /continue/i }).click()
    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.getByLabel('First Name')).toHaveValue('Preserved')
  })
})

test.describe('All Fields Demo — page 2 preferences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/all-fields-demo')
    await advanceFromPage1(page)
  })

  test('renders preference fields', async ({ page }) => {
    await expect(page.getByLabel('Country')).toBeVisible()
    await expect(page.getByLabel('Subscribe to our newsletter')).toBeVisible()
    await expect(page.getByLabel('Budget (£)')).toBeVisible()
  })

  test('newsletter frequency is hidden until subscribe toggle is on', async ({
    page,
  }) => {
    await expect(
      page.getByRole('group').filter({ hasText: 'Newsletter Frequency' }),
    ).not.toBeVisible()

    await page.getByLabel('Subscribe to our newsletter').click()

    await expect(
      page.getByRole('group').filter({ hasText: 'Newsletter Frequency' }),
    ).toBeVisible()
  })

  test('additional notes hidden when country is uk, visible otherwise', async ({
    page,
  }) => {
    await advanceFromPage2(page)

    // No country selected → additional_notes visible ('' !== 'uk')
    await expect(page.getByLabel('Additional Notes')).toBeVisible()
  })

  test('additional notes hidden when country is set to uk', async ({ page }) => {
    await page.getByLabel('Country').selectOption('uk')
    await advanceFromPage2(page)
    await expect(page.getByLabel('Additional Notes')).not.toBeVisible()
  })
})

test.describe('All Fields Demo — page 3 array field', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/all-fields-demo')
    await advanceFromPage1(page)
    await advanceFromPage2(page)
  })

  test('starts with no team member items', async ({ page }) => {
    await expect(page.getByText('Item 1')).not.toBeVisible()
  })

  test('adds a team member and renders its sub-fields', async ({ page }) => {
    await page.getByRole('button', { name: /add item/i }).click()
    await expect(page.getByText('Item 1')).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Role')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
  })

  test('removes a team member', async ({ page }) => {
    await page.getByRole('button', { name: /add item/i }).click()
    await expect(page.getByText('Item 1')).toBeVisible()
    await page.getByRole('button', { name: /remove/i }).click()
    await expect(page.getByText('Item 1')).not.toBeVisible()
  })

  test('can add multiple team members up to maxRows', async ({ page }) => {
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: /add item/i }).click()
      await expect(page.getByText(`Item ${i}`)).toBeVisible()
    }
  })
})

test.describe('All Fields Demo — page 3 group field', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/all-fields-demo')
    await advanceFromPage1(page)
    await advanceFromPage2(page)
  })

  test('renders address group sub-fields', async ({ page }) => {
    await expect(page.getByLabel('Street Address')).toBeVisible()
    await expect(page.getByLabel('City')).toBeVisible()
    await expect(page.getByLabel('Postcode')).toBeVisible()
  })

  test('accepts input in address sub-fields', async ({ page }) => {
    await page.getByLabel('Street Address').fill('123 Test Lane')
    await page.getByLabel('City').fill('London')
    await page.getByLabel('Postcode').fill('SW1A 1AA')
    await expect(page.getByLabel('Street Address')).toHaveValue('123 Test Lane')
    await expect(page.getByLabel('City')).toHaveValue('London')
    await expect(page.getByLabel('Postcode')).toHaveValue('SW1A 1AA')
  })
})

test.describe('All Fields Demo — full submission', () => {
  test('submits the complete form with all required fields', async ({ page }) => {
    await page.goto('/all-fields-demo')

    // Page 1
    await page.getByLabel('First Name').fill('Jane')
    await page.getByLabel('Last Name').fill('Smith')
    await page.getByLabel('Email Address').fill('jane@example.com')
    await page.getByLabel('Phone Number').fill('+44 7700 900000')
    await page.getByLabel('Short Bio').fill('Test submission via Playwright.')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByLabel('Country')).toBeVisible()

    // Page 2
    await page.getByLabel('Country').selectOption('us')
    await page.getByLabel('Subscribe to our newsletter').click()
    await page.getByLabel('Budget (£)').fill('5000')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByLabel('Street Address')).toBeVisible()

    // Page 3
    await page.getByLabel('Street Address').fill('1 Playwright Ave')
    await page.getByLabel('City').fill('Testville')
    await page.getByLabel('Postcode').fill('TS1 1TS')
    await page.getByLabel(
      'I agree to the Terms & Conditions and Privacy Policy',
    ).click()

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

  test('submission data includes group and array field values', async ({ page }) => {
    await page.goto('/all-fields-demo')

    // Page 1
    await page.getByLabel('First Name').fill('Group')
    await page.getByLabel('Last Name').fill('Test')
    await page.getByLabel('Email Address').fill('group@example.com')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByLabel('Country')).toBeVisible()

    // Page 2
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.getByLabel('Street Address')).toBeVisible()

    // Page 3 — fill group + array
    await page.getByLabel('Street Address').fill('99 Array Street')
    await page.getByLabel('City').fill('Groupton')
    await page.getByLabel('Postcode').fill('GR1 1GR')

    await page.getByRole('button', { name: /add item/i }).click()
    await page.getByLabel('Name').fill('Alice')
    await page.getByLabel('Role').fill('Engineer')
    await page.getByLabel('Email').fill('alice@example.com')

    await page.getByLabel(
      'I agree to the Terms & Conditions and Privacy Policy',
    ).click()

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/submit') && r.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /submit/i }).click()
    const response = await responsePromise

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body).toHaveProperty('doc')

    // Verify nested data was captured in submissionData
    const submissionData = body.doc.submissionData as Record<string, unknown>
    expect(submissionData).toHaveProperty('address')
    expect(submissionData).toHaveProperty('team_members')
  })
})
