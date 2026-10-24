import { test, expect } from '../test'
import { createGroup, deleteAllGroups, loginAsAdmin, loginAsRegisteredUser } from '../helpers'

const newRequestContext = (playwright) =>
  playwright.request.newContext({ baseURL: test.info().project.use.baseURL })

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// like cy.contains: a case sensitive substring match
const menuItem = (page, text) =>
  page.locator('#hamburger-menu-popper').getByText(new RegExp(escapeRegExp(text)))

const openMenu = (page) => page.locator('#hamburger-menu-button').click()

const expectItems = async (page, texts) => {
  await openMenu(page)
  for (const text of texts) {
    await expect(menuItem(page, text).first()).toBeAttached()
  }
}

const expectNoItems = async (page, texts) => {
  await openMenu(page)
  await expect(page.locator('#hamburger-menu-popper')).toBeVisible()
  for (const text of texts) {
    await expect(menuItem(page, text)).toHaveCount(0)
  }
}

test.describe('Menu items for different user roles', () => {
  test.describe('Main menu of admin', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('')
    })

    test('Admin should see admin menu items', async ({ page }) => {
      await expectItems(page, [
        'Course',
        'Create Topic',
        'Topics',
        'Grades given by instructors',
        'Course instance questions',
        'Registration and review settings',
        'Current registrations',
        'Group Management',
        'Participants',
        'Users',
        'Registration Questions',
        'Customer Review Questions',
        'Peer Review Questions',
        'Email Templates',
      ])
    })

    test('Admin should see instructor menu items', async ({ page }) => {
      await expectItems(page, ['Instructor', 'Home', 'Instructor Review', 'Customer reviews'])
    })

    test('Admin should see student menu items', async ({ page }) => {
      await expectItems(page, [
        'Student',
        'Register',
        'Registration Details',
        'Peer Review',
        'Time Logs',
        'Sprint Dashboard',
      ])
    })
  })

  test.describe('Main menu of student', () => {
    test.beforeAll(async ({ playwright }) => {
      const request = await newRequestContext(playwright)
      await createGroup(request, {
        name: 'Brand New Group',
        topicId: 1,
        configurationId: 1,
        instructorId: null,
        studentIds: ['012345698'],
      })
      await request.dispose()
    })
    test.afterAll(async ({ playwright }) => {
      const request = await newRequestContext(playwright)
      await deleteAllGroups(request)
      await request.dispose()
    })
    test.beforeEach(async ({ page }) => {
      await loginAsRegisteredUser(page)
      await page.goto('')
    })

    test('Student should not see admin menu items', async ({ page }) => {
      await expectNoItems(page, [
        'Admin',
        'Topics',
        'Create Topic',
        'Reviews',
        'Course instance questions',
        'Registration and review settings',
        'Current registrations',
        'Group Management',
        'Participants',
        'Users',
        'Registration Questions',
        'Customer Review Questions',
        'Peer Review Questions',
        'Email Templates',
      ])
    })

    test('Student should not see instructor menu items', async ({ page }) => {
      await expectNoItems(page, ['Instructor', 'Instructor Review', 'Reviews', 'Customer reviews'])
    })

    test('Student should see student menu items', async ({ page }) => {
      await expectItems(page, [
        'Student',
        'Home',
        'Registration Details',
        'Peer Review',
        'Time Logs',
        'Sprint Dashboard',
      ])
    })
  })

  test.describe('Main menu of student without group', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsRegisteredUser(page)
      await page.goto('')
    })

    test('Student without group should not see admin menu items', async ({ page }) => {
      await expectNoItems(page, [
        'Admin',
        'Topics',
        'Create Topic',
        'Reviews',
        'Course instance questions',
        'Registration and review settings',
        'Current registrations',
        'Group Management',
        'Participants',
        'Users',
        'Registration Questions',
        'Customer Review Questions',
        'Peer Review Questions',
        'Email Templates',
      ])
    })

    test('Student without group should not see instructor menu items', async ({ page }) => {
      await expectNoItems(page, ['Instructor', 'Instructor Review', 'Reviews', 'Customer reviews'])
    })

    test('Student without group should not see student menu items', async ({ page }) => {
      await expectNoItems(page, ['Peer Review', 'Time Logs', 'Sprint Dashboard'])
    })

    test('Student without group should see student without group menu items', async ({ page }) => {
      await expectItems(page, ['Student - no group', 'Register', 'Registration Details'])
    })
  })
})
