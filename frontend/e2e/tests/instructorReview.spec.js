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

  test('requires text fields to be filled', async ({ page }) => {
    await submitInstructorReview(page)
    // submit not successfull, still on same page
    await expect(page).toHaveURL(/\/instructorreviewpage/)
    await expectNotification(page, 'You must answer all questions')
  })

  test('shows error when text fields are under 5 characters long', async ({ page }) => {
    await openStudent(page, 'Timo *Teppo Tellervo Testaaja')
    await answerTextInput(page, 'foo', 0)

    await submitInstructorReview(page)
    await expectNotification(page, 'Text answers must be over 5 characters long.')
  })

  test('shows error when text fields are filled but there are other unfilled fields', async ({
    page,
  }) => {
    await openStudent(page, 'Timo *Teppo Tellervo Testaaja')
    await answerTextInput(
      page,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
      0,
    )

    await submitInstructorReview(page)
    await expectNotification(page, 'You must answer all questions')
  })

  test('shows error when number fields are filled but are higher than 5', async ({ page }) => {
    await openStudent(page, 'Timo *Teppo Tellervo Testaaja')
    await fillRemainingFields(page, 'Lorem ipsum', 3, 0)
    await answerNumberInput(page, 6, 0)

    await openStudent(page, 'Donald John Trump')
    await fillRemainingFields(page, 'Lorem ipsum', 3, 1)

    await submitInstructorReview(page)
    await expectNotification(page, 'Grade can not be over 5.')
  })

  test('shows error when number fields are filled but are lower than 5', async ({ page }) => {
    await openStudent(page, 'Timo *Teppo Tellervo Testaaja')

    await fillRemainingFields(page, 'Lorem ipsum', 3, 0)
    await answerNumberInput(page, -1, 0)

    await openStudent(page, 'Donald John Trump')
    await fillRemainingFields(page, 'Lorem ipsum', 3, 1)

    await submitInstructorReview(page)
    await expectNotification(page, 'Number answer can not be negative')
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
