import { expect, test as base } from '@playwright/test'

/**
 * Base fixture that all forms tests should import from.
 * The admin session is provided automatically via storageState in playwright.config.ts.
 * Extend this to add shared form-test fixtures as needed.
 */
export const test = base
export { expect }
