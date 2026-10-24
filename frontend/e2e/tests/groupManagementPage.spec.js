import { test, expect } from '../test'
import { loginAsAdmin } from '../helpers'
import { TEST_ADMIN } from '../common'

// the tests depend on the group created by the first one
test.describe.configure({ mode: 'serial' })

// Ensure Aihe A and Aihe B have topicAccepted emails so they appear in the Topic dropdown.
// topicListPage.spec.js deletes all sent emails, which pollutes subsequent test runs.
const sendAcceptedEmails = async (request) => {
  const login = await request.post('api/login', { headers: TEST_ADMIN.headers })
  const { token } = await login.json()
  const headers = { Authorization: `Bearer ${token}` }

  const { topics } = await (await request.get('api/topics', { headers })).json()
  for (const title of ['Aihe A', 'Aihe B']) {
    const topic = topics.find((t) => t.content.title === title)
    if (topic) {
      // may fail when the email has already been sent
      await request.post('api/email/send', {
        headers,
        data: { messageType: 'topicAccepted', messageLanguage: 'finnish', topicId: topic.id },
      })
    }
  }
}

const selectConfiguration = async (page) => {
  await expect(page.locator('.configuration-selector')).toBeVisible()
  await page.locator('.configuration-selector').click()
  await page.locator('.configuration-1').click()
}

// picks the first option matching the text from a react-select
const selectUser = async (page, container, option, text) => {
  await page.locator(container).click()
  const input = page.locator(`${container} input`)
  await input.pressSequentially(text)
  await expect(page.locator(option).first()).toBeVisible()
  await input.press('Enter')
}

const notification = (page) => page.locator('.notification')

test.describe('Group Management Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await sendAcceptedEmails(page.request)
    await page.goto('administration/groups')
  })

  test.describe('Creating a group', () => {
    test('is successful when all necessary details are provided', async ({ page }) => {
      await selectConfiguration(page)

      await expect(page.locator('.create-group-form-topic__selector')).toBeVisible()
      await page.locator('.create-group-form-topic__selector').click()
      await page.locator('.topic-menu-item', { hasText: 'Aihe A' }).click()
      await page.locator('.create-group-form__name input').fill('Ryhmä A')
      await page
        .locator('.create-group-form__student-input textarea:not([aria-hidden="true"])')
        .fill('012345678, 012345688')

      await selectUser(
        page,
        '.create-group-form__instructor',
        '.create-group-form__instructor__option',
        'Angela',
      )

      await page.locator('.create-group-submit').click()
      await expect(notification(page)).toHaveText('Group saved!')
    })
  })

  test.describe('Viewing a group', () => {
    test.beforeEach(async ({ page }) => {
      await selectConfiguration(page)
    })

    test('deletes a student', async ({ page }) => {
      await page.locator('[data-cy=delete-student-button]').nth(1).click()
      await expect(page.locator('.group-students').first()).not.toContainText('012345688')
      await expect(notification(page)).toHaveText('Student deleted!')
    })

    test('deletes an instructor', async ({ page }) => {
      await page.locator('[data-cy=delete-instructor-button]').first().click()
      await expect(page.locator('.group-instructor').first()).not.toContainText('012345698')
      await expect(page.locator('.group-instructor').first()).toContainText(
        'No instructor assigned',
      )
      await expect(notification(page)).toHaveText('Instructor deleted!')
    })
  })

  test.describe('Editing a group', () => {
    test.beforeEach(async ({ page }) => {
      await selectConfiguration(page)
      await page.locator('[data-cy=edit-group-button]').first().click()
      await expect(notification(page)).toContainText('Editing for group')
      await expect(notification(page)).toContainText('enabled!')
    })

    test('changes group name', async ({ page }) => {
      await page.locator('[data-cy=edit-group-name-field] input').fill('Ryhmä B')
      await page.locator('[data-cy=edit-group-save-button]').click()
      await expect(notification(page)).toHaveText('Group updated!')
      await expect(page.locator('.group-name').first()).toContainText('Ryhmä B')
    })

    test('changes project length', async ({ page }) => {
      await page.locator('[data-cy=edit-project-length-short] input').check()
      await page.locator('[data-cy=edit-group-save-button]').click()
      await expect(notification(page)).toHaveText('Group updated!')

      await page.locator('[data-cy=edit-group-button]').first().click()
      await expect(page.locator('[data-cy=edit-project-length-short] input')).toBeChecked()
    })

    test('changes topic', async ({ page }) => {
      await expect(page.locator('.edit-group-form-topic__selector')).toBeVisible()
      await page.locator('.edit-group-form-topic__selector').click()
      await page.locator('.topic-menu-item', { hasText: 'Aihe B' }).click()
      await page.locator('[data-cy=edit-group-name-field] input').fill('Ryhmä B')
      await page.locator('[data-cy=edit-group-save-button]').click()
      await expect(notification(page)).toHaveText('Group updated!')
      await expect(page.locator('.group-topic').first()).toContainText('Aihe B')
    })

    test('changes instructor', async ({ page }) => {
      await page.locator('.edit-group-instructor').click()
      await page.locator('.edit-group-instructor input').press('Backspace')
      await page.locator('.edit-group-instructor input').pressSequentially('Testaaja')
      await expect(page.locator('.edit-group-instructor__option').first()).toBeVisible()
      await page.locator('.edit-group-instructor input').press('Enter')

      await page.locator('[data-cy=edit-group-save-button]').click()
      await expect(notification(page)).toHaveText('Group updated!')
      await expect(page.locator('.group-instructor').first()).toContainText('012345678')
    })

    test('adds new student', async ({ page }) => {
      const students = page.locator(
        '[data-cy=edit-students-input] textarea:not([aria-hidden="true"])',
      )
      // append to the end of the current students
      await students.click()
      await students.press('ControlOrMeta+End')
      await students.pressSequentially(', 012345698')
      await page.locator('[data-cy=edit-group-save-button]').click()
      await expect(notification(page)).toHaveText('Group updated!')
      await expect(
        page.locator('.group-students').filter({ hasText: '012345698' }).first(),
      ).toBeVisible()
    })

    test('deletes a group', async ({ page }) => {
      await page.locator('[data-cy=edit-group-delete-button]').click()
      await expect(notification(page)).toHaveText('Group deleted!')
    })
  })
})
