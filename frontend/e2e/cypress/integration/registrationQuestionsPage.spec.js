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

describe('Registration-questions page', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.deleteRegistrationQuestions()
  })

  describe('Registration question set creation', () => {
    beforeEach(() => {
      cy.visit('/administration/registration-questions')
      cy.get('.registration-questions-page__create-toggle').click()
    })

    it('creates a new registration question set', () => {
      createQuestionSet('k2000', [{ question: 'foo?', type: 'scale' }])

      cy.get('.notification').contains('Created new registration question set "k2000"')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item .question-set-item__title').should('have.text', 'k2000')
      cy.get('.question-set-item .question-set-item__content').contains('foo?')
      cy.get('.question-set-item .question-set-item__content').contains('scale')
      cy.get('.registration-question-set-list').find('.question-set-item').should('have.length', 1)
    })

    it('creates questions of type scale, text and <empty>', () => {
      createQuestionSet('k2000', [
        {
          question: 'This is a title',
        },
        {
          question: 'Rate your yeet 1-5',
          type: 'scale',
        },
        { question: 'Your life story plz', type: 'text' },
      ])

      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        3,
      )
      cy.get('.question-set-item__content').contains('This is a title')
      cy.get('.question-set-item__content').contains('Rate your yeet 1-5')
      cy.get('.question-set-item__content').contains('scale')
      cy.get('.question-set-item__content').contains('Your life story plz')
      cy.get('.question-set-item__content').contains('text')
    })

    it('does not allow creation if name is duplicate', () => {
      createQuestionSet('k2000', [{ question: 'foo?', type: 'scale' }])
      createQuestionSet('k2000', [{ question: 'foo?', type: 'scale' }])

      cy.get('.notification').contains('name already in use')
      cy.get('.registration-question-set-list').find('.question-set-item').should('have.length', 1)
    })

    it('does not allow creation if JSON is malformed', () => {
      submitCreationForm('k3000', '.-a,1:"#123-')

      cy.get('.question-set-form').contains('Field contains invalid JSON')
      cy.get('.registration-question-set-list').find('.question-set-item').should('have.length', 0)
    })
  })

  describe('Registration question set editing', () => {
    beforeEach(() => {
      cy.createRegistrationQuestionSet('k2000', [{ question: 'foo?', type: 'text' }])
      cy.visit('/administration/registration-questions')
      cy.get('.registration-questions-page__create-toggle').click()
    })

    it('does not save changes if both name and questions are empty', () => {
      editQuestionSet('.question-set-item')
      clearEditingQuestionSetInputs('.question-set-item-editor')
      // "required" attr should prevent submit now
      saveEditingQuestionSet('.question-set-item-editor')
      // since the submit was prevented, the component is still
      // .question-set-item-editor and not .question-set-item
      cy.get('.question-set-item-editor')
    })

    it('shows error if new JSON is invalid', () => {
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetJson('.question-set-item-editor', '..-12.31-23.1-23.asdasc')
      saveEditingQuestionSet('.question-set-item-editor')
      cy.get('.question-set-form').contains('Field contains invalid JSON')
    })

    it('shows error if new JSON is not an array', () => {
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetJson('.question-set-item-editor', '{"foo":123}')
      saveEditingQuestionSet('.question-set-item-editor')
      cy.get('.question-set-form').contains('Questions should be an array')
    })

    it('edits name without changing questions', () => {
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetName('.question-set-item-editor', 'k2021')
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'k2021')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('foo?')
    })

    it('edits questions without changing name', () => {
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSet('.question-set-item-editor', [{ question: 'foo!', type: 'text' }])
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'k2000')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('foo!')
      cy.get('.question-set-item__content').contains('text')
    })

    it('does not modify set if cancel is clicked', () => {
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetName('.question-set-item-editor', 'foobar')
      replaceEditingQuestionSet('.question-set-item-editor', [{ question: 'foo!', type: 'text' }])
      cancelEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'k2000')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        1,
      )
      cy.get('.question-set-item__content').contains('foo?')
      cy.get('.question-set-item__content').contains('text')
    })

    it('edits both name and questions correctly', () => {
      editQuestionSet('.question-set-item')
      replaceEditingQuestionSetName('.question-set-item-editor', 'k5555')
      replaceEditingQuestionSet('.question-set-item-editor', [
        { question: 'this is a title' },
        { question: 'this is a scale', type: 'scale' },
      ])
      saveEditingQuestionSet('.question-set-item-editor')

      cy.get('.question-set-item__title').should('have.text', 'k5555')
      cy.get('.question-set-item__content .registration-questions-table-row').should(
        'have.length',
        2,
      )
      cy.get('.question-set-item__content').contains('this is a title')
      cy.get('.question-set-item__content').contains('this is a scale')
    })
  })
})
