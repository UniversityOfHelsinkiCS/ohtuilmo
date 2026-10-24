// The tests import test and expect from here instead of @playwright/test.
import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, use) => {
    // accept confirm dialogs like Cypress did, a test that wants to check or
    // dismiss a dialog can remove this with page.removeAllListeners('dialog')
    page.on('dialog', (dialog) => dialog.accept())
    await use(page)
  },
})

export { expect }
