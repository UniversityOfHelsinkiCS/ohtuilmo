import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  fixturesFolder: 'e2e/cypress/fixtures',
  screenshotsFolder: 'e2e/cypress/screenshots',
  videosFolder: 'e2e/cypress/videos',
  projectId: '2e43ni',
  retries: 3,
  viewportWidth: 1280,
  viewportHeight: 720,
  e2e: {
    specPattern: 'e2e/cypress/integration/**/*.{js,jsx,ts,tsx}',
    supportFile: 'e2e/cypress/support/index.js',
  },
})
