import { test, expect } from '../test'
import {
  createRegistrationQuestionSet,
  deleteRegistrationQuestions,
  loginAsAdmin,
} from '../helpers'

const questionsTextarea = '.question-set-form__questions textarea:not([aria-hidden="true"])'

const submitCreationForm = async (page, name, questionsJson) => {
  await page.locator('.question-set-form .question-set-form__name input').fill(name)
  await page.locator(`.question-set-form ${questionsTextarea}`).fill(questionsJson)
  await page.locator('.question-set-form button[type="submit"]').click()
}

const createQuestionSet = (page, name, questions) =>
  submitCreationForm(page, name, JSON.stringify(questions))

const editQuestionSet = (page, questionSetItemSelector) =>
  page.locator(questionSetItemSelector).locator('.question-set-item-controls__edit-button').click()

const replaceEditingQuestionSetName = (page, questionSetItemSelector, newName) =>
  page.locator(questionSetItemSelector).locator('.question-set-form__name input').fill(newName)

const replaceEditingQuestionSetJson = (page, questionSetItemSelector, json) =>
  page.locator(questionSetItemSelector).locator(questionsTextarea).fill(json)

const replaceEditingQuestionSet = (page, questionSetItemSelector, newQuestions) =>
  replaceEditingQuestionSetJson(page, questionSetItemSelector, JSON.stringify(newQuestions))

const clearEditingQuestionSetInputs = async (page, selector) => {
  await page.locator(selector).locator('.question-set-form__name input').clear()
  await page.locator(selector).locator(questionsTextarea).clear()
}

const saveEditingQuestionSet = (page, questionSetItemSelector) =>
  page.locator(questionSetItemSelector).locator('.question-set-item-editor__save-button').click()

const cancelEditingQuestionSet = (page, selector) =>
  page.locator(selector).locator('.question-set-item-editor__cancel-button').click()

const tableRows = (page) =>
  page.locator('.question-set-item__content .registration-questions-table-row')

test.describe('Registration-questions page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await deleteRegistrationQuestions(page.request)
  })

  test.describe('Registration question set creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('administration/registration-questions')
      await page.locator('.registration-questions-page__create-toggle').click()
    })

    test('creates a new registration question set', async ({ page }) => {
      await createQuestionSet(page, 'k2000', [{ question: 'foo?', type: 'scale' }])

      await expect(page.locator('.notification')).toContainText(
        'Created new registration question set "k2000"',
      )
      await expect(tableRows(page)).toHaveCount(1)
      await expect(page.locator('.question-set-item .question-set-item__title')).toHaveText('k2000')
      const content = page.locator('.question-set-item .question-set-item__content')
      await expect(content).toContainText('foo?')
      await expect(content).toContainText('scale')
      await expect(
        page.locator('.registration-question-set-list').locator('.question-set-item'),
      ).toHaveCount(1)
    })

    test('creates questions of type scale, text and <empty>', async ({ page }) => {
      await createQuestionSet(page, 'k2000', [
        {
          question: 'This is a title',
        },
        {
          question: 'Rate your yeet 1-5',
          type: 'scale',
        },
        { question: 'Your life story plz', type: 'text' },
      ])

      await expect(tableRows(page)).toHaveCount(3)
      const content = page.locator('.question-set-item__content')
      await expect(content).toContainText('This is a title')
      await expect(content).toContainText('Rate your yeet 1-5')
      await expect(content).toContainText('scale')
      await expect(content).toContainText('Your life story plz')
      await expect(content).toContainText('text')
    })

    test('does not allow creation if name is duplicate', async ({ page }) => {
      await createQuestionSet(page, 'k2000', [{ question: 'foo?', type: 'scale' }])
      await expect(page.locator('.notification')).toContainText(
        'Created new registration question set "k2000"',
      )
      await createQuestionSet(page, 'k2000', [{ question: 'foo?', type: 'scale' }])

      await expect(page.locator('.notification')).toContainText('name already in use')
      await expect(
        page.locator('.registration-question-set-list').locator('.question-set-item'),
      ).toHaveCount(1)
    })

    test('does not allow creation if JSON is malformed', async ({ page }) => {
      await submitCreationForm(page, 'k3000', '.-a,1:"#123-')

      await expect(page.locator('.question-set-form')).toContainText('Field contains invalid JSON')
      await expect(
        page.locator('.registration-question-set-list').locator('.question-set-item'),
      ).toHaveCount(0)
    })
  })

  test.describe('Registration question set editing', () => {
    test.beforeEach(async ({ page }) => {
      await createRegistrationQuestionSet(page.request, 'k2000', [
        { question: 'foo?', type: 'text' },
      ])
      await page.goto('administration/registration-questions')
      await page.locator('.registration-questions-page__create-toggle').click()
    })

    test('does not save changes if both name and questions are empty', async ({ page }) => {
      await editQuestionSet(page, '.question-set-item')
      await clearEditingQuestionSetInputs(page, '.question-set-item-editor')
      // "required" attr should prevent submit now
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      await expect(page.locator('.question-set-item-editor')).toBeVisible()
    })

    test('shows error if new JSON is invalid', async ({ page }) => {
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetJson(
        page,
        '.question-set-item-editor',
        '..-12.31-23.1-23.asdasc',
      )
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      await expect(page.locator('.question-set-item-editor')).toContainText(
        'Field contains invalid JSON',
      )
    })

    test('shows error if new JSON is not an array', async ({ page }) => {
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetJson(page, '.question-set-item-editor', '{"foo":123}')
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      await expect(page.locator('.question-set-item-editor')).toContainText(
        'Questions should be an array',
      )
    })

    test('edits name without changing questions', async ({ page }) => {
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'k2021')
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('k2021')
      await expect(tableRows(page)).toHaveCount(1)
      await expect(page.locator('.question-set-item__content')).toContainText('foo?')
    })

    test('edits questions without changing name', async ({ page }) => {
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        { question: 'foo!', type: 'text' },
      ])
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('k2000')
      await expect(tableRows(page)).toHaveCount(1)
      await expect(page.locator('.question-set-item__content')).toContainText('foo!')
      await expect(page.locator('.question-set-item__content')).toContainText('text')
    })

    test('does not modify set if cancel is clicked', async ({ page }) => {
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'foobar')
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        { question: 'foo!', type: 'text' },
      ])
      await cancelEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('k2000')
      await expect(tableRows(page)).toHaveCount(1)
      await expect(page.locator('.question-set-item__content')).toContainText('foo?')
      await expect(page.locator('.question-set-item__content')).toContainText('text')
    })

    test('edits both name and questions correctly', async ({ page }) => {
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'k5555')
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        { question: 'this is a title' },
        { question: 'this is a scale', type: 'scale' },
      ])
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('k5555')
      await expect(tableRows(page)).toHaveCount(2)
      await expect(page.locator('.question-set-item__content')).toContainText('this is a title')
      await expect(page.locator('.question-set-item__content')).toContainText('this is a scale')
    })
  })
})
