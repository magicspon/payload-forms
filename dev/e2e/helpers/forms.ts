import { Page, expect } from '@playwright/test'

/**
 * Navigate to the form collection list.
 */
export async function gotoForms(page: Page) {
	await page.goto(
		'http://localhost:3000/admin/collections/forms?depth=1&limit=10',
		{ waitUntil: 'domcontentloaded' },
	) // Wait for the list or create button to be visible
	await page
		.getByRole('link', { name: /create new/i })
		.first()
		.waitFor({ state: 'visible' })

	await Promise.all([
		page.waitForResponse(
			(res) =>
				/\/admin\/collections\/forms\/create/.test(res.url()) &&
				res.request().method() === 'GET',
		),
		page.locator('a').filter({ hasText: 'Create new' }).first().click(),
	])
}

/**
 * Create a new form and land on its edit page.
 * Returns the page already on the Canvas tab.
 */
export async function createNewForm(page: Page, title = `Test ${Date.now()}`) {
	await gotoForms(page)
	await page.getByRole('textbox', { name: "Title" }).fill(title)
	await page.locator('button').filter({ hasText: 'Unlock' }).click()
	await page.locator('button').filter({ hasText: 'Generate' }).click()
}

/**
 * Add a field via the [data-testid="add-new-field"] dropdown, fill in its
 * name/label in the auto-opened editor, then save.
 */
export async function addAndNameField(
	page: Page,
	{
		fieldType,
		label,
	}: {
		fieldType: string
		label: string
	},
) {
	await page.locator('[data-testid="add-new-field"]').first().click()
	await page.locator(`[data-testid="field-type-${fieldType}"]`).click()
	await expect(page.locator('[data-testid="general-tab"]')).toBeVisible()
	await page.getByLabel(/^label/i).fill(label)
	await page
		.getByTestId('form-canvas')
		.getByRole('button', { name: 'Save' })
		.click()
}

export async function saveForm(page: Page) {
	const response = await Promise.all([
		page.waitForResponse(
			(res) =>
				/\/api\/forms\//.test(res.url()) && res.request().method() === 'POST',
		),
		page.getByRole('button', { name: 'Publish changes' }).click(),
	])

	return response
}

export async function saveDraft(page: Page) {
	const [saveDraftEn] = await Promise.all([
		page.waitForResponse(
			(res) =>
				/\/api\/forms\//.test(res.url()) && res.request().method() === 'PATCH',
		),
		page.getByRole('button', { name: 'Save Draft' }).click(),
	])
	return saveDraftEn
}

export async function syncStructure(page: Page) {
	const [saveSync] = await Promise.all([
		page.waitForResponse(
			(res) =>
				/\/admin\/collections\/forms\//.test(res.url()) &&
				res.request().method() === 'POST',
		),
		page.getByRole('button', { name: 'Sync structure' }).click(),
	])
	return saveSync
}

export const defaultLocaleApiPattern = (url: string) =>
	url.includes('/api/forms/') && url.includes('draft=true')

/**
 * Dismisses the "Document modified" overlay if Payload's real-time
 * collaboration detection shows it. Safe to call unconditionally — does
 * nothing when the overlay is absent.
 */
export async function dismissDocumentModified(page: Page): Promise<void> {
	const btn = page.getByRole('button', { name: 'Reload document' })
	const visible = await btn.isVisible({ timeout: 500 }).catch(() => false)
	if (visible) {
		await btn.click()
		await btn.waitFor({ state: 'hidden' })
	}
}

export async function switchLocale(
	page: Page,
	{ locale, label }: { locale: RegExp; label: string },
) {
	await page.getByRole('button', { name: 'Locale' }).click()
	const syncCheck1Promise = page.waitForResponse((res) =>
		defaultLocaleApiPattern(res.url()),
	)
	await page.getByRole('button', { name: label }).click()
	await page.waitForURL(locale)
	const syncCheck1 = await syncCheck1Promise
	expect(syncCheck1.status()).toBe(200)
	await dismissDocumentModified(page)
}
