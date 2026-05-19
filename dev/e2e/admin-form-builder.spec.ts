import { expect, test, type Page } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function gotoCreate(page: Page) {
  await page.goto('/admin/collections/forms/create')
  await expect(page.getByTestId('form-canvas')).toBeVisible()
}

/**
 * Add a field via the row + popup and immediately close the auto-opened editor
 * drawer so the canvas is interactive for subsequent actions.
 */
async function addFieldToRow(page: Page, fieldType: string, rowIndex = 0) {
  await page.getByTestId('add-new-field').nth(rowIndex).click()
  await page.locator(`#field-type-${fieldType}`).first().click()
  await expect(page.getByTestId('field-item').first()).toBeVisible()
  // Adding a field via the popup always opens the editor drawer.
  // Close it so further canvas interactions aren't blocked by the overlay.
  await expect(page.getByTestId('cancel-button')).toBeVisible()
  await page.getByTestId('cancel-button').click()
  await expect(page.getByTestId('save-button')).not.toBeVisible()
}

/** Open the field editor drawer for the nth field item. */
async function openFieldEditor(page: Page, index = 0) {
  await page.getByTestId('field-item-edit-button').nth(index).click()
  await expect(page.getByTestId('save-button')).toBeVisible()
}

/** Close the editor drawer via Save and wait for it to finish animating out. */
async function saveFieldEditor(page: Page) {
  await page.getByTestId('save-button').click()
  await expect(page.getByTestId('save-button')).not.toBeVisible()
}

/** Publish the form and wait for the redirect to the edit URL and save to complete. */
async function publishForm(page: Page) {
  await page.getByRole('button', { name: /publish/i }).click()
  await page.waitForURL(/\/admin\/collections\/forms\/[^/]+$/)
  await page.waitForLoadState('networkidle')
}

// ─── Canvas — basic rendering ─────────────────────────────────────────────────

test.describe('Form builder — canvas', () => {
  test('shows canvas with one empty row on create', async ({ page }) => {
    await gotoCreate(page)
    await expect(page.getByTestId('form-row')).toBeVisible()
    await expect(page.getByTestId('new-row-target')).toBeVisible()
    await expect(page.getByTestId('field-item')).not.toBeVisible()
  })

  test('field palette items are visible', async ({ page }) => {
    await gotoCreate(page)
    await expect(page.getByTestId('palette-item-text')).toBeVisible()
    await expect(page.getByTestId('palette-item-email')).toBeVisible()
    await expect(page.getByTestId('palette-item-textarea')).toBeVisible()
    await expect(page.getByTestId('palette-item-select')).toBeVisible()
    await expect(page.getByTestId('palette-item-radio')).toBeVisible()
    await expect(page.getByTestId('palette-item-checkbox')).toBeVisible()
  })
})

// ─── Adding fields ────────────────────────────────────────────────────────────

test.describe('Form builder — adding fields', () => {
  test('adds a text field via the row + button', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')
    await expect(page.getByTestId('field-item')).toHaveCount(1)
    await expect(page.getByTestId('field-item')).toContainText('text')
  })

  test('adds an email field', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'email')
    await expect(page.getByTestId('field-item')).toContainText('email')
  })

  test('adds multiple fields to the same row', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')

    // Second field — drawer will open again; just check the count
    await page.getByTestId('add-new-field').first().click()
    await page.locator('#field-type-email').click()
    await expect(page.getByTestId('field-item')).toHaveCount(2)
  })

  test('adds fields of every basic type without error', async ({ page }) => {
    await gotoCreate(page)
    const types = [
      'text', 'email', 'number', 'textarea',
      'select', 'radio', 'checkbox', 'date', 'toggle', 'consent',
    ]
    for (const type of types) {
      await addFieldToRow(page, type)
    }
    await expect(page.getByTestId('field-item')).toHaveCount(types.length)
  })
})

// ─── Editing fields ───────────────────────────────────────────────────────────

test.describe('Form builder — editing fields', () => {
  test('opens the field editor drawer when edit button is clicked', async ({
    page,
  }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')
    await openFieldEditor(page)
    await expect(page.getByLabel('Label')).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
  })

  test('saves a new label and it appears on the field chip', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')
    await openFieldEditor(page)
    await page.getByLabel('Label').fill('Your Full Name')
    await saveFieldEditor(page)
    await expect(page.getByTestId('field-item')).toContainText('Your Full Name')
  })

  test('marks a field as required', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')
    await openFieldEditor(page)
    await page.getByLabel('Label').fill('Required Field')
    await page.getByLabel('Required').check()
    await saveFieldEditor(page)
    await expect(page.getByTestId('field-item')).toContainText('Required Field')
  })

  test('cancel button closes the drawer without saving', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')
    await openFieldEditor(page)
    await page.getByLabel('Label').fill('Should Not Save')
    await page.getByTestId('cancel-button').click()
    await expect(page.getByTestId('save-button')).not.toBeVisible()
    await expect(page.getByTestId('field-item')).not.toContainText('Should Not Save')
  })

  test('name auto-derives from label', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')
    await openFieldEditor(page)
    await page.getByLabel('Label').fill('First Name')
    await expect(page.getByLabel('Name')).toHaveValue('firstName')
  })
})

// ─── Deleting fields ──────────────────────────────────────────────────────────

test.describe('Form builder — deleting fields', () => {
  test('deletes a field after confirming the modal', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')
    await expect(page.getByTestId('field-item')).toHaveCount(1)

    await page.getByTestId('delete-field-button').click()
    // Wait for the confirmation modal heading to appear
    await expect(page.getByText('Delete Field')).toBeVisible()
    // Click the confirm Delete button (last to avoid matching the icon-button sr-only text)
    await page.getByRole('button', { name: 'Delete' }).last().click()

    await expect(page.getByTestId('field-item')).toHaveCount(0)
  })

  test('does not delete when the confirmation is dismissed', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text')

    await page.getByTestId('delete-field-button').click()
    await expect(page.getByText('Delete Field')).toBeVisible()
    await page.getByRole('button', { name: /cancel/i }).last().click()

    await expect(page.getByTestId('field-item')).toHaveCount(1)
  })
})

// ─── Row operations ───────────────────────────────────────────────────────────

test.describe('Form builder — row operations', () => {
  test('adds a new row below an existing row', async ({ page }) => {
    await gotoCreate(page)
    await expect(page.getByTestId('form-row')).toHaveCount(1)
    await page.getByTestId('add-row-button').click()
    await expect(page.getByTestId('form-row')).toHaveCount(2)
  })

  test('deletes a row', async ({ page }) => {
    await gotoCreate(page)
    await page.getByTestId('add-row-button').click()
    await expect(page.getByTestId('form-row')).toHaveCount(2)
    // delete-row-button only appears for rows after the first
    await page.getByTestId('delete-row-button').click()
    await expect(page.getByTestId('form-row')).toHaveCount(1)
  })

  test('adds fields to two separate rows', async ({ page }) => {
    await gotoCreate(page)
    await addFieldToRow(page, 'text', 0)

    await page.getByTestId('add-row-button').click()
    // Add email to the new (second) row — drawer opens; count assertion works regardless
    await page.getByTestId('add-new-field').last().click()
    await page.locator('#field-type-email').last().click()

    await expect(page.getByTestId('field-item')).toHaveCount(2)
    await expect(page.getByTestId('form-row')).toHaveCount(2)
  })
})

// ─── Multi-page ───────────────────────────────────────────────────────────────

test.describe('Form builder — multi-page', () => {
  test('starts with one page tab', async ({ page }) => {
    await gotoCreate(page)
    await expect(page.getByTestId('tab-item')).toHaveCount(1)
  })

  test('adds a second page', async ({ page }) => {
    await gotoCreate(page)
    await page.getByRole('button', { name: /add page/i }).click()
    await expect(page.getByTestId('tab-item')).toHaveCount(2)
  })

  test('switching to a different page shows an empty canvas', async ({ page }) => {
    await gotoCreate(page)
    await page.getByRole('button', { name: /add page/i }).click()

    // Add a field to page 1 (drawer is closed after)
    await addFieldToRow(page, 'text', 0)

    // Switch to page 2
    await page
      .getByRole('tablist', { name: 'Select form page' })
      .getByRole('button', { name: 'Page 2' })
      .click()

    // The page-1 panel is hidden — field-item from page 1 is not visible
    await expect(page.getByTestId('field-item')).not.toBeVisible()
  })

  test('deletes the second page', async ({ page }) => {
    await gotoCreate(page)
    await page.getByRole('button', { name: /add page/i }).click()
    await expect(page.getByTestId('tab-item')).toHaveCount(2)

    // delete-page-button only appears when the tab is active
    await page
      .getByRole('tablist', { name: 'Select form page' })
      .getByRole('button', { name: 'Page 2' })
      .click()
    await page.getByTestId('delete-page-button').click()

    await expect(page.getByTestId('tab-item')).toHaveCount(1)
  })
})

// ─── Full workflow ────────────────────────────────────────────────────────────

test.describe('Form builder — publish and render', () => {
  test('creates a form with fields, publishes it, and renders on the public page', async ({
    page,
  }) => {
    await gotoCreate(page)
    await page.getByLabel('Title').fill(`E2E Builder Form ${Date.now()}`)

    // Add text field and set its label
    await addFieldToRow(page, 'text')
    await openFieldEditor(page)
    await page.getByLabel('Label').fill('Your Name')
    await saveFieldEditor(page)

    // Add a new row with a consent field — drawer opens automatically; fill it inline
    await page.getByTestId('add-row-button').click()
    await page.getByTestId('add-new-field').last().click()
    await page.locator('#field-type-consent').last().click()
    await expect(page.getByTestId('save-button')).toBeVisible()
    await page.getByLabel('Label').fill('I agree to the terms')
    await saveFieldEditor(page)

    // Publish the form
    await publishForm(page)

    // Wait for the slug to be auto-populated (slugField generates on save)
    await expect(page.getByLabel('Slug')).not.toHaveValue('', { timeout: 10000 })

    // Read the auto-generated slug from the sidebar
    const slug = await page.getByLabel('Slug').inputValue()
    expect(slug).toBeTruthy()

    // Verify the form renders on the public page
    await page.goto(`/${slug}`)
    await expect(page.getByLabel('Your Name')).toBeVisible()
    await expect(page.getByLabel('I agree to the terms')).toBeVisible()
  })
})
