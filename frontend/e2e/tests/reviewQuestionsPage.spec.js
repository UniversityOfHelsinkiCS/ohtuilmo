import { test, expect } from '../test'
import { deleteReviewQuestions, loginAsAdmin } from '../helpers'

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// like cy.contains: some element of the locator contains the text (case-sensitive)
const expectContains = (locator, text) =>
  expect(locator.filter({ hasText: new RegExp(escapeRegExp(text)) }).first()).toBeVisible()

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

const questionRows = (page) =>
  page.locator('.question-set-item__content .registration-questions-table-row')

const questionSetItems = (page) => page.locator('.peer-review-question-set-list .question-set-item')

test.describe('Review-questions page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await deleteReviewQuestions(page.request)
  })

  test.describe('Review question set creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('administration/peer-review-questions')
      await page.locator('.peer-review-questions-page__create-toggle').click()
    })

    test('creates a new review question set', async ({ page }) => {
      await createQuestionSet(page, 'No options tester 1', [
        {
          type: 'radio',
          header: 'Questions without options?',
          description: 'Generate options 1 to 5',
        },
      ])

      await expect(page.locator('.notification')).toContainText(
        'Created new peer review question set "No options tester 1"',
      )
      await expect(questionRows(page)).toHaveCount(1)
      await expect(page.locator('.question-set-item .question-set-item__title')).toHaveText(
        'No options tester 1',
      )
      const content = page.locator('.question-set-item .question-set-item__content')
      await expectContains(content, 'Generate options 1 to 5')
      await expectContains(content, 'radio')
      await expect(questionSetItems(page)).toHaveCount(1)
    })

    test('creates questions set with options', async ({ page }) => {
      await createQuestionSet(page, 'With options tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'radio',
          options: ['Dont know', 'Not at all', 'Little', 'Decent', 'Much', 'Super'],
        },
      ])

      await expect(questionRows(page)).toHaveCount(1)
      const content = page.locator('.question-set-item__content')
      await expectContains(content, 'Do we have a right header here?')
      await expectContains(content, 'I hope we do have a descirption also')
      await expectContains(content, 'radio')
      await expectContains(content, 'Dont know')
      await expectContains(content, 'Super')
    })

    test('does not allow creation if name is duplicate', async ({ page }) => {
      const questions = [
        {
          type: 'info',
          header: 'Just a text field plz?',
          description: 'Right?',
        },
      ]
      await createQuestionSet(page, 'Info tester', questions)
      await expect(questionSetItems(page)).toHaveCount(1)
      await createQuestionSet(page, 'Info tester', questions)
      await expect(page.locator('.notification')).toContainText('name already in use')
      await expect(questionSetItems(page)).toHaveCount(1)
    })

    test('does not allow creation if JSON is malformed', async ({ page }) => {
      await submitCreationForm(page, 'Malformed json', '.-a,1:"#123-')

      await expectContains(page.locator('.question-set-form'), 'Field contains invalid JSON')
      await expect(questionSetItems(page)).toHaveCount(0)
    })
  })

  test.describe('Review question set editing', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('administration/peer-review-questions')
      await page.locator('.peer-review-questions-page__create-toggle').click()
    })

    test('does not save changes if both name and questions are empty', async ({ page }) => {
      await createQuestionSet(page, 'With options tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'radio',
          options: ['Dont know', 'Not at all', 'Little', 'Decent', 'Much', 'Super'],
        },
      ])
      await editQuestionSet(page, '.question-set-item')
      await clearEditingQuestionSetInputs(page, '.question-set-item-editor')
      // "required" attr should prevent submit now
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      await expect(page.locator('.question-set-item-editor')).toBeVisible()
    })

    test('shows error if new JSON is invalid', async ({ page }) => {
      await createQuestionSet(page, 'No options tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'radio',
        },
      ])
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetJson(
        page,
        '.question-set-item-editor',
        '..-12.31-23.1-23.asdasc',
      )
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      await expectContains(page.locator('.question-set-form'), 'Field contains invalid JSON')
    })

    test('shows error if new JSON is not an array', async ({ page }) => {
      await createQuestionSet(page, 'Number question tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'number',
        },
      ])
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetJson(page, '.question-set-item-editor', '{"foo":123}')
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      await expectContains(page.locator('.question-set-form'), 'Questions should be an array')
    })

    test('edits name without changing questions', async ({ page }) => {
      await createQuestionSet(page, 'With options tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'radio',
          options: ['Dont know', 'Not at all', 'Little', 'Decent', 'Much', 'Super'],
        },
      ])
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'New name')
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('New name')
      await expect(questionRows(page)).toHaveCount(1)
      await expectContains(page.locator('.question-set-item__content'), 'Little')
    })

    test('edits questions without changing name', async ({ page }) => {
      await createQuestionSet(page, 'Number question tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'number',
        },
      ])
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        {
          header: 'Nice, edited question',
          description: 'Some edited questions',
          type: 'radio',
        },
      ])
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('Number question tester')
      await expect(questionRows(page)).toHaveCount(1)
      await expectContains(page.locator('.question-set-item__content'), 'radio')
    })

    test('does not modify set if cancel is clicked', async ({ page }) => {
      await createQuestionSet(page, 'Info tester', [
        {
          header: 'Info tester',
          description: 'This is info tester',
          type: 'info',
        },
      ])
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'foobar')
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        {
          header: 'This could be edited but will be canceled..',
          description: 'Is this real?',
          type: 'info',
        },
      ])
      await cancelEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('Info tester')
      await expect(questionRows(page)).toHaveCount(1)
      await expectContains(page.locator('.question-set-item__content'), 'tester')
      await expectContains(page.locator('.question-set-item__content'), 'info')
    })

    test('edits both name and questions correctly', async ({ page }) => {
      await createQuestionSet(page, 'Info tester', [
        {
          header: 'Info tester',
          description: 'This is info tester',
          type: 'info',
        },
      ])
      await editQuestionSet(page, '.question-set-item')
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'New name 2')
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        {
          header: 'Radio tester edited',
          description: 'This is now radio tester',
          type: 'radio',
        },
      ])
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('New name 2')
      await expect(questionRows(page)).toHaveCount(1)
      await expectContains(page.locator('.question-set-item__content'), 'Radio tester edited')
      await expectContains(page.locator('.question-set-item__content'), 'radio')
    })
  })
})
