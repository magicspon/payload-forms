import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ADMIN_AUTH_FILE = path.resolve(__dirname, 'dev/.auth/admin.json')

export default defineConfig({
  testDir: './dev',
  testMatch: ['**/e2e.spec.ts', '**/e2e/**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Sequential so the auth-setup project always completes before other tests start
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  globalSetup: './dev/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // 1. Login once — saves auth state to ADMIN_AUTH_FILE
    {
      name: 'setup',
      testMatch: '**/e2e/admin-user.spec.ts',
    },
    // 2. All other e2e tests reuse the saved auth state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: ADMIN_AUTH_FILE,
      },
      dependencies: ['setup'],
      testIgnore: '**/e2e/admin-user.spec.ts',
    },
  ],
  webServer: {
    command: 'pnpm dev',
    reuseExistingServer: true,
    url: 'http://localhost:3000/admin',
    timeout: 60_000,
  },
})
