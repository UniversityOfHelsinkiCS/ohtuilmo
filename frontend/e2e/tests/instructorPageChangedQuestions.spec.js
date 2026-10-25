import { test, expect } from '../test'
import {
  createGroup,
  createPeerReviews,
  deleteAllGroups,
  deleteAllPeerReviews,
  loginAsAdmin,
} from '../helpers'

const GROUP_NAME = 'Muuttuneet kysymykset'

const answers = (hours, rating, review) => [
  { id: 0, type: 'number', questionHeader: 'Tunnit', answer: hours },
  {
    id: 1,
    type: 'radio',
    questionHeader: 'Arvosana',
    peers: { 'Timo *Teppo Tellervo Testaaja': rating, 'Donald John Trump': rating },
  },
  {
    id: 2,
    type: 'peerReview',
    questionHeader: 'Sanallinen arvio',
    peers: { 'Timo *Teppo Tellervo Testaaja': review, 'Donald John Trump': review },
  },
]

// the question set was changed during the round: an info text was added first
const answersWithInfo = (hours, rating, review) => [
  { id: 0, type: 'info', questionHeader: 'Ohje' },
  ...answers(hours, rating, review).map((answer) => ({ ...answer, id: answer.id + 1 })),
]

const openGroup = async (page) => {
  await page.goto('instructorpage')
  await page.locator('[data-cy=configuration-selector]').click()
  await page.locator('.configuration-menu-item', { hasText: 'Konfiguraatio 1' }).click()
  await page.locator('[data-cy=group-selector]').click()
  await page.locator('.specified-group-menu-item', { hasText: GROUP_NAME }).click()
}

test.describe('Instructor page with changed peer review questions', () => {
  test.beforeAll(async ({ request }) => {
    await deleteAllGroups(request)
    await deleteAllPeerReviews(request)
    await createGroup(request, {
      name: GROUP_NAME,
      topicId: 1,
      configurationId: 1,
      instructorId: null,
      studentIds: ['012345678', '012345698'],
    })
    await createPeerReviews(request, {
      peerReviews: [
        {
          user_id: '012345678',
          configuration_id: 1,
          review_round: 1,
          answer_sheet: answers('11', 3, 'Teppo kirjoitti tämän arvion'),
        },
        {
          user_id: '012345698',
          configuration_id: 1,
          review_round: 1,
          answer_sheet: answersWithInfo('22', 5, 'Donald kirjoitti tämän arvion'),
        },
      ],
    })
  })

  test.afterAll(async ({ request }) => {
    await deleteAllGroups(request)
    await deleteAllPeerReviews(request)
  })

  test('shows the answers of all students by question', async ({ page }) => {
    await loginAsAdmin(page)
    await openGroup(page)

    await expect(page.getByRole('heading', { name: 'Arvosana' })).toBeVisible()
    await expect(page.getByText('11', { exact: true })).toBeVisible()
    await expect(page.getByText('22', { exact: true })).toBeVisible()
    await expect(page.getByText('3.00').first()).toBeVisible()
    await expect(page.getByText('5.00').first()).toBeVisible()
    await expect(page.getByText('Teppo kirjoitti tämän arvion').first()).toBeVisible()
    await expect(page.getByText('Donald kirjoitti tämän arvion').first()).toBeVisible()
  })

  test('shows the answers of all students in the student view', async ({ page }) => {
    await loginAsAdmin(page)
    await openGroup(page)
    await page.getByRole('button', { name: 'Student View' }).click()

    await expect(page.getByText('Reviews for Donald John Trump')).toBeVisible()
    await expect(page.getByText('Teppo kirjoitti tämän arvion').first()).toBeVisible()
    await expect(page.getByText('Donald kirjoitti tämän arvion').first()).toBeVisible()
  })
})
