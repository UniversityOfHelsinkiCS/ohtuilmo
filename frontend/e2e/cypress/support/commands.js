// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('selectDate', { prevSubject: true }, (subject, dateObj) => {
  if (typeof dateObj === 'string') {
    dateObj = new Date(dateObj)
  }
  cy.wrap(subject).closest('.MuiFormControl-root').find('button').first().click({ force: true })
  cy.wait(300)

  const fiMonths = [
    'tammikuu',
    'helmikuu',
    'maaliskuu',
    'huhtikuu',
    'toukokuu',
    'kesäkuu',
    'heinäkuu',
    'elokuu',
    'syyskuu',
    'lokakuu',
    'marraskuu',
    'joulukuu',
  ]
  const targetMonthIndex = dateObj.getMonth()
  const targetMonth = fiMonths[targetMonthIndex]
  const targetYear = dateObj.getFullYear()

  const navigate = () => {
    cy.get('div[role="dialog"]')
      .find('.MuiPickersCalendarHeader-labelContainer')
      .then(($label) => {
        const label = $label.text().toLowerCase()
        if (label.includes(targetMonth) && label.includes(targetYear.toString())) {
          const targetDay = dateObj.getDate().toString()
          cy.get('div[role="dialog"]')
            .find('[role="gridcell"]:not([disabled])')
            .filter((index, el) => Cypress.$(el).text().trim() === targetDay)
            .first()
            .click({ force: true })

          // Wait for the MUI DatePicker
          cy.get('div[role="dialog"]').should('not.exist')
        } else {
          const currentMonthIndex = fiMonths.findIndex((m) => label.includes(m))

          // Extract year using regex in case of extra characters
          const yearMatch = label.match(/\d{4}/)
          const currentYearStr = yearMatch ? yearMatch[0] : targetYear.toString()

          if (targetYear !== parseInt(currentYearStr)) {
            cy.wrap($label).click({ force: true })
            cy.get('div[role="dialog"]')
              .find('.MuiYearCalendar-root button')
              .contains(targetYear.toString())
              .click({ force: true })
            cy.wait(300)
            navigate()
            return
          }

          if (targetMonthIndex < currentMonthIndex) {
            cy.get('div[role="dialog"]')
              .find('button[title="Previous month"]')
              .click({ force: true })
          } else {
            cy.get('div[role="dialog"]').find('button[title="Next month"]').click({ force: true })
          }
          cy.wait(300)
          navigate()
        }
      })
  }

  navigate()
})
