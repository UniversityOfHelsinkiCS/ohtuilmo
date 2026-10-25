import { test, expect } from '../test'
import { createGroup, deleteAllGroups, deleteInstructorReviews, loginAsAdmin } from '../helpers'

test.describe.configure({ mode: 'serial' })

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

const initTests = async (request) => {
  await deleteAllGroups(request)
  return createGroup(request, {
    name: 'Tykittelijät',
    topicId: 1,
    configurationId: 1,
    instructorId: '012345688',
    studentIds: ['012345678', '012345698'],
  })
}

const submitInstructorReview = (page) =>
  page.locator('[data-cy="submit-instructor-review-button"]').click()

const textArea = (page, field, index) =>
  page.locator(`[data-cy="textInput-${field} user:${index}"] textarea:not([aria-hidden="true"])`)

const numberInput = (page, field, index) =>
  page.locator(`[data-cy="numberInput-${field} user:${index}"]`)

const answerTextInput = (page, text, index) =>
  textArea(page, 'Vertaisarvion arvosanat ja keskiarvo', index).first().fill(text)

const answerNumberInput = (page, number, index) =>
  numberInput(page, 'Tekninen kontribuutio: arvosana', index).fill(String(number))

const fillRemainingFields = async (page, text, number, index) => {
  const textFieldNames = [
    'Vertaisarvion arvosanat ja keskiarvo',
    'Poimintoja sanallisista vertaisarvioista',
    'Ohjaajan kommentit',
  ]
  const numberFieldNames = [
    'Tekninen kontribuutio: arvosana',
    'Prosessin noudattaminen: arvosana',
    'Prosessin kehittäminen: arvosana',
    'Ryhmätyöskentely: arvosana',
    'Asiakastyöskentely: arvosana',
    'arvosana',
  ]

  for (const field of textFieldNames) {
    for (const textarea of await textArea(page, field, index).all()) {
      await textarea.fill(text)
    }
  }
  for (const field of numberFieldNames) {
    for (const input of await numberInput(page, field, index).all()) {
      await input.fill(String(number))
    }
  }
}

const expectNotification = (page, text) => expect(page.locator('.notification')).toHaveText(text)

const openStudent = (page, name) => page.getByText(name).first().click()

const TEPPO = 'Timo *Teppo Tellervo Testaaja'
const DONALD = 'Donald John Trump'

const studentReview = (page, index) => page.locator(`[data-cy="instructor-review-${index}"]`)

const problems = (page, index) => studentReview(page, index).locator('[data-cy="question-error"]')

// collects the instructor reviews sent to the backend
const sentReviews = (page) => {
  const sent = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\/instructorreview$/i.test(request.url())) {
      sent.push(request)
    }
  })
  return sent
}

test.describe('Instructor review page', () => {
  test.beforeAll(async ({ playwright }) => {
    await withRequest(playwright, initTests)
  })

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await deleteInstructorReviews(page.request)
    // the answer sheet is initialized after the answered groups have been fetched,
    // fields filled before that would be reset
    const answeredGroupsFetched = page.waitForResponse((res) =>
      res.url().includes('getAllAnsweredGroupId'),
    )
    await page.goto('instructorreviewpage')
    await answeredGroupsFetched
    await expect(page.locator('h2', { hasText: 'Donald John Trump' }).first()).toBeVisible()
  })

  test('shows the correct students to give reviews for', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'Timo *Teppo Tellervo Testaaja' })).not.toHaveCount(
      0,
    )
    await expect(page.locator('h2', { hasText: 'Donald John Trump' })).not.toHaveCount(0)
  })

  test('tells what is missing without sending the review', async ({ page }) => {
    const sent = sentReviews(page)
    await submitInstructorReview(page)

    await expect(page).toHaveURL(/\/instructorreviewpage/)
    await expectNotification(page, `Reviews are incomplete: ${TEPPO}, ${DONALD}`)
    // the incomplete reviews are opened and every unanswered question is named
    await expect(problems(page, 0)).toHaveCount(21)
    await expect(problems(page, 1)).toHaveCount(21)
    expect(sent).toHaveLength(0)
  })

  test('tells if a text answer is too short', async ({ page }) => {
    await openStudent(page, TEPPO)
    await fillRemainingFields(page, 'Lorem ipsum', 3, 0)
    await answerTextInput(page, 'foo', 0)

    await submitInstructorReview(page)
    await expect(problems(page, 0)).toHaveCount(1)
    await expect(problems(page, 0)).toHaveText('Write at least 5 characters')
  })

  test('tells if a grade is too high', async ({ page }) => {
    await openStudent(page, TEPPO)
    await fillRemainingFields(page, 'Lorem ipsum', 3, 0)
    await answerNumberInput(page, 6, 0)

    await submitInstructorReview(page)
    await expect(problems(page, 0)).toHaveText('Give a grade between 0 and 5')
  })

  test('tells if a grade is negative', async ({ page }) => {
    await openStudent(page, TEPPO)
    await fillRemainingFields(page, 'Lorem ipsum', 3, 0)
    await answerNumberInput(page, -1, 0)

    await submitInstructorReview(page)
    await expect(problems(page, 0)).toHaveText('Give a grade between 0 and 5')
  })

  test('shows which reviews are complete', async ({ page }) => {
    await expect(studentReview(page, 0).locator('[data-cy="review-incomplete"]')).toBeVisible()
    await expect(studentReview(page, 1).locator('[data-cy="review-incomplete"]')).toBeVisible()

    await openStudent(page, TEPPO)
    await fillRemainingFields(page, 'Lorem ipsum', 4, 0)

    await expect(studentReview(page, 0).locator('[data-cy="review-complete"]')).toBeVisible()
    await expect(studentReview(page, 1).locator('[data-cy="review-incomplete"]')).toBeVisible()
  })

  test('answers are kept when the page is reloaded', async ({ page }) => {
    await openStudent(page, TEPPO)
    await answerTextInput(page, 'Hyvät arvosanat', 0)
    await answerNumberInput(page, 4, 0)

    const answeredGroupsFetched = page.waitForResponse((res) =>
      res.url().includes('getAllAnsweredGroupId'),
    )
    await page.reload()
    await answeredGroupsFetched
    await openStudent(page, TEPPO)

    await expect(textArea(page, 'Vertaisarvion arvosanat ja keskiarvo', 0).first()).toHaveValue(
      'Hyvät arvosanat',
    )
    await expect(numberInput(page, 'Tekninen kontribuutio: arvosana', 0)).toHaveValue('4')
  })

  test('answers are kept and an error is shown if the session has expired', async ({ page }) => {
    await openStudent(page, TEPPO)
    await fillRemainingFields(page, 'Lorem ipsum', 5, 0)
    await openStudent(page, DONALD)
    await fillRemainingFields(page, 'Lorem ipsum', 3, 1)
    // an expired Shibboleth session redirects the request, which fails in the browser
    await page.route(/\/api\/instructorreview$/i, (route) =>
      route.request().method() === 'POST' ? route.abort() : route.continue(),
    )

    await submitInstructorReview(page)
    await expect(page.locator('.notification')).toContainText('Your session has expired')

    await page.unrouteAll()
    await page.reload()
    await openStudent(page, DONALD)
    await expect(numberInput(page, 'Tekninen kontribuutio: arvosana', 1)).toHaveValue('3')
  })

  test('submits instructor review when all fields are filled', async ({ page }) => {
    await openStudent(page, 'Timo *Teppo Tellervo Testaaja')
    await fillRemainingFields(page, 'Lorem ipsum', 5, 0)

    await openStudent(page, 'Donald John Trump')
    await fillRemainingFields(page, 'Lorem ipsum', 3, 1)

    await submitInstructorReview(page)

    await expectNotification(page, 'Instructor review saved!')
    await expect(
      page.getByText('You have reviewed every group you are instructing.').first(),
    ).toBeVisible()
  })

  test.afterAll(async ({ playwright }) => {
    await withRequest(playwright, deleteAllGroups)
  })
})
