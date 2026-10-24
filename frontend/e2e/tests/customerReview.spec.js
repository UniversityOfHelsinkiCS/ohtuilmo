import { test, expect } from '../test'
import {
  createCustomerReviewQuestionSet,
  createGroup,
  deleteAllGroups,
  deleteCustomerReviewQuestions,
  deleteCustomerReviews,
  loginAsAdmin,
  setCustomerReviewQuestionSetToConfiguration,
} from '../helpers'

const newRequestContext = (playwright) =>
  playwright.request.newContext({ baseURL: test.info().project.use.baseURL })

const initTests = async (request) => {
  await deleteCustomerReviewQuestions(request)
  await createCustomerReviewQuestionSet(request, 'Asiakkaan arviosetti 1', [
    {
      type: 'text',
      header: 'Mitä mieltä olit tykittelystä?',
      description: 'Vastaa lyhyesti 5000 merkillä',
    },
    {
      type: 'oneliner',
      header: 'Minne spämmi?',
      description: 'Max 7 päivässä.',
    },
    {
      type: 'number',
      header: 'Monta tuntia viikossa olit yhteydessä tiimiin?',
    },
    {
      type: 'range',
      header: 'Minkä arvosanan antaisit tiimille?',
      description: 'Pienet epätykittelyt on ihan ok',
      options: ['1', '2', '3', '4', '5'],
    },
  ])
  await createGroup(request, {
    name: 'Tykittelijät',
    topicId: 1,
    configurationId: 1,
    instructorId: '012345698',
    studentIds: ['012345678', '012345688'],
  })

  await setCustomerReviewQuestionSetToConfiguration(request, 1)
}

const submitCustomerReview = (page) =>
  page.locator('[data-cy="submit-customer-review-button"]').click()

const answerTextInput = (page, text) =>
  page
    .locator('[data-cy="textInput-Mitä mieltä olit tykittelystä?"]')
    .locator('textarea:not([aria-hidden="true"])')
    .fill(text)

const answerOnelinerInput = (page, text) =>
  page.locator('[data-cy="onelinerInput-Minne spämmi?"]').locator('input').fill(text)

const answerNumberInput = (page, number) =>
  page
    .locator('[data-cy="numberInput-Monta tuntia viikossa olit yhteydessä tiimiin?"]')
    .fill(String(number))

const answerRangeInput = (page, number) =>
  page
    .locator('[data-cy="rangeInput-Minkä arvosanan antaisit tiimille?"]')
    .locator('input')
    .nth(number - 1)
    .click()

const expectNotification = (page, text) => expect(page.locator('.notification')).toHaveText(text)

test.describe('Customer review page', () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await newRequestContext(playwright)
    await initTests(request)
    await request.dispose()
  })

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await deleteCustomerReviews(page.request)
    await page.goto('customer-review/eec0neeT0jo0ae9F')
  })

  test('requires text fields to be filled', async ({ page }) => {
    await submitCustomerReview(page)
    // submit not successfull, still on same page
    await expect(page).toHaveURL(/\/customer-review\/eec0neeT0jo0ae9F/)
    await expect(page.getByText('Customer review').first()).toBeVisible()
  })

  test('shows error when text fields are under 5 characters long', async ({ page }) => {
    await answerTextInput(page, 'foo')
    await answerOnelinerInput(page, 'spammiosoite')
    await submitCustomerReview(page)
    await expectNotification(page, 'Text answers must be over 5 characters long.')
  })

  test('shows error when oneliner fields are under 5 characters long', async ({ page }) => {
    await answerTextInput(
      page,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
    )
    await answerOnelinerInput(page, 'spam')
    await submitCustomerReview(page)
    await expectNotification(page, 'Short text answers must be over 5 characters long.')
  })

  test('shows error when text fields are filled but there are other unfilled fields', async ({
    page,
  }) => {
    await answerTextInput(
      page,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
    )
    await answerOnelinerInput(page, 'spammiosoite')
    await submitCustomerReview(page)
    await expectNotification(page, 'You must answer all questions')
  })

  test('submits customer review when all fields are filled', async ({ page }) => {
    await answerTextInput(
      page,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
    )
    await answerNumberInput(page, 1337)
    await answerRangeInput(page, 3)
    await answerOnelinerInput(page, 'spammittanne@helsinki.foo')
    await submitCustomerReview(page)
    await expectNotification(page, 'Review saved!')
    await expect(page.getByText('Thank you for the review')).toBeVisible()
  })

  test.afterAll(async ({ playwright }) => {
    const request = await newRequestContext(playwright)
    await deleteAllGroups(request)
    await deleteCustomerReviews(request)
    await request.dispose()
  })
})
