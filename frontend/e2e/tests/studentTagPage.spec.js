import { test, expect } from '../test'
import {
  addTimelogEntry,
  createGroup,
  createSprint,
  createTag,
  deleteAllGroups,
  deleteAllTags,
  loginAsRegisteredUser,
  requestAs,
} from '../helpers'
import { TEST_USER2 } from '../common'

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

test.describe('Student tag page', () => {
  test.beforeAll(async ({ playwright }) => {
    await withRequest(playwright, async (request) => {
      await deleteAllGroups(request)
      // logging in creates the user
      await requestAs(request, TEST_USER2, { url: 'api/tokenCheck/login' })
      await createTag(request, 'Coding')
      await createTag(request, 'Meeting')
      const createdGroup = await createGroup(request, {
        name: 'Brand New Group',
        topicId: 1,
        configurationId: 1,
        instructorId: null,
        studentIds: ['012345698'],
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
        description: 'Coding with team',
        tags: ['Coding'],
        groupId: createdGroup.id,
      })
      await addTimelogEntry(request, {
        studentNumber: '012345698',
        sprint: 1,
        date: formatDate(dateToday),
        minutes: 180,
        description: 'Customer meeting',
        tags: ['Meeting'],
        groupId: createdGroup.id,
      })
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginAsRegisteredUser(page)
    await page.goto('')
    await expect(page.locator('h4', { hasText: 'Brand New Group' }).first()).toBeVisible({
      timeout: 15000,
    })
    await expect(page.locator('h4', { hasText: 'testertester3' }).first()).toBeVisible()
    await expect(page.locator('.registration-details-container')).toBeAttached()
    await page.locator('#hamburger-menu-button').click()
    await page.getByText('Tags').first().click()
  })

  test('opens student tag page', async ({ page }) => {
    await expect(page.getByText('Tags').first()).toBeAttached()
  })

  test('displays all available tags to students', async ({ page }) => {
    await expect(page.getByText('Coding').first()).toBeAttached()
    await expect(page.getByText('Meeting').first()).toBeAttached()
  })

  test('displays correct amount of minutes for each tag in bar chart', async ({ page }) => {
    await page.locator('#bar-Coding').hover()
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('2 h')

    await page.locator('#bar-Meeting').hover()
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('3 h')
  })

  test('displays correct amount of minutes for each tag in line chart', async ({ page }) => {
    await hoverEdge(page, lineChartGrid(page), 'left')
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('Coding : 2 h')
    await expect(tooltip(page)).toContainText('Meeting : 0 h')

    await hoverEdge(page, lineChartGrid(page), 'right')
    await expect(tooltip(page)).toBeVisible()
    await expect(tooltip(page)).toContainText('Coding : 0 h')
    await expect(tooltip(page)).toContainText('Meeting : 3 h')
  })

  test.afterAll(async ({ playwright }) => {
    await withRequest(playwright, async (request) => {
      await deleteAllGroups(request)
      await deleteAllTags(request)
    })
  })
})
