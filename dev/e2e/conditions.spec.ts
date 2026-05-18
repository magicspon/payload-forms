import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { addAndNameField, createNewForm } from './helpers/forms'

/**
 * Open the editor for the last field item in the list.
 */
async function openLastFieldEditor(page: Page) {
	const items = page.locator('[data-testid="field-item"]')
	const count = await items.count()
	await page
		.locator('[data-testid="field-item-edit-button"]')
		.nth(count - 1)
		.click()
	await expect(page.locator('[data-testid="general-tab"]')).toBeVisible()
}

test.describe('Form builder — condition editor', () => {
	test('conditions tab shows "no conditions" message by default', async ({
		page,
	}) => {
		await createNewForm(page, 'form-test')
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'trigger field',
		})
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'Dependent Field',
		})

		await openLastFieldEditor(page)
		await page.locator('[data-testid="conditions-tab"]').click()
		await expect(page.getByText(/no conditions/i)).toBeVisible()
	})

	test('can add a condition row', async ({ page }) => {
		await createNewForm(page, 'form-test')
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'trigger field',
		})
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'Dependent Field',
		})
		await openLastFieldEditor(page)

		await page.locator('[data-testid="conditions-tab"]').click()
		await page.getByRole('button', { name: /add condition/i }).click()

		await expect(
			page.locator('[data-testid="condition-row"]').first(),
		).toBeVisible()
	})

	test('condition row has field selector populated with existing fields', async ({
		page,
	}) => {
		await createNewForm(page, 'form-test')
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'trigger field',
		})
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'Dependent Field',
		})
		await openLastFieldEditor(page)

		await page.locator('[data-testid="conditions-tab"]').click()
		await page.getByRole('button', { name: /add condition/i }).click()

		// Click the field select combobox in the first condition row
		const conditionRow = page.locator('[data-testid="condition-row"]').first()
		await conditionRow.locator('combobox, [role="combobox"]').first().click()
		await expect(page.getByText(/trigger field/i).first()).toBeVisible()
	})

	test('can remove a condition row', async ({ page }) => {
		await createNewForm(page, 'form-test')
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'trigger field',
		})
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'Dependent Field',
		})
		await openLastFieldEditor(page)

		await page.locator('[data-testid="conditions-tab"]').click()
		await page.getByRole('button', { name: /add condition/i }).click()
		await expect(page.locator('[data-testid="condition-row"]')).toHaveCount(1)

		await page
			.locator('[data-testid="condition-remove-button"]')
			.first()
			.click()
		await expect(page.locator('[data-testid="condition-row"]')).toHaveCount(0)
		await expect(page.getByText(/no conditions set/i)).toBeVisible()
	})

	test('AND/OR logic toggle appears with 2+ conditions', async ({ page }) => {
		await createNewForm(page, 'form-test')
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'trigger field',
		})
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'Dependent Field',
		})
		await openLastFieldEditor(page)

		await page.locator('[data-testid="conditions-tab"]').click()

		await expect(
			page.getByRole('button', { name: /match all/i }),
		).not.toBeVisible()

		await page.getByRole('button', { name: /add condition/i }).click()
		await expect(
			page.getByRole('button', { name: /match all/i }),
		).not.toBeVisible()

		await page.getByRole('button', { name: /add condition/i }).click()
		await expect(
			page.getByRole('button', { name: /match all|match any/i }),
		).toBeVisible()
	})

	test('AND/OR toggle switches logic', async ({ page }) => {
		await createNewForm(page, 'form-test')
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'trigger field',
		})
		await addAndNameField(page, {
			fieldType: 'text',
			label: 'Dependent Field',
		})
		await openLastFieldEditor(page)

		await page.locator('[data-testid="conditions-tab"]').click()
		await page.getByRole('button', { name: /add condition/i }).click()
		await page.getByRole('button', { name: /add condition/i }).click()

		const toggle = page.getByRole('button', { name: /match all/i })
		await expect(toggle).toBeVisible()
		await toggle.click()
		await expect(page.getByRole('button', { name: /match any/i })).toBeVisible()
	})
})
