import { test, expect } from '../test'
import {
  createGroup,
  createReviewQuestionSet,
  deleteAllGroups,
  deleteAllPeerReviews,
  deleteReviewQuestions,
  loginAsRegisteredUser,
  setPeerReviewOneActive,
} from '../helpers'

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

const numberInput = (page, header) => page.locator(`[data-cy="input_number_${header}"]`)

const submit = (page) => page.getByRole('button', { name: 'Submit' }).click()

test.describe('Answering peer review', () => {
  test.beforeAll(async ({ playwright }) => {
    await withRequest(playwright, async (request) => {
      await deleteReviewQuestions(request)
      await deleteAllGroups(request)
      await deleteAllPeerReviews(request)
      await createGroup(request, {
        name: 'The group of the groups',
        topicId: 1,
        configurationId: 1,
        instructorId: null,
        studentIds: ['012345678', '012345698'],
      })
      await createReviewQuestionSet(request, 'Super nice review questions', [
        {
          type: 'info',
          header: 'This is info',
          description: 'Just fill the form',
        },
        {
          header: 'Previous experiene in software developement',
          description: 'How many hours?',
          type: 'number',
        },
        {
          header: 'Without option?',
          description: '',
          type: 'number',
        },
        {
          header: 'Ok and with option',
          description: 'Choose a radio button you want',
          type: 'radio',
          options: ['Cant say', 'Not at all', 'Little', 'Decent', 'Good', 'Super'],
        },
      ])
      await setPeerReviewOneActive(request, 'Konfiguraatio 1', 1, 'Super nice review questions')
    })
  })

  test.beforeEach(async ({ page }) => {
    await loginAsRegisteredUser(page)
    await page.goto('peerreview')
  })

  test('questions are not fetched before the peer review configuration is known', async ({
    page,
  }) => {
    const requests = []
    page.on('request', (request) => requests.push(request.url()))
    await page.reload()
    await expect(
      page.locator('.peer-review-container').getByText('This is info').first(),
    ).toBeVisible()
    expect(requests.filter((url) => url.includes('/configurations/0/'))).toEqual([])
  })

  test('peer review is open', async ({ page }) => {
    await expect(
      page.locator('.peer-review-container').getByText('This is info').first(),
    ).toBeVisible()
  })

  test('shows an error if none of the fields is filled', async ({ page }) => {
    await submit(page)
    await expect(page.getByText('You must answer all questions').first()).toBeVisible()
  })

  test('shows an error if only one of the fields is filled', async ({ page }) => {
    await numberInput(page, 'Previous experiene in software developement').fill('123')
    await submit(page)
    await expect(page.getByText('You must answer all questions').first()).toBeVisible()
  })

  test('shows an error if not all of the radio button questions is answered', async ({ page }) => {
    await numberInput(page, 'Previous experiene in software developement').fill('123')
    await numberInput(page, 'Without option?').fill('123')
    await page.locator('[name="Ok and with optionTimo *Teppo Tellervo Testaaja"]').nth(3).click()
    await submit(page)
    await expect(page.getByText('You must answer all questions').first()).toBeVisible()
  })

  const fillAnswers = async (page) => {
    await numberInput(page, 'Previous experiene in software developement').fill('123')
    await numberInput(page, 'Without option?').fill('45')
    await page.locator('[name="Ok and with optionTimo *Teppo Tellervo Testaaja"]').nth(2).click()
  }

  const expectAnswersKept = async (page) => {
    await expect(numberInput(page, 'Previous experiene in software developement')).toHaveValue(
      '123',
    )
    await expect(numberInput(page, 'Without option?')).toHaveValue('45')
    await expect(
      page.locator('[name="Ok and with optionTimo *Teppo Tellervo Testaaja"]').nth(2),
    ).toBeChecked()
  }

  test('answers are kept when the page is reloaded', async ({ page }) => {
    await fillAnswers(page)
    await page.reload()
    await expectAnswersKept(page)
  })

  test('answers are kept and an error is shown if the session has expired', async ({ page }) => {
    await fillAnswers(page)
    // an expired Shibboleth session redirects the request, which fails in the browser
    await page.route(/\/api\/peerReview$/i, (route) =>
      route.request().method() === 'POST' ? route.abort() : route.continue(),
    )
    await page.locator('[name="Ok and with optionDonald John Trump"]').nth(5).click()
    await submit(page)

    await expect(page.locator('.notification')).toContainText('Your session has expired')
    await page.unrouteAll()
    await page.reload()
    await expectAnswersKept(page)
    await expect(page.locator('[name="Ok and with optionDonald John Trump"]').nth(5)).toBeChecked()
  })

  test('shows a submit confimation when all field and butotns are filled properly', async ({
    page,
  }) => {
    await numberInput(page, 'Previous experiene in software developement').fill('123')
    await numberInput(page, 'Without option?').fill('123')
    await page.locator('[name="Ok and with optionTimo *Teppo Tellervo Testaaja"]').nth(2).click()
    await page.locator('[name="Ok and with optionDonald John Trump"]').nth(5).click()
    await submit(page)
    await expect(page.getByText('Peer review saved!').first()).toBeVisible()
  })

  test.afterAll(async ({ playwright }) => {
    await withRequest(playwright, async (request) => {
      await deleteAllGroups(request)
      await deleteAllPeerReviews(request)
    })
  })
})
