/* eslint-disable */
const addWeeksToDate = (date, weeks) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + weeks * 7)
  return newDate
}

const addDaysToDate = (date, days) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

describe('Time logs & sprints', () => {
  before(() => {
    cy.deleteAllGroups()
    cy.loginAsAdmin()
    cy.createGroup({
      name: 'Brand New Group',
      topicId: 1,
      configurationId: 1,
      instructorId: null,
      studentIds: ['012345698'],
    })
  })

  beforeEach(() => {
    cy.loginAsRegisteredUser()
    cy.visit('/')
    cy.get('h4', { timeout: 15000 })
      .should('include.text', 'Brand New Group')
      .should('include.text', 'testertester3')
    cy.get('.registration-details-container').should('exist')
  })

  it('add 2 sprints', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Sprint Dashboard').click()
      })

    cy.get('h4').should('include.text', 'Add new sprint')

    const dateToday = new Date()
    const dateYesterday = addDaysToDate(dateToday, -1)

    cy.get('#sprintNumber').type('1')
    cy.get('#startDate').selectDate(addWeeksToDate(dateYesterday, -1))
    cy.get('#endDate').selectDate(dateYesterday)
    cy.get('#add-sprint-button').click()
    cy.get('[data-cy=sprint-1]').should('exist')

    cy.get('#sprintNumber').type('2')
    cy.get('#startDate').selectDate(dateToday)
    cy.get('#endDate').selectDate(addWeeksToDate(dateToday, 1))
    cy.get('#add-sprint-button').click()

    cy.get('[data-cy=sprint-2]').should('exist')
  })

  it('renders current sprint by default', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-sprint-select').contains('SPRINT 2')
  })

  it('time log form is disabled for previous sprint', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })

    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('#previous-sprint-button').click()
    cy.get('#date').should('be.disabled')
    cy.get('#time').should('be.disabled')
    cy.get('#description').should('be.disabled')
    cy.get('#time-log-submit-button').should('be.disabled')
  })

  it('add 2 time logs', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })

    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('#date').selectDate(new Date())
    cy.get('#time').type('01:00')
    cy.get('#description').type('test description 1')
    cy.get('#time-log-submit-button').click()

    cy.get('.notification').should('exist').should('have.text', 'Time log created successfully')

    cy.get('#date').selectDate(addDaysToDate(new Date(), 1))
    cy.get('#time').type('02:00')
    cy.get('#description').type('test description 2')
    cy.get('#time-log-submit-button').click()

    cy.get('.notification').should('exist').should('have.text', 'Time log created successfully')

    cy.get('#timelog-rows').should('include.text', 'test description 1')
    cy.get('#timelog-rows').should('include.text', 'test description 2')
  })

  it('should display 2 time logs', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })

    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-container-1', { timeout: 15000 }).should('contain', 'test description 1')
    cy.get('.timelogs-container-1', { timeout: 15000 }).should('contain', 'test description 2')

    cy.get('#timelog-rows').children().should('have.length', 2)
  })

  it('shows error from backend when creating timeLog fails with data outside sprint', () => {
    cy.visit('/timelogs')
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-container-1').should('exist')
    cy.get('.input-container').should('exist')
    cy.get('.date input').selectDate('2022-02-01')
    cy.get('.time').type('01:00')
    cy.get('.description').type('valid description')
    cy.get('.submit-button').click()

    cy.get('.notification').should('exist')
    cy.get('.notification').should(
      'have.text',
      'The log date is not within sprint start and end date.',
    )
  })

  it('previous week should not display time logs', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })

    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-container-1').should('contain', 'test description 2')
    cy.get('#previous-sprint-button').click()
    cy.get('#timelog-rows').children().should('have.length', 1)
    cy.get('#timelog-rows').should('contain', 'There are no time logs for this sprint.')
  })

  it('asks for confirmation before deleting a time log and aborts deletion when canceled', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })

    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-description').first().invoke('text').as('testedLogDescription')

    cy.get('#timelog-rows').find('[id^="timelog-remove-button-"]').first().click()
    cy.get('.confirmation-dialog').should('contain', 'Delete this time log? It cannot be restored.')
    cy.get('.confirmation-dialog').find('#confirmation-dialog-no-button').click()

    cy.get('@testedLogDescription').then((testedLogDescription) => {
      cy.get('#timelog-rows')
        .find('.timelogs-description')
        .first()
        .should('be.text', testedLogDescription)
    })
    cy.get('#timelog-rows').children().should('have.length', 2)
  })

  it('remove a time log, should not display removed time log', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })

    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('#timelog-rows').find('[id^="timelog-remove-button-"]').first().click()

    cy.get('.confirmation-dialog').should('contain', 'Delete this time log? It cannot be restored.')
    cy.get('.confirmation-dialog').find('#confirmation-dialog-yes-button').click()

    cy.get('.timelogs-description').should('not.contain.text', 'test description 2')

    cy.get('#timelog-rows').children().should('have.length', 1)
  })

  it('displays error on time field of form when input is negative hours', () => {
    cy.visit('/timelogs')
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-container-1').should('exist')
    cy.get('.input-container').should('exist')
    cy.get('.date input').selectDate('2022-01-01')
    cy.get('.time').type('-01:00')
    cy.get('.description').type('negative time')
    cy.get('.submit-button').click()

    cy.get('.input-container').contains('Time must be in format HH:MM')
    cy.get('#timelog-rows').should('not.contain', 'negative time')
  })

  it('displays error on time field of form when input is letters', () => {
    cy.visit('/timelogs')
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-container-1').should('exist')
    cy.get('.input-container').should('exist')
    cy.get('.date input').selectDate('2022-01-01')
    cy.get('.time').type('aabee')
    cy.get('.description').type('letters in time')
    cy.get('.submit-button').click()

    cy.get('.input-container').contains('Time must be in format HH:MM')
    cy.get('#timelog-rows').should('not.contain', 'letters in time')
  })

  it('displays error on time field of form when input is missing a colon', () => {
    cy.visit('/timelogs')
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-container-1').should('exist')
    cy.get('.input-container').should('exist')
    cy.get('.date input').selectDate('2022-01-01')
    cy.get('.time').type('0100')
    cy.get('.description').type('missing colon')
    cy.get('.submit-button').click()

    cy.get('.input-container').contains('Time must be in format HH:MM')
    cy.get('#timelog-rows').should('not.contain', 'missing colon')
  })

  it('displays error on time field of form when input has over 60 minutes', () => {
    cy.visit('/timelogs')
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-container-1').should('exist')
    cy.get('.input-container').should('exist')
    cy.get('.date input').selectDate('2022-01-01')
    cy.get('.time').type('01:61')
    cy.get('.description').type('over 60 minutes')
    cy.get('.submit-button').click()

    cy.get('.input-container').contains('Time must be in format HH:MM')
    cy.get('#timelog-rows').should('not.contain', 'over 60 minutes')
  })

  it('displays error on description field of form when input is under 5 characters long', () => {
    cy.visit('/timelogs')
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('.timelogs-container-1').should('exist')
    cy.get('.input-container').should('exist')
    cy.get('.date input').selectDate('2022-01-01')
    cy.get('.time').type('01:00')
    cy.get('.description').type('1234')
    cy.get('.submit-button').click()

    cy.get('.input-container').contains('Description must be at least 5 characters')
    cy.get('#timelog-rows').should('not.contain', '1234')
  })

  it('trying to remove sprint with existing time logs displays error', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Sprint Dashboard').click()
      })
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Add new sprint')

    cy.get('.sprints-container').find('[id^="sprint-remove-button-"]').last().click()

    cy.get('.sprints-container')
      .find('[id^="sprint-remove-button-"]')
      .first()
      .click()
      .then(() => {
        cy.get('.notification').should('exist')
        cy.get('[data-testid="notification-message"]', { timeout: 10000 }).should(
          'contain',
          'Sprint has time logs, cannot delete.',
        )
      })
  })

  it('remove sprints, should not display sprints or time logs', () => {
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Time Logs')

    cy.get('#timelog-rows').find('[id^="timelog-remove-button-"]').first().click()
    cy.get('.confirmation-dialog').should('contain', 'Delete this time log? It cannot be restored.')
    cy.get('.confirmation-dialog').find('#confirmation-dialog-yes-button').click()

    cy.get('#timelog-rows').children().should('have.length', 1)

    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Sprint Dashboard').click()
      })
    cy.get('h4', { timeout: 15000 }).should('include.text', 'Add new sprint')

    cy.get('.sprints-container')
      .find('[id^="sprint-remove-button-"]')
      .click({ multiple: true })
      .then(() => cy.get('#app-content').should('not.contain', '.sprint-list-container'))

    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Time Log').click()
      })
    cy.get('#app-content', { timeout: 15000 }).should(
      'contain',
      'Your group has no sprints. Add a sprint using Sprint Dashboard.',
    )
  })

  after(() => {
    cy.deleteAllGroups()
  })
})
