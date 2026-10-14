/* global cy describe beforeEach it */
// cy.type supports keystrokes e.g. {enter} sends enter key -> need to escape {
const escapeJsonForCypressType = (json) => json.replace(/\{/g, '{{}')

const submitCreationForm = (name, questionsJson) => {
  cy.get('.question-set-form .question-set-form__name input').type(name)
  cy.get(
    '.question-set-form .question-set-form__questions textarea:not([aria-hidden="true"])',
  ).type(escapeJsonForCypressType(questionsJson))
  cy.get('.question-set-form button[type="submit"]').click()
}

const createQuestionSet = (name, questions) => {
  submitCreationForm(name, JSON.stringify(questions))
}

const editQuestionSet = (questionSetItemSelector) => {
  cy.get(questionSetItemSelector).find('.question-set-item-controls__edit-button').click()
}

const replaceEditingQuestionSetName = (questionSetItemSelector, newName) => {
  cy.get(questionSetItemSelector).find('.question-set-form__name input').clear().type(newName)
}

const replaceEditingQuestionSetJson = (questionSetItemSelector, json) => {
  cy.get(questionSetItemSelector)
    .find('.question-set-form__questions textarea:not([aria-hidden="true"])')
    .clear()
    .type(escapeJsonForCypressType(json))
}

const replaceEditingQuestionSet = (questionSetItemSelector, newQuestions) => {
  replaceEditingQuestionSetJson(questionSetItemSelector, JSON.stringify(newQuestions))
}

const clearEditingQuestionSetInputs = (selector) => {
  cy.get(selector).find('.question-set-form__name input').clear()
  cy.get(selector).find('.question-set-form__questions textarea:not([aria-hidden="true"])').clear()
}

const saveEditingQuestionSet = (questionSetItemSelector) => {
  cy.get(questionSetItemSelector).find('.question-set-item-editor__save-button').click()
}

const cancelEditingQuestionSet = (selector) => {
  cy.get(selector).find('.question-set-item-editor__cancel-button').click()
}

describe('Review-questions page', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.deleteReviewQuestions()
  })

  describe('Review question set creation', () => {
    beforeEach(() => {
      cy.visit('/administration/peer-review-questions')
      cy.get('.peer-review-questions-page__create-toggle').click()
    })

    it('creates a new review question set', () => {
      createQuestionSet('No options tester 1', [
        {
          type: 'radio',
          header: 'Questions without options?',
          description: 'Generate options 1 to 5',
        },
      ])

      cy.get('.notification').contains('Created new peer review question set "No options tester 1"')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item .question-set-item__title').should(
        'have.text',
        'No options tester 1',
      )
      cy.get('.question-set-item .question-set-item__content').contains('Generate options 1 to 5')
      cy.get('.question-set-item .question-set-item__content').contains('radio')
      cy.get('.peer-review-question-set-list').find('.question-set-item').should('have.length', 1)
    })

    it('creates questions set with options', () => {
      createQuestionSet('With options tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'radio',
          options: ['Dont know', 'Not at all', 'Little', 'Decent', 'Much', 'Super'],
        },
      ])

      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('Do we have a right header here?')
      cy.get('.question-set-item__content').contains('I hope we do have a descirption also')
      cy.get('.question-set-item__content').contains('radio')
      cy.get('.question-set-item__content').contains('Dont know')
      cy.get('.question-set-item__content').contains('Super')
    })

    it('does not allow creation if name is duplicate', () => {
      createQuestionSet('Info tester', [
        {
          type: 'info',
          header: 'Just a text field plz?',
          description: 'Right?',
        },
      ])
      createQuestionSet('Info tester', [
        {
          type: 'info',
          header: 'Just a text field plz?',
          description: 'Right?',
        },
      ])
      cy.get('.notification').contains('name already in use')
      cy.get('.peer-review-question-set-list').find('.question-set-item').should('have.length', 1)
    })

    it('does not allow creation if JSON is malformed', () => {
      submitCreationForm('Malformed json', '.-a,1:"#123-')

      cy.get('.question-set-form').contains('Field contains invalid JSON')
      cy.get('.peer-review-question-set-list').find('.question-set-item').should('have.length', 0)
    })
  })

  describe('Review question set editing', () => {
    beforeEach(() => {
      cy.visit('/administration/peer-review-questions')
      cy.get('.peer-review-questions-page__create-toggle').click()
    })

    it('does not save changes if both name and questions are empty', () => {
      createQuestionSet('With options tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'radio',
          options: ['Dont know', 'Not at all', 'Little', 'Decent', 'Much', 'Super'],
        },
      ])
      editQuestionSet('.question-set-item')
      clearEditingQuestionSetInputs('.question-set-item-editor')
      // "required" attr should prevent submit now
      saveEditingQuestionSet('.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      cy.get('.question-set-item-editor')
    })

    it('shows error if new JSON is invalid', () => {
      createQuestionSet('No options tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'radio',
        },
      ])
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetJson('.question-set-item-editor', '..-12.31-23.1-23.asdasc')
      saveEditingQuestionSet('.question-set-item-editor')
      cy.get('.question-set-form').contains('Field contains invalid JSON')
    })

    it('shows error if new JSON is not an array', () => {
      createQuestionSet('Number question tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'number',
        },
      ])
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetJson('.question-set-item-editor', '{"foo":123}')
      saveEditingQuestionSet('.question-set-item-editor')
      cy.get('.question-set-form').contains('Questions should be an array')
    })

    it('edits name without changing questions', () => {
      createQuestionSet('With options tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'radio',
          options: ['Dont know', 'Not at all', 'Little', 'Decent', 'Much', 'Super'],
        },
      ])
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetName('.question-set-item-editor', 'New name')
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'New name')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('Little')
    })

    it('edits questions without changing name', () => {
      createQuestionSet('Number question tester', [
        {
          header: 'Do we have a right header here?',
          description: 'I hope we do have a descirption also',
          type: 'number',
        },
      ])
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSet('.question-set-item-editor', [
        {
          header: 'Nice, edited question',
          description: 'Some edited questions',
          type: 'radio',
        },
      ])
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'Number question tester')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('radio')
    })

    it('does not modify set if cancel is clicked', () => {
      createQuestionSet('Info tester', [
        {
          header: 'Info tester',
          description: 'This is info tester',
          type: 'info',
        },
      ])
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetName('.question-set-item-editor', 'foobar')
      replaceEditingQuestionSet('.question-set-item-editor', [
        {
          header: 'This could be edited but will be canceled..',
          description: 'Is this real?',
          type: 'info',
        },
      ])
      cancelEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'Info tester')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('tester')
      cy.get('.question-set-item__content').contains('info')
    })

    it('edits both name and questions correctly', () => {
      createQuestionSet('Info tester', [
        {
          header: 'Info tester',
          description: 'This is info tester',
          type: 'info',
        },
      ])
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetName('.question-set-item-editor', 'New name 2')
      replaceEditingQuestionSet('.question-set-item-editor', [
        {
          header: 'Radio tester edited',
          description: 'This is now radio tester',
          type: 'radio',
        },
      ])
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'New name 2')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('Radio tester edited')
      cy.get('.question-set-item__content').contains('radio')
    })
  })
})
