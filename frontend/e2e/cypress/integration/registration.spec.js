/* global cy describe it */

// a new student for every run, registrations can not be removed
const newStudent = () => {
  const studentNumber = '09' + Date.now().toString().slice(-7)
  return {
    headers: {
      uid: `student${studentNumber}`,
      givenname: 'Rekka',
      mail: '',
      hypersonstudentid: studentNumber,
      sn: 'Registrant' + studentNumber,
    },
  }
}

const register = (student, email) => {
  cy.loginAs(student)
  cy.visit('/register')

  cy.contains('Vakuutan että esitiedot on suoritettu projektin alkuun mennessä').click()
  cy.get('input[type=email]').type(email)

  // answer the text questions of the registration, if there are any
  cy.get('.registration-form').then((form) => {
    const answers = form.find('textarea[placeholder="Answer"]:not([aria-hidden="true"])')
    for (const answer of answers) {
      cy.wrap(answer).type('My answer')
    }
  })

  cy.contains('label', 'olen tutustunut projektin arvosteluperusteisiin').click()
  cy.contains('label', 'sitoudun työskentelemään koko projektin ajan tasaisesti').click()
  // the same confirmation is asked also at the start of the form
  cy.get('label').filter(':contains("Vakuutan että esitiedot on suoritettu")').last().click()

  cy.contains('button', 'Submit your registration').click()
  cy.contains('Registration submitted')
}

describe('Student registration', () => {
  it('a student can register to the project and sees the registration', () => {
    const student = newStudent()
    register(student, 'rekka@example.com')

    cy.visit('/register')
    cy.contains('You have already registered to current project.')

    cy.visit('/registrationdetails')
    cy.contains('Rekka')
    cy.contains('rekka@example.com')
  })

  it('an admin sees the new registration', () => {
    const student = newStudent()
    register(student, 'admin-sees@example.com')

    cy.loginAsAdmin()
    cy.visit('/administration/registrations')
    cy.contains(student.headers.sn)
  })
})
