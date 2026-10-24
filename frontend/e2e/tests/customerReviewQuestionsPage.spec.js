import { test, expect } from '../test'
import {
  createCustomerReviewQuestionSet,
  deleteCustomerReviewQuestions,
  loginAsAdmin,
} from '../helpers'

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

const clearEditingQuestionSetName = (page, selector) =>
  page.locator(selector).locator('.question-set-form__name input').clear()

const clearEditingQuestionSetQuestions = (page, selector) =>
  page.locator(selector).locator(questionsTextarea).clear()

const clearEditingQuestionSetInputs = async (page, selector) => {
  await clearEditingQuestionSetName(page, selector)
  await clearEditingQuestionSetQuestions(page, selector)
}

const saveEditingQuestionSet = (page, questionSetItemSelector) =>
  page.locator(questionSetItemSelector).locator('.question-set-item-editor__save-button').click()

const cancelEditingQuestionSet = (page, selector) =>
  page.locator(selector).locator('.question-set-item-editor__cancel-button').click()

const questionRows = (page) =>
  page.locator('.question-set-item__content .registration-questions-table-row')

const questionSetItems = (page) =>
  page.locator('.customer-review-question-set-list .question-set-item')

const expectContent = async (page, ...texts) => {
  for (const text of texts) {
    await expectContains(page.locator('.question-set-item__content'), text)
  }
}

test.describe('Customer review questions page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await deleteCustomerReviewQuestions(page.request)
  })

  test.describe('Customer review question set creation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('administration/customer-review-questions')
    })

    test('creates a new customer review question set', async ({ page }) => {
      await createQuestionSet(page, 'creview1000', [
        {
          type: 'text',
          header: 'Mitä mieltä tykittelystä?',
          description: 'Vastaa lyhyesti 1000 sanan verran',
        },
      ])

      await expect(page.locator('.notification')).toContainText(
        'Created new customer review question set "creview1000"',
      )
      await expect(questionRows(page)).toHaveCount(1)
      await expect(page.locator('.question-set-item .question-set-item__title')).toHaveText(
        'creview1000',
      )
      const content = page.locator('.question-set-item .question-set-item__content')
      await expectContains(content, 'Mitä mieltä tykittelystä?')
      await expectContains(content, 'Vastaa lyhyesti 1000 sanan verran')
      await expectContains(content, 'text')
      await expect(questionSetItems(page)).toHaveCount(1)
    })

    test('creates questions with options', async ({ page }) => {
      await createQuestionSet(page, 'creview2000', [
        {
          type: 'range',
          header: 'This is header',
          description: 'This is description',
          options: ['pwned', 'owned', "pk'd", 'noob', 'elite', '1337'],
        },
      ])
      await expect(questionRows(page)).toHaveCount(1)
      await expectContent(page, 'This is header', 'This is description', 'range', "pk'd", '1337')
    })

    test('does not allow creation if name is duplicate', async ({ page }) => {
      const questions = [
        {
          type: 'text',
          header: 'Just a text field plz?',
          description: 'Right?',
        },
      ]
      await createQuestionSet(page, 'creview3000', questions)
      await expect(questionSetItems(page)).toHaveCount(1)
      await createQuestionSet(page, 'creview3000', questions)
      await expect(page.locator('.notification')).toContainText('name already in use')
      await expect(questionSetItems(page)).toHaveCount(1)
    })

    test('does not allow creation if JSON is malformed', async ({ page }) => {
      await submitCreationForm(page, 'creview4000', '.-a,1:"#123-')

      await expectContains(page.locator('.question-set-form'), 'Field contains invalid JSON')
      await expect(questionSetItems(page)).toHaveCount(0)
    })
  })

  test.describe('Customer review question set editing', () => {
    test.beforeEach(async ({ page }) => {
      await createCustomerReviewQuestionSet(page.request, 'creview5000', [
        { type: 'text', header: 'foo', description: 'bar' },
      ])
      await page.goto('administration/customer-review-questions')
      await editQuestionSet(page, '.question-set-item')
    })

    test('does not save changes if name is empty', async ({ page }) => {
      await clearEditingQuestionSetName(page, '.question-set-item-editor')
      // "required" attr should prevent submit now
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      await expect(page.locator('.question-set-item-editor')).toBeVisible()
    })

    test('does not save changes if questions is empty', async ({ page }) => {
      await clearEditingQuestionSetQuestions(page, '.question-set-item-editor')
      // "required" attr should prevent submit now
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      await expect(page.locator('.question-set-item-editor')).toBeVisible()
    })

    test('does not save changes if both name and questions are empty', async ({ page }) => {
      await clearEditingQuestionSetInputs(page, '.question-set-item-editor')
      // "required" attr should prevent submit now
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      await expect(page.locator('.question-set-item-editor')).toBeVisible()
    })

    test('shows error if new JSON is invalid', async ({ page }) => {
      await replaceEditingQuestionSetJson(
        page,
        '.question-set-item-editor',
        '..-12.31-23.1-23.asdasc',
      )
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      await expectContains(page.locator('.question-set-form'), 'Field contains invalid JSON')
    })

    test('shows error if new JSON is not an array', async ({ page }) => {
      await replaceEditingQuestionSetJson(page, '.question-set-item-editor', '{"foo":123}')
      await saveEditingQuestionSet(page, '.question-set-item-editor')
      await expectContains(page.locator('.question-set-form'), 'Questions should be an array')
    })

    test('edits name without changing questions', async ({ page }) => {
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'creview1337')
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('creview1337')
      await expect(questionRows(page)).toHaveCount(1)
      await expectContent(page, 'foo', 'bar', 'text')
    })

    test('edits questions without changing name', async ({ page }) => {
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        { header: 'baz', type: 'range' },
      ])
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('creview5000')
      await expect(questionRows(page)).toHaveCount(1)
      await expectContent(page, 'baz', 'range')
    })

    test('does not modify set if cancel is clicked', async ({ page }) => {
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'creview7321')
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        { header: 'baz!', type: 'range' },
      ])
      await cancelEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('creview5000')
      await expect(questionRows(page)).toHaveCount(1)
      await expectContent(page, 'foo', 'bar', 'text')
    })

    test('edits both name and questions correctly', async ({ page }) => {
      await replaceEditingQuestionSetName(page, '.question-set-item-editor', 'creview5001')
      await replaceEditingQuestionSet(page, '.question-set-item-editor', [
        { header: 'asd?', type: 'text' },
        { header: 'das!', type: 'range' },
      ])
      await saveEditingQuestionSet(page, '.question-set-item-editor')

      await expect(page.locator('.question-set-item__title')).toHaveText('creview5001')
      await expect(questionRows(page)).toHaveCount(2)
      await expectContent(page, 'asd?', 'range')
    })
  })
})
