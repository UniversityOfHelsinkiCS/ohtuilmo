import { test, expect } from '../test'
import { loginAsAdmin, deleteReviewQuestions, createReviewQuestionSet } from '../helpers'

test.describe('Review-questions page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await deleteReviewQuestions(page.request)
    await createReviewQuestionSet(page.request, 'Super nice review questions', [
      {
        type: 'info',
        header: 'This is info',
        description: 'Just fill the form',
      },
      {
        header: 'Previous experiene in software developemnt',
        description: 'How many hours?',
        type: 'number',
      },
      {
        header: 'Without option?',
        description: '',
        type: 'number',
      },
      {
        header: 'Peer review for group members',
        description: 'Separate review for each member of the group',
        type: 'peerReview',
      },
      {
        header: 'Ok and with option',
        description: 'Choose a radio button you want',
        type: 'radio',
        options: ['Cant say', 'Not at all', 'Little', 'Decent', 'Good', 'Super'],
      },
    ])

    await page.goto('administration/configuration')
  })

  const selectReviewQuestionSet = async (page) => {
    await page.locator('[data-cy=expansion-review-questions-1]').click()
    await page.locator('[data-cy=change-review-questions-1]').click()
    await page.locator('[data-cy=select-review-questions-1]').click()
    await page.locator('[data-cy=menu-item-review-questions-1]').click()
  }

  test('is on adminstration page', async ({ page }) => {
    await expect(
      page.locator('.admin-page-container').getByText('Change configuration').first(),
    ).toBeVisible()
  })

  test('new review question set is visible for round 1', async ({ page }) => {
    await selectReviewQuestionSet(page)
    await expect(
      page.locator('.admin-page-container').getByText('Super nice review questions').first(),
    ).toBeVisible()
  })

  test('new review question is shown when it is selected', async ({ page }) => {
    await selectReviewQuestionSet(page)
    await expect(
      page.locator('.admin-page-container').getByText('This is info').first(),
    ).toBeVisible()
  })
})
