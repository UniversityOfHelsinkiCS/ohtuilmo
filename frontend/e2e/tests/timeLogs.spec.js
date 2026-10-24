import { test, expect } from '../test'
import { createGroup, deleteAllGroups, loginAsRegisteredUser, selectDate } from '../helpers'

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

const openFromMenu = async (page, item) => {
  await page.locator('#hamburger-menu-button').click()
  await page.getByText(item).first().click()
}

const expectHeading = (page, text) =>
  expect(page.locator('h4').filter({ hasText: text }).first()).toBeVisible({ timeout: 15000 })

const openTimeLogs = async (page) => {
  await openFromMenu(page, 'Time Log')
  await expectHeading(page, 'Time Logs')
}

const openTimeLogsByUrl = async (page) => {
  await page.goto('timelogs')
  await expectHeading(page, 'Time Logs')

  await expect(page.locator('.timelogs-container-1')).toBeAttached()
  await expect(page.locator('.input-container')).toBeAttached()
}

const timeLogRows = (page) => page.locator('#timelog-rows > *')

test.describe('Time logs & sprints', () => {
  // the tests build on the sprints and time logs created by the previous tests
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ playwright }) => {
    await withRequest(playwright, async (request) => {
      await deleteAllGroups(request)
      await createGroup(request, {
        name: 'Brand New Group',
        topicId: 1,
        configurationId: 1,
        instructorId: null,
        studentIds: ['012345698'],
      })
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginAsRegisteredUser(page)
    await page.goto('')
    await expectHeading(page, 'Brand New Group')
    await expectHeading(page, 'testertester3')
    await expect(page.locator('.registration-details-container')).toBeAttached()
  })

  test('add 2 sprints', async ({ page }) => {
    await openFromMenu(page, 'Sprint Dashboard')

    await expectHeading(page, 'Add new sprint')

    const dateToday = new Date()
    const dateYesterday = addDaysToDate(dateToday, -1)

    await page.locator('#sprintNumber').fill('1')
    await selectDate(page, page.locator('#startDate'), addWeeksToDate(dateYesterday, -1))
    await selectDate(page, page.locator('#endDate'), dateYesterday)
    await page.locator('#add-sprint-button').click()
    await expect(page.locator('[data-cy=sprint-1]')).toBeAttached()

    await page.locator('#sprintNumber').fill('2')
    await selectDate(page, page.locator('#startDate'), dateToday)
    await selectDate(page, page.locator('#endDate'), addWeeksToDate(dateToday, 1))
    await page.locator('#add-sprint-button').click()

    await expect(page.locator('[data-cy=sprint-2]')).toBeAttached()
  })

  test('renders current sprint by default', async ({ page }) => {
    await openTimeLogs(page)

    await expect(page.locator('.timelogs-sprint-select')).toContainText('SPRINT 2')
  })

  test('time log form is disabled for previous sprint', async ({ page }) => {
    await openTimeLogs(page)

    await page.locator('#previous-sprint-button').click()
    await expect(page.locator('#date')).toBeDisabled()
    await expect(page.locator('#time')).toBeDisabled()
    await expect(page.locator('#description')).toBeDisabled()
    await expect(page.locator('#time-log-submit-button')).toBeDisabled()
  })

  test('add 2 time logs', async ({ page }) => {
    await openTimeLogs(page)

    await selectDate(page, page.locator('#date'), new Date())
    await page.locator('#time').fill('01:00')
    await page.locator('#description').fill('test description 1')
    await page.locator('#time-log-submit-button').click()

    await expect(page.locator('.notification')).toHaveText('Time log created successfully')

    await selectDate(page, page.locator('#date'), addDaysToDate(new Date(), 1))
    await page.locator('#time').fill('02:00')
    await page.locator('#description').fill('test description 2')
    await page.locator('#time-log-submit-button').click()

    await expect(page.locator('.notification')).toHaveText('Time log created successfully')

    await expect(page.locator('#timelog-rows')).toContainText('test description 1')
    await expect(page.locator('#timelog-rows')).toContainText('test description 2')
  })

  test('should display 2 time logs', async ({ page }) => {
    await openTimeLogs(page)

    await expect(page.locator('.timelogs-container-1')).toContainText('test description 1', {
      timeout: 15000,
    })
    await expect(page.locator('.timelogs-container-1')).toContainText('test description 2', {
      timeout: 15000,
    })

    await expect(timeLogRows(page)).toHaveCount(2)
  })

  test('shows error from backend when creating timeLog fails with data outside sprint', async ({
    page,
  }) => {
    await openTimeLogsByUrl(page)
    await selectDate(page, page.locator('.date input').first(), '2022-02-01')
    await page.locator('#time').fill('01:00')
    await page.locator('#description').fill('valid description')
    await page.locator('.submit-button').click()

    await expect(page.locator('.notification')).toHaveText(
      'The log date is not within sprint start and end date.',
    )
  })

  test('previous week should not display time logs', async ({ page }) => {
    await openTimeLogs(page)

    await expect(page.locator('.timelogs-container-1')).toContainText('test description 2')
    await page.locator('#previous-sprint-button').click()
    await expect(timeLogRows(page)).toHaveCount(1)
    await expect(page.locator('#timelog-rows')).toContainText(
      'There are no time logs for this sprint.',
    )
  })

  test('asks for confirmation before deleting a time log and aborts deletion when canceled', async ({
    page,
  }) => {
    await openTimeLogs(page)

    await expect(page.locator('.timelogs-description').first()).toBeVisible()
    const testedLogDescription = await page.locator('.timelogs-description').first().textContent()

    await page.locator('#timelog-rows [id^="timelog-remove-button-"]').first().click()
    await expect(page.locator('.confirmation-dialog')).toContainText(
      'Delete this time log? It cannot be restored.',
    )
    await page.locator('.confirmation-dialog #confirmation-dialog-no-button').click()

    await expect(page.locator('#timelog-rows .timelogs-description').first()).toHaveText(
      testedLogDescription,
    )
    await expect(timeLogRows(page)).toHaveCount(2)
  })

  test('remove a time log, should not display removed time log', async ({ page }) => {
    await openTimeLogs(page)

    await page.locator('#timelog-rows [id^="timelog-remove-button-"]').first().click()

    await expect(page.locator('.confirmation-dialog')).toContainText(
      'Delete this time log? It cannot be restored.',
    )
    await page.locator('.confirmation-dialog #confirmation-dialog-yes-button').click()

    await expect(
      page.locator('.timelogs-description').filter({ hasText: 'test description 2' }),
    ).toHaveCount(0)

    await expect(timeLogRows(page)).toHaveCount(1)
  })

  const invalidInputs = [
    ['input is negative hours', '-01:00', 'negative time', 'Time must be in format HH:MM'],
    ['input is letters', 'aabee', 'letters in time', 'Time must be in format HH:MM'],
    ['input is missing a colon', '0100', 'missing colon', 'Time must be in format HH:MM'],
    ['input has over 60 minutes', '01:61', 'over 60 minutes', 'Time must be in format HH:MM'],
  ]

  for (const [name, time, description, error] of invalidInputs) {
    test(`displays error on time field of form when ${name}`, async ({ page }) => {
      await openTimeLogsByUrl(page)
      await selectDate(page, page.locator('.date input').first(), '2022-01-01')
      await page.locator('#time').fill(time)
      await page.locator('#description').fill(description)
      await page.locator('.submit-button').click()

      await expect(page.locator('.input-container')).toContainText(error)
      await expect(page.locator('#timelog-rows')).not.toContainText(description)
    })
  }

  test('displays error on description field of form when input is under 5 characters long', async ({
    page,
  }) => {
    await openTimeLogsByUrl(page)
    await selectDate(page, page.locator('.date input').first(), '2022-01-01')
    await page.locator('#time').fill('01:00')
    await page.locator('#description').fill('1234')
    await page.locator('.submit-button').click()

    await expect(page.locator('.input-container')).toContainText(
      'Description must be at least 5 characters',
    )
    await expect(page.locator('#timelog-rows')).not.toContainText('1234')
  })

  test('trying to remove sprint with existing time logs displays error', async ({ page }) => {
    await openFromMenu(page, 'Sprint Dashboard')
    await expectHeading(page, 'Add new sprint')

    const removeButtons = page.locator('.sprints-container [id^="sprint-remove-button-"]')
    await removeButtons.last().click()
    await removeButtons.first().click()

    await expect(page.locator('.notification')).toBeAttached()
    await expect(page.locator('[data-testid="notification-message"]')).toContainText(
      'Sprint has time logs, cannot delete.',
    )
  })

  test('remove sprints, should not display sprints or time logs', async ({ page }) => {
    await openTimeLogs(page)

    await page.locator('#timelog-rows [id^="timelog-remove-button-"]').first().click()
    await expect(page.locator('.confirmation-dialog')).toContainText(
      'Delete this time log? It cannot be restored.',
    )
    await page.locator('.confirmation-dialog #confirmation-dialog-yes-button').click()

    await expect(timeLogRows(page)).toHaveCount(1)

    await openFromMenu(page, 'Sprint Dashboard')
    await expectHeading(page, 'Add new sprint')

    const removeButtons = page.locator('.sprints-container [id^="sprint-remove-button-"]')
    for (let count = await removeButtons.count(); count > 0; count--) {
      await removeButtons.first().click()
      await expect(removeButtons).toHaveCount(count - 1)
    }
    await expect(page.locator('#app-content')).not.toContainText('.sprint-list-container')

    await openFromMenu(page, 'Time Log')
    await expect(page.locator('#app-content')).toContainText(
      'Your group has no sprints. Add a sprint using Sprint Dashboard.',
      { timeout: 15000 },
    )
  })

  test.afterAll(async ({ playwright }) => {
    await withRequest(playwright, deleteAllGroups)
  })
})
