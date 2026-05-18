import { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { createNewForm } from './helpers/forms'

// Pragmatic DnD uses pointer events, not the HTML5 drag API.
// We simulate a drag by dispatching pointerdown → pointermove → pointerup.
async function dragTo(
	page: Page,
	sourceSelector: string,
	targetSelector: string,
) {
	const source = page.locator(sourceSelector).first()
	const target = page.locator(targetSelector).first()

	await source.scrollIntoViewIfNeeded()
	await target.scrollIntoViewIfNeeded()

	const sourceBbox = await source.boundingBox()
	const targetBbox = await target.boundingBox()
	if (!sourceBbox || !targetBbox) throw new Error('Bounding box not found')

	const sx = sourceBbox.x + sourceBbox.width / 2
	const sy = sourceBbox.y + sourceBbox.height / 2
	const tx = targetBbox.x + targetBbox.width / 2
	const ty = targetBbox.y + targetBbox.height / 2

	await page.mouse.move(sx, sy)
	await page.mouse.down()
	// Move in small steps so the DnD monitor picks up the drag
	const steps = 10
	for (let i = 1; i <= steps; i++) {
		await page.mouse.move(
			sx + ((tx - sx) * i) / steps,
			sy + ((ty - sy) * i) / steps,
		)
	}
	await page.mouse.up()
}

/**
 * Drag a field from the palette to the canvas, then close the auto-opened editor.
 */
async function dragFieldAndCloseEditor(page: Page, fieldType: string) {
	await dragTo(
		page,
		`[data-testid="palette-item-${fieldType}"]`,
		'[data-testid="form-row"]',
	)
	// Editor auto-opens after drop — wait for it to appear, then close it
	const cancelBtn = page.getByRole('button', { name: 'Cancel' })
	await cancelBtn.waitFor({ state: 'visible' })
	await cancelBtn.click()
	await cancelBtn.waitFor({ state: 'hidden' })
	await expect(page.locator('[data-testid="field-item"]').first()).toBeVisible()
}

test.describe('Form builder — drag and drop', () => {
	test.beforeEach(async ({ page }) => {
		await createNewForm(page, `form: ${Date.now()}`)
	})

	test('drag a text field from palette onto the canvas', async ({ page }) => {
		const textPaletteItem = page
			.locator('[data-testid="palette-item-text"]')
			.first()

		await expect(textPaletteItem).toBeVisible()
		await dragTo(
			page,
			'[data-testid="palette-item-text"]',
			'[data-testid="form-row"]',
		)
		// A field-item should now appear on the canvas
		await expect(page.getByRole('textbox', { name: 'Label *' })).toBeVisible()
	})

	test('drag a second field and both appear on canvas', async ({ page }) => {
		const textPaletteItem = page
			.locator('[data-testid="palette-item-text"]')
			.first()

		await expect(textPaletteItem).toBeVisible()
		await dragTo(
			page,
			'[data-testid="palette-item-text"]',
			'[data-testid="form-row"]',
		)

		await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
		await page.getByRole('button', { name: 'Cancel' }).click()
		await expect(page.getByRole('button', { name: 'Cancel' })).not.toBeVisible()

		// Drop the second field onto the new-row-target (always present, always empty,
		// always a registered Pragmatic DnD drop target)
		await dragTo(
			page,
			'[data-testid="palette-item-email"]',
			'[data-testid="new-row-target"]',
		)
		await page.getByRole('button', { name: 'Cancel' }).click()

		await expect(page.locator('[data-testid="field-item"]')).toHaveCount(2)
	})

	test('reorder fields within a row via drag handle', async ({ page }) => {
		// Add two fields, closing editor after each
		await dragFieldAndCloseEditor(page, 'text')
		await dragFieldAndCloseEditor(page, 'email')

		const handles = page.locator('[data-testid="field-item-handle"]')
		await expect(handles).toHaveCount(2)

		// Drag first field handle to after second field
		const firstHandle = handles.nth(0)
		const secondField = page.locator('[data-testid="field-item"]').nth(1)

		const from = await firstHandle.boundingBox()
		const to = await secondField.boundingBox()
		if (!from || !to) throw new Error('Bounding box not found')

		await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
		await page.mouse.down()
		const steps = 10
		const tx = to.x + to.width
		const ty = to.y + to.height / 2
		const sx = from.x + from.width / 2
		const sy = from.y + from.height / 2
		for (let i = 1; i <= steps; i++) {
			await page.mouse.move(
				sx + ((tx - sx) * i) / steps,
				sy + ((ty - sy) * i) / steps,
			)
		}
		await page.mouse.up()

		await expect(page.locator('[data-testid="field-item"]')).toHaveCount(2)
	})
})
