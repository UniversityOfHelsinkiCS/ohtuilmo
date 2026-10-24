import { test, expect } from '../test'
import { loginAsAdmin } from '../helpers'

// the tests depend on each other: the tag added by one test is used by the later ones
test.describe.configure({ mode: 'serial' })

test.describe('Tag management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('')
    await page.locator('#hamburger-menu-button').click()
    await page.getByText('Tag management').first().click()
  })

  test('tag management page opens', async ({ page }) => {
    await expect(page.getByText('Add new tag').first()).toBeVisible()
  })

  test('admin can add a new tag', async ({ page }) => {
    await page.locator('#tagTitle').fill('New tag')
    await page.locator('.button').first().click()
    await expect(page.getByText(/New tag/).first()).toBeVisible()
  })

  test('duplicate tag cannot be added', async ({ page }) => {
    await page.locator('#tagTitle').fill('New tag')
    await page.locator('.button').first().click()
    await page.locator('#tagTitle').fill('New tag')
    await page.locator('.button').first().click()
    await expect(page.getByText('Tag already exists').first()).toBeVisible()
  })

  test('too short tag cannot be added', async ({ page }) => {
    await page.locator('#tagTitle').fill('NT')
    await page.locator('.button').first().click()
    await expect(page.getByText('Title must be at least 3 characters.').first()).toBeVisible()
  })

  test('tag is not deleted when No is pressed in confirmation dialog', async ({ page }) => {
    await page.locator('#tagTitle').fill('New tag')
    await page.locator('.delete-tag-button').click()
    await page.getByText('No', { exact: true }).click()
    await expect(page.getByText(/New tag/).first()).toBeVisible()
  })

  test('tag is deleted when Yes is pressed in confirmation dialog', async ({ page }) => {
    await page.locator('#tagTitle').fill('New tag')
    await page.locator('.delete-tag-button').click()
    await page.getByText('Yes', { exact: true }).click()
    await expect(page.getByText(/New tag/)).toHaveCount(0)
  })
})
