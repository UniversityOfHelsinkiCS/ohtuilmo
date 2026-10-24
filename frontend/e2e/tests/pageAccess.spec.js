import { test, expect } from '../test'
import { loginAsAdmin, loginAsRegisteredUser, loginAsUnregisteredUser } from '../helpers'

const assertIsUnauthorized = async (page) => {
  await expect(page.locator('[class=unauthorized-page]')).toBeVisible()
  await expect(page.getByText('Unauthorized.')).toBeVisible()
}

const assertIsAlreadyRegistered = async (page) => {
  await expect(page).toHaveURL(/\/register/)
  await expect(page.getByText('You have already registered to current project')).toBeVisible()
}

test.describe('Page access and redirect tests', () => {
  test.describe('Page access for user', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsUnregisteredUser(page)
      await page.goto('')
    })

    test('/administration/configuration redirects user to landing page', async ({ page }) => {
      await page.goto('administration/configuration')
      await assertIsUnauthorized(page)
    })

    test('/administration/customer-review-questions redirects user to landing page', async ({
      page,
    }) => {
      await page.goto('administration/customer-review-questions')
      await assertIsUnauthorized(page)
    })

    test('/administration/groups redirects user to landing page', async ({ page }) => {
      await page.goto('administration/groups')
      await assertIsUnauthorized(page)
    })

    test('/administration/participants redirects user to landing page', async ({ page }) => {
      await page.goto('administration/participants')
      await assertIsUnauthorized(page)
    })

    test('/administration/peer-review-questions redirects user to landing page', async ({
      page,
    }) => {
      await page.goto('administration/peer-review-questions')
      await assertIsUnauthorized(page)
    })

    test('/administration/registration-questions redirects user to landing page', async ({
      page,
    }) => {
      await page.goto('administration/registration-questions')
      await assertIsUnauthorized(page)
    })

    test('/administration/registrationmanagement redirects user to landing page', async ({
      page,
    }) => {
      await page.goto('administration/registrationmanagement')
      await assertIsUnauthorized(page)
    })

    test('/administration/email-templates redirects user to login page', async ({ page }) => {
      await page.goto('administration/email-templates')
      await assertIsUnauthorized(page)
    })

    test('/topics redirects user to landing page', async ({ page }) => {
      await page.goto('topics')
      await assertIsUnauthorized(page)
    })

    test('renders /peerreview when visited', async ({ page }) => {
      await page.goto('peerreview')
      await expect(page).toHaveURL(/\/peerreview/)
    })

    test('renders /register when visited', async ({ page }) => {
      await page.locator('[data-cy=registrationlink]').click()
      await expect(page).toHaveURL(/\/register/)
      await expect(page.locator('.registration-form')).toBeVisible()
    })
  })

  test.describe('Page access for registered user', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsRegisteredUser(page)
      await page.goto('')
    })

    test('/register shows "already registered" message', async ({ page }) => {
      await page.goto('register')
      await assertIsAlreadyRegistered(page)
    })
  })

  test.describe('Page access for admin', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('')
    })

    test('renders /administration/configuration when visited', async ({ page }) => {
      await page.locator('.nav-menu-button').click()
      await page.locator('.configuration-menu-item').click()
      await expect(page).toHaveURL(/\/administration\/configuration/)
      await expect(page.getByText('Change configuration').first()).toBeVisible()
    })

    test('renders /administration/customer-review-questions when visited', async ({ page }) => {
      await page.goto('administration/customer-review-questions')
      await expect(page.getByText('Configure customer review questions').first()).toBeVisible()
      await expect(page.getByText('Create question set').first()).toBeVisible()
    })

    test('renders /administration/groups when visited', async ({ page }) => {
      await page.locator('.nav-menu-button').click()
      await page.locator('.group-management-menu-item').click()
      await expect(page).toHaveURL(/\/administration\/groups/)
      await expect(page.getByText('Group Management').first()).toBeVisible()
    })

    test('renders /administration/participants when visited', async ({ page }) => {
      await page.goto('administration/participants')
      await expect(page).toHaveURL(/\/administration\/participants/)
      await expect(page.locator('.participants-container')).toBeVisible()
    })

    test('renders /administration/peer-review-questions when visited', async ({ page }) => {
      await page.goto('administration/peer-review-questions')
      await expect(page).toHaveURL(/\/administration\/peer-review-questions/)
      await expect(page.locator('.peer-review-questions-page')).toBeVisible()
    })

    test('renders /administration/registration-questions when visited', async ({ page }) => {
      await page.goto('administration/registration-questions')
      await expect(page).toHaveURL(/\/administration\/registration-questions/)
      await expect(page.locator('.registration-questions-page')).toBeVisible()
    })

    test('renders /administration/registrationmanagement when visited', async ({ page }) => {
      await page.locator('.nav-menu-button').click()
      await page.locator('.registration-management-menu-item').click()
      await expect(page).toHaveURL(/\/administration\/registrationmanagement/)
      await expect(page.getByText('Registration and review management').first()).toBeVisible()
    })

    test('renders /administration/email-templates when visited', async ({ page }) => {
      await page.locator('.nav-menu-button').click()
      await page.locator('.email-templates-menu-item').click()
      await expect(page).toHaveURL(/\/administration\/email-templates/)
      await expect(page.locator('.email-templates-page')).toBeVisible()
    })

    test('renders /topics when visited', async ({ page }) => {
      await page.locator('.nav-menu-button').click()
      await page.locator('.topics-menu-item').click()
      await expect(page).toHaveURL(/\/topics/)
      await expect(page.locator('.topics-container')).toBeVisible()
    })
  })

  test.describe('404 handler', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsRegisteredUser(page)
    })

    test('shows a 404 not found page when entering an url that is not found', async ({ page }) => {
      await page.goto('amksfmkafg-qfq435tefds')
      await expect(page.locator('.not-found-page')).toContainText('Page not found')
    })

    test('redirects to / when clicking the return link', async ({ page }) => {
      await page.goto('amksfmkafg-qfq435tefds')
      await page.locator('.not-found-page [data-cy="return-link"]').click()

      await expect(page).toHaveURL(/\/registrationdetails/)
    })
  })
})
