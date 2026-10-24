import { test, expect } from '../test'
import {
  loginAsAdmin,
  loginAsRegisteredIndicatedUser,
  loginAsUnregisteredUser,
  createGroup,
} from '../helpers'
import { TEST_USER3 } from '../common'

test.describe('Group assignment indicator tests', () => {
  test.describe('Indicator for unregistered user', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUnregisteredUser(page)
      await page.goto('')
    })

    test('renders "No group assigned" when visited', async ({ page }) => {
      const indicator = page.locator('[data-cy=groupname_display_unassigned]')
      await expect(indicator).toBeVisible()
      await expect(indicator).toHaveText('No group assigned')
    })
  })

  test.describe('Indicator for registered user', () => {
    test.beforeAll(async ({ playwright }) => {
      const request = await playwright.request.newContext({
        baseURL: test.info().project.use.baseURL,
      })
      // logging in creates the user
      await request.post('api/login', { headers: TEST_USER3.headers })
      await createGroup(request, {
        name: 'Indicator Test Group',
        topicId: 4,
        configurationId: 1,
        instructorId: '112345699',
        studentIds: ['918273645'],
      })
      await request.dispose()
    })

    test.beforeEach(async ({ page }) => {
      await loginAsRegisteredIndicatedUser(page)
      await page.goto('')
    })

    test('renders assigned group when visited', async ({ page }) => {
      const indicator = page.locator('[data-cy=groupname_display_assigned]')
      await expect(indicator).toBeVisible()
      await expect(indicator).toContainText('Indicator Test Group')
    })
  })

  test.describe('Indicator for admin user', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('')
    })

    test('does not render group indicator when visited', async ({ page }) => {
      // wait for the app to render before checking that the indicators are missing
      await expect(page.locator('#hamburger-menu-button')).toBeVisible()
      await expect(page.locator('[data-cy=groupname_display_assigned]')).toHaveCount(0)
      await expect(page.locator('[data-cy=groupname_display_unassigned]')).toHaveCount(0)
    })
  })
})
