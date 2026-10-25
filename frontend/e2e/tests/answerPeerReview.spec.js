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

const radio = (page, member, option) =>
  page.locator(`[name="Ok and with option${member}"]`).nth(option)

const peerText = (page, name) =>
  page
    .locator('.peer-review-box__text-field-container', { hasText: name })
    .locator('textarea:not([aria-hidden="true"])')

const questionError = (page, header) =>
  page.locator('.peer-review-box', { hasText: header }).locator('[data-cy="question-error"]')

// collects the peer reviews sent to the backend
const sentReviews = (page) => {
  const sent = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\/peerReview$/i.test(request.url())) {
      sent.push(request)
    }
  })
  return sent
}

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
        {
          header: 'Technical contribution',
          description: 'Describe the contribution of each member',
          type: 'peerReview',
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

  test('question headers and descriptions are aligned left', async ({ page }) => {
    const box = page.locator('.peer-review-box', { hasText: 'How many hours?' })
    await expect(box.locator('h3')).toHaveCSS('text-align', 'left')
    await expect(box.getByText('How many hours?')).toHaveCSS('text-align', 'left')
  })

  test('peer review is open', async ({ page }) => {
    await expect(
      page.locator('.peer-review-container').getByText('This is info').first(),
    ).toBeVisible()
  })

  test('tells what is missing without sending the answers', async ({ page }) => {
    const sent = sentReviews(page)
    await submit(page)

    await expect(questionError(page, 'Ok and with option')).toHaveText(
      'Choose an option for Teppo Testaaja, Donald Trump',
    )
    await expect(questionError(page, 'Technical contribution')).toHaveText(
      'Write at least 7 characters about Teppo Testaaja, Donald Trump',
    )
    await expect(page.locator('.notification')).toContainText(
      'Answers are missing: Ok and with option, Technical contribution',
    )
    expect(sent).toHaveLength(0)
  })

  test('tells which members are missing an answer', async ({ page }) => {
    await radio(page, 'Timo *Teppo Tellervo Testaaja', 3).click()
    await peerText(page, 'Teppo Testaaja').fill('Did a lot of work')
    await peerText(page, 'Donald Trump').fill('Short')
    await submit(page)

    await expect(questionError(page, 'Ok and with option')).toHaveText(
      'Choose an option for Donald Trump',
    )
    await expect(questionError(page, 'Technical contribution')).toHaveText(
      'Write at least 7 characters about Donald Trump',
    )
  })

  test('tells if a number is not valid', async ({ page }) => {
    await numberInput(page, 'Without option?').fill('-1')
    await submit(page)

    await expect(questionError(page, 'Without option?')).toHaveText(
      'Give a number between 0 and 100000',
    )
  })

  test('removes the messages when the answers are fixed', async ({ page }) => {
    await submit(page)
    await expect(questionError(page, 'Ok and with option')).toBeVisible()

    await radio(page, 'Timo *Teppo Tellervo Testaaja', 2).click()
    await radio(page, 'Donald John Trump', 5).click()

    await expect(questionError(page, 'Ok and with option')).toHaveCount(0)
    await expect(questionError(page, 'Technical contribution')).toBeVisible()
  })

  const fillAnswers = async (page) => {
    await numberInput(page, 'Previous experiene in software developement').fill('123')
    await numberInput(page, 'Without option?').fill('45')
    await page.locator('[name="Ok and with optionTimo *Teppo Tellervo Testaaja"]').nth(2).click()
    await peerText(page, 'Teppo Testaaja').fill('Wrote most of the backend')
    await peerText(page, 'Donald Trump').fill('Made the user interface')
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
    await peerText(page, 'Teppo Testaaja').fill('Wrote most of the backend')
    await peerText(page, 'Donald Trump').fill('Made the user interface')
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
