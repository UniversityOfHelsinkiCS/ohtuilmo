import { test, expect } from '../test'
import {
  addTimelogEntry,
  addTimelogEntryAlt,
  createGroup,
  createSprint,
  createTag,
  deleteAllGroups,
  deleteAllTags,
  loginAsAdmin,
  requestAs,
} from '../helpers'
import { TEST_USER2, TEST_USER3 } from '../common'

const addWeeksToDate = (date, weeks) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + weeks * 7)
  return newDate
}

const addDaysToDate = (date, days) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

const formatDate = (date) => date.toISOString().slice(0, 10)

const withRequest = async (playwright, fn) => {
  const request = await playwright.request.newContext({
    baseURL: test.info().project.use.baseURL,
  })
  try {
    await fn(request)
  } finally {
    await request.dispose()
  }
}

// moves the mouse to the left or right edge of the element, like Cypress trigger('mouseover', side)
const hoverEdge = async (page, locator, side) => {
  const box = await locator.boundingBox()
  const x = side === 'left' ? box.x + 1 : box.x + box.width - 1
  await page.mouse.move(x, box.y + box.height / 2)
}

// both charts have a tooltip, only the one of the hovered chart is visible
const tooltip = (page) => page.locator('.recharts-tooltip-wrapper').filter({ visible: true })
const lineChartGrid = (page) =>
  page.locator('#tag-usage-line-chart .recharts-cartesian-grid-vertical')

const selectMenuItem = async (page, selector, itemClass, text) => {
  await expect(page.locator(`[data-cy="${selector}"]`)).toBeVisible()
  await page.locator(`[data-cy="${selector}"]`).click()
  await page.locator(itemClass, { hasText: text }).first().click()
}

test.describe('Staff tag page', () => {
  test.beforeAll(async ({ playwright }) => {
    await withRequest(playwright, async (request) => {
      await deleteAllGroups(request)
      // logging in creates the users
      await requestAs(request, TEST_USER2, { url: 'api/tokenCheck/login' })
      await requestAs(request, TEST_USER3, { url: 'api/tokenCheck/login' })
      await createTag(request, 'Coding')
      await createTag(request, 'Meeting')
      const createdGroup = await createGroup(request, {
        name: 'Brand New Group',
        topicId: 1,
        configurationId: 1,
        instructorId: null,
        studentIds: ['012345698', '918273645'],
      })

      const dateToday = new Date()
      const dateYesterday = addDaysToDate(dateToday, -1)

      await createSprint(request, {
        sprint: 0,
        start_date: formatDate(addWeeksToDate(dateYesterday, -1)),
        end_date: formatDate(dateYesterday),
      })
      await createSprint(request, {
        sprint: 1,
        start_date: formatDate(dateToday),
        end_date: formatDate(addWeeksToDate(dateToday, 1)),
      })
      await addTimelogEntry(request, {
        studentNumber: '012345698',
        sprint: 0,
        date: formatDate(dateYesterday),
        minutes: 120,
        description: 'Coding with team A',
        tags: ['Coding'],
        groupId: createdGroup.id,
      })
      await addTimelogEntry(request, {
        studentNumber: '012345698',
        sprint: 1,
        date: formatDate(dateToday),
        minutes: 180,
        description: 'Customer meeting A',
        tags: ['Meeting'],
        groupId: createdGroup.id,
      })

      await addTimelogEntryAlt(request, {
        studentNumber: '918273645',
        sprint: 0,
        date: formatDate(dateYesterday),
        minutes: 240,
        description: 'Coding with team B',
        tags: ['Coding'],
        groupId: createdGroup.id,
      })
      await addTimelogEntryAlt(request, {
        studentNumber: '918273645',
        sprint: 0,
        date: formatDate(dateYesterday),
        minutes: 120,
        description: 'Customer meeting B1',
        tags: ['Meeting'],
        groupId: createdGroup.id,
      })
      await addTimelogEntryAlt(request, {
        studentNumber: '918273645',
        sprint: 1,
        date: formatDate(dateToday),
        minutes: 60,
        description: 'Customer meeting B2',
        tags: ['Meeting'],
        groupId: createdGroup.id,
      })
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('')
    await page.locator('#hamburger-menu-button').click()
    await page.getByText('Tag statistics').first().click()
  })

  test('opens staff tag page', async ({ page }) => {
    await expect(page.getByText('Tags').first()).toBeAttached()
  })

  test('displays all available tags to staff', async ({ page }) => {
    await expect(page.getByText('Coding').first()).toBeAttached()
    await expect(page.getByText('Meeting').first()).toBeAttached()
  })

  test('displays correct tag data for group', async ({ page }) => {
    await selectMenuItem(
      page,
      'configuration-selector',
      '.configuration-menu-item',
      'Konfiguraatio 1',
    )
    await selectMenuItem(page, 'group-selector', '.group-menu-item', 'Brand New Group')
    await expect(page.getByText('Tag usage for Brand New Group').first()).toBeAttached()

    await page.locator('#bar-Coding').hover()
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('6 h')

    await page.locator('#bar-Meeting').hover()
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('6 h')

    await hoverEdge(page, lineChartGrid(page), 'left')
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('Coding : 6 h')
    await expect(tooltip(page)).toContainText('Meeting : 2 h')

    await hoverEdge(page, lineChartGrid(page), 'right')
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('Coding : 0 h')
    await expect(tooltip(page)).toContainText('Meeting : 4 h')
  })

  test('displays correct tag data for individual student', async ({ page }) => {
    await selectMenuItem(
      page,
      'configuration-selector',
      '.configuration-menu-item',
      'Konfiguraatio 1',
    )
    await selectMenuItem(page, 'group-selector', '.group-menu-item', 'Brand New Group')
    await selectMenuItem(page, 'student-selector', '.student-menu-item', 'Volodymyr')
    await expect(page.getByText('Tag usage for Volodymyr').first()).toBeAttached()

    await page.locator('#bar-Coding').hover()
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('4 h')

    await page.locator('#bar-Meeting').hover()
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('3 h')

    await hoverEdge(page, lineChartGrid(page), 'left')
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('Coding : 4 h')
    await expect(tooltip(page)).toContainText('Meeting : 2 h')

    await hoverEdge(page, lineChartGrid(page), 'right')
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('Coding : 0 h')
    await expect(tooltip(page)).toContainText('Meeting : 1 h')
  })

  test.afterAll(async ({ playwright }) => {
    await withRequest(playwright, async (request) => {
      await deleteAllGroups(request)
      await deleteAllTags(request)
    })
  })
})
