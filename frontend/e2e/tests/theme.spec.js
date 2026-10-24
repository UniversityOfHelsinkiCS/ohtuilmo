import { test, expect } from '../test'

const theme = (page) => page.evaluate(() => window.localStorage.getItem('theme'))

test.describe('Theme switch', () => {
  test('uses light mode by default when no localStorage value exists', async ({ page }) => {
    await page.goto('')

    expect(await theme(page)).toBeNull()
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  })

  test('starts in dark mode when localStorage.theme = dark', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('theme', 'dark'))
    await page.goto('')

    expect(await theme(page)).toBe('dark')
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)')
  })

  test('saves theme to localStorage', async ({ page }) => {
    await page.goto('')

    expect(await theme(page)).toBeNull()

    await page.locator('[data-cy="theme-toggle"]').click()
    await expect.poll(() => theme(page)).toBe('dark')

    await page.locator('[data-cy="theme-toggle"]').click()
    await expect.poll(() => theme(page)).toBe('light')
  })
})
