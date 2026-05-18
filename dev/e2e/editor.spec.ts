import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { createNewForm } from './helpers/forms'

/**
 * Add a field to the first row via the [data-testid="add-new-field"] dropdown.
 */
async function addField(page: Page, fieldType: string) {
	await page.locator('[data-testid="add-new-field"]').first().click()
	await page.locator(`[data-testid="field-type-${fieldType}"]`).click()
}

/**
 * Add a field and wait for the editor to be visible.
 * The field add auto-opens the editor; this helper confirms it's ready.
 */
async function addFieldAndOpenEditor(page: Page, fieldType: string) {
	await addField(page, fieldType)
	await expect(page.locator('[data-testid="general-tab"]')).toBeVisible()
}

test.describe('Form builder — field editor', () => {
	test.beforeEach(async ({ page }) => {
		await createNewForm(page)
	})

	test('clicking edit button opens the editor panel', async ({ page }) => {
		await addFieldAndOpenEditor(page, 'text')

		await expect(page.locator('[data-testid="general-tab"]')).toBeVisible()
		await expect(page.locator('[data-testid="advanced-tab"]')).toBeVisible()
		await expect(page.locator('[data-testid="conditions-tab"]')).toBeVisible()
	})

	test('save button is enabled after filling name', async ({ page }) => {
		await addFieldAndOpenEditor(page, 'text')

		await page.getByLabel(/^label/i).fill('my_field')
		await expect(
			page.getByTestId('form-canvas').getByRole('button', { name: 'Save' }),
		).toBeEnabled()
	})

	test('saving a field updates its label in the canvas', async ({ page }) => {
		await addFieldAndOpenEditor(page, 'text')

		await page.getByLabel(/^label/i).fill('First Name')
		await page
			.getByTestId('form-canvas')
			.getByRole('button', { name: 'Save' })
			.click()

		// The field item in the canvas should show the label
		await expect(
			page.locator('[data-testid="field-item"]').first(),
		).toContainText('First Name')
	})

	test('cancel button closes the editor without saving', async ({ page }) => {
		await addFieldAndOpenEditor(page, 'text')

		await page.getByLabel(/^label/i).fill('unsaved_name')
		await page
			.getByTestId('form-canvas')
			.getByRole('button', { name: 'Cancel' })
			.click()

		// Editor tabs should no longer be visible
		await expect(page.locator('[data-testid="general-tab"]')).not.toBeVisible()
		// Field should not show unsaved label
		await expect(
			page.locator('[data-testid="field-item"]').first(),
		).not.toContainText('unsaved_name')
	})

	test('duplicate field name disables save button', async ({ page }) => {
		// Add and name first field
		await addFieldAndOpenEditor(page, 'text')
		await page.getByLabel(/^label/i).fill('duplicate')
		await page
			.getByTestId('form-canvas')
			.getByRole('button', { name: 'Save' })
			.click()

		// Add second field — editor auto-opens
		await addFieldAndOpenEditor(page, 'text')
		await page.getByLabel(/^label/i).fill('duplicate')

		await expect(
			page.getByTestId('form-canvas').getByRole('button', { name: 'Save' }),
		).toBeDisabled()
	})
})
