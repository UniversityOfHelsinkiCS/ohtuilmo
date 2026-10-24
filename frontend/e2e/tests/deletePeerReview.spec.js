import { test, expect } from '../test'
import {
  createGroup,
  createPeerReviews,
  deleteAllGroups,
  deleteAllPeerReviews,
  loginAsAdmin,
  loginAsInstructor,
  requestAs,
} from '../helpers'
import { TEST_ADMIN, TEST_INSTRUCTOR } from '../common'

const GROUP_NAME = 'Poistettavat'

const peerReviewOf = (studentNumber) => ({
  user_id: studentNumber,
  configuration_id: 1,
  review_round: 1,
  answer_sheet: [{ id: 0, type: 'number', answer: '3', questionHeader: 'Arvosana' }],
})

const peerReviewCount = async (request) => {
  const { body } = await requestAs(request, TEST_ADMIN, { url: 'api/peerreview/all' })
  return body.length
}

const openGroup = async (page) => {
  await page.goto('instructorpage')
  await page.locator('[data-cy=configuration-selector]').click()
  await page.locator('.configuration-menu-item', { hasText: 'Konfiguraatio 1' }).click()
  await page.locator('[data-cy=group-selector]').click()
  await page.locator('.specified-group-menu-item', { hasText: GROUP_NAME }).click()
}

const deleteButton = (page, name) =>
  page.locator('[data-cy="delete-peer-review"]', { hasText: name })

const dialog = (page) => page.locator('[data-cy="delete-peer-review-dialog"]')
const confirmButton = (page) => dialog(page).getByRole('button', { name: 'Delete permanently' })

test.describe('Deleting a peer review', () => {
  test.beforeEach(async ({ request }) => {
    await deleteAllGroups(request)
    await deleteAllPeerReviews(request)
    // logging in creates the instructor user
    await requestAs(request, TEST_INSTRUCTOR, { url: 'api/groups' })
    await createGroup(request, {
      name: GROUP_NAME,
      topicId: 1,
      configurationId: 1,
      instructorId: TEST_INSTRUCTOR.headers.hypersonstudentid,
      studentIds: ['012345678', '012345698'],
    })
    await createPeerReviews(request, {
      peerReviews: [peerReviewOf('012345678'), peerReviewOf('012345698')],
    })
  })

  test.afterAll(async ({ request }) => {
    await deleteAllGroups(request)
    await deleteAllPeerReviews(request)
  })

  test('admin deletes a review after typing the name of the student', async ({ page, request }) => {
    await loginAsAdmin(page)
    await openGroup(page)

    await deleteButton(page, 'Donald Trump').click()
    await expect(dialog(page)).toContainText('Donald Trump')
    await expect(confirmButton(page)).toBeDisabled()

    await dialog(page).getByLabel("Student's name").fill('Donald')
    await expect(confirmButton(page)).toBeDisabled()

    await dialog(page).getByLabel("Student's name").fill('Donald Trump')
    await confirmButton(page).click()

    await expect(page.locator('.notification')).toContainText('Peer review deleted')
    await expect(deleteButton(page, 'Donald Trump')).toHaveCount(0)
    await expect(deleteButton(page, 'Teppo Testaaja')).toBeVisible()
    expect(await peerReviewCount(request)).toBe(1)
  })

  test('cancelling keeps the review', async ({ page, request }) => {
    await loginAsAdmin(page)
    await openGroup(page)

    await deleteButton(page, 'Donald Trump').click()
    await dialog(page).getByLabel("Student's name").fill('Donald Trump')
    await dialog(page).getByRole('button', { name: 'Cancel' }).click()

    await expect(dialog(page)).toHaveCount(0)
    await expect(deleteButton(page, 'Donald Trump')).toBeVisible()
    expect(await peerReviewCount(request)).toBe(2)
  })

  test('instructor can not delete reviews', async ({ page }) => {
    await loginAsInstructor(page)
    await openGroup(page)

    await expect(page.getByText('Peer Reviews').first()).toBeVisible()
    await expect(page.locator('[data-cy="delete-peer-review"]')).toHaveCount(0)
  })
})
