import { defineConfig, devices } from '@playwright/test'

// The app is served under /projekti/ in CI, so the base url must end with a slash
// and tests must use relative paths without a leading slash: page.goto('register').
const baseURL = (process.env.E2E_BASE_URL || 'http://localhost:5000').replace(/\/?$/, '/')

export default defineConfig({
  testDir: 'e2e/tests',
  // all tests share one database, so they can not run in parallel
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'e2e/test-results',
  use: {
    baseURL,
    viewport: { width: 1280, height: 720 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
