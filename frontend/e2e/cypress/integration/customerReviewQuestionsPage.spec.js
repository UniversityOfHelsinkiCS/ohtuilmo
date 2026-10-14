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

const clearEditingQuestionSetName = (selector) => {
  cy.get(selector).find('.question-set-form__name input').clear()
}

const clearEditingQuestionSetQuestions = (selector) => {
  cy.get(selector).find('.question-set-form__questions textarea:not([aria-hidden="true"])').clear()
}

const saveEditingQuestionSet = (questionSetItemSelector) => {
  cy.get(questionSetItemSelector).find('.question-set-item-editor__save-button').click()
}

const cancelEditingQuestionSet = (selector) => {
  cy.get(selector).find('.question-set-item-editor__cancel-button').click()
}

describe('Customer review questions page', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.deleteCustomerReviewQuestions()
  })

  describe('Customer review question set creation', () => {
    beforeEach(() => {
      cy.visit('/administration/customer-review-questions')
    })

    it('creates a new customer review question set', () => {
      createQuestionSet('creview1000', [
        {
          type: 'text',
          header: 'Mitä mieltä tykittelystä?',
          description: 'Vastaa lyhyesti 1000 sanan verran',
        },
      ])

      cy.get('.notification').contains('Created new customer review question set "creview1000"')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item .question-set-item__title').should('have.text', 'creview1000')
      cy.get('.question-set-item .question-set-item__content').contains('Mitä mieltä tykittelystä?')
      cy.get('.question-set-item .question-set-item__content').contains(
        'Vastaa lyhyesti 1000 sanan verran',
      )
      cy.get('.question-set-item .question-set-item__content').contains('text')
      cy.get('.customer-review-question-set-list')
        .find('.question-set-item')
        .should('have.length', 1)
    })

    it('creates questions with options', () => {
      createQuestionSet('creview2000', [
        {
          type: 'range',
          header: 'This is header',
          description: 'This is description',
          options: ['pwned', 'owned', "pk'd", 'noob', 'elite', '1337'],
        },
      ])
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('This is header')
      cy.get('.question-set-item__content').contains('This is description')
      cy.get('.question-set-item__content').contains('range')
      cy.get('.question-set-item__content').contains("pk'd")
      cy.get('.question-set-item__content').contains('1337')
    })

    it('does not allow creation if name is duplicate', () => {
      createQuestionSet('creview3000', [
        {
          type: 'text',
          header: 'Just a text field plz?',
          description: 'Right?',
        },
      ])
      createQuestionSet('creview3000', [
        {
          type: 'text',
          header: 'Just a text field plz?',
          description: 'Right?',
        },
      ])
      cy.get('.notification').contains('name already in use')
      cy.get('.customer-review-question-set-list')
        .find('.question-set-item')
        .should('have.length', 1)
    })

    it('does not allow creation if JSON is malformed', () => {
      submitCreationForm('creview4000', '.-a,1:"#123-')

      cy.get('.question-set-form').contains('Field contains invalid JSON')
      cy.get('.customer-review-question-set-list')
        .find('.question-set-item')
        .should('have.length', 0)
    })
  })

  describe('Customer review question set editing', () => {
    beforeEach(() => {
      cy.createCustomerReviewQuestionSet('creview5000', [
        { type: 'text', header: 'foo', description: 'bar' },
      ])
      cy.visit('/administration/customer-review-questions')
      editQuestionSet('.question-set-item')
    })

    it('does not save changes if name is empty', () => {
      clearEditingQuestionSetName('.question-set-item-editor')
      // "required" attr should prevent submit now
      saveEditingQuestionSet('.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      cy.get('.question-set-item-editor')
    })

    it('does not save changes if questions is empty', () => {
      clearEditingQuestionSetQuestions('.question-set-item-editor')
      // "required" attr should prevent submit now
      saveEditingQuestionSet('.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      cy.get('.question-set-item-editor')
    })

    it('does not save changes if both name and questions are empty', () => {
      clearEditingQuestionSetInputs('.question-set-item-editor')
      // "required" attr should prevent submit now
      saveEditingQuestionSet('.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      cy.get('.question-set-item-editor')
    })

    it('shows error if new JSON is invalid', () => {
      replaceEditingQuestionSetJson('.question-set-item-editor', '..-12.31-23.1-23.asdasc')
      saveEditingQuestionSet('.question-set-item-editor')
      cy.get('.question-set-form').contains('Field contains invalid JSON')
    })

    it('shows error if new JSON is not an array', () => {
      replaceEditingQuestionSetJson('.question-set-item-editor', '{"foo":123}')
      saveEditingQuestionSet('.question-set-item-editor')
      cy.get('.question-set-form').contains('Questions should be an array')
    })

    it('edits name without changing questions', () => {
      replaceEditingQuestionSetName('.question-set-item-editor', 'creview1337')
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'creview1337')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('foo')
      cy.get('.question-set-item__content').contains('bar')
      cy.get('.question-set-item__content').contains('text')
    })

    it('edits questions without changing name', () => {
      replaceEditingQuestionSet('.question-set-item-editor', [{ header: 'baz', type: 'range' }])
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'creview5000')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('baz')
      cy.get('.question-set-item__content').contains('range')
    })

    it('does not modify set if cancel is clicked', () => {
      replaceEditingQuestionSetName('.question-set-item-editor', 'creview7321')
      replaceEditingQuestionSet('.question-set-item-editor', [{ header: 'baz!', type: 'range' }])
      cancelEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'creview5000')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('foo')
      cy.get('.question-set-item__content').contains('bar')
      cy.get('.question-set-item__content').contains('text')
    })

    it('edits both name and questions correctly', () => {
      replaceEditingQuestionSetName('.question-set-item-editor', 'creview5001')
      replaceEditingQuestionSet('.question-set-item-editor', [
        { header: 'asd?', type: 'text' },
        { header: 'das!', type: 'range' },
      ])
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'creview5001')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        2,
      )
      cy.get('.question-set-item__content').contains('asd?')
      cy.get('.question-set-item__content').contains('range')
    })
  })
})
