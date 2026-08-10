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

const formatDate = (date) => date.toISOString().slice(0, 10)

describe('Staff tag page', () => {
  before(() => {
    cy.deleteAllGroups()
    cy.loginAsRegisteredUser()
    cy.loginAsRegisteredIndicatedUser()
    cy.loginAsAdmin()
    cy.visit('/')
    cy.createTag('Coding')
    cy.createTag('Meeting')
    cy.createGroup({
      name: 'Brand New Group',
      topicId: 1,
      configurationId: 1,
      instructorId: null,
      studentIds: ['012345698', '918273645'],
    }).then((createdGroup) => {
      cy.loginAsRegisteredUser()
      cy.visit('/')

      const dateToday = new Date()
      const dateYesterday = addDaysToDate(dateToday, -1)

      cy.createSprint({
        sprint: 0,
        start_date: formatDate(addWeeksToDate(dateYesterday, -1)),
        end_date: formatDate(dateYesterday),
      })
      cy.createSprint({
        sprint: 1,
        start_date: formatDate(dateToday),
        end_date: formatDate(addWeeksToDate(dateToday, 1)),
      })
      cy.addTimelogEntry({
        studentNumber: '012345698',
        sprint: 0,
        date: formatDate(dateYesterday),
        minutes: 120,
        description: 'Coding with team A',
        tags: ['Coding'],
        groupId: createdGroup.id,
      })
      cy.addTimelogEntry({
        studentNumber: '012345698',
        sprint: 1,
        date: formatDate(dateToday),
        minutes: 180,
        description: 'Customer meeting A',
        tags: ['Meeting'],
        groupId: createdGroup.id,
      })

      cy.loginAsRegisteredIndicatedUser()
      cy.addTimelogEntryAlt({
        studentNumber: '918273645',
        sprint: 0,
        date: formatDate(dateYesterday),
        minutes: 240,
        description: 'Coding with team B',
        tags: ['Coding'],
        groupId: createdGroup.id,
      })
      cy.addTimelogEntryAlt({
        studentNumber: '918273645',
        sprint: 0,
        date: formatDate(dateYesterday),
        minutes: 120,
        description: 'Customer meeting B1',
        tags: ['Meeting'],
        groupId: createdGroup.id,
      })
      cy.addTimelogEntryAlt({
        studentNumber: '918273645',
        sprint: 1,
        date: formatDate(dateToday),
        minutes: 60,
        description: 'Customer meeting B2',
        tags: ['Meeting'],
        groupId: createdGroup.id,
      })
    })
  })

  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/')
    cy.get('#hamburger-menu-button')
      .click()
      .then(() => {
        cy.contains('Tag statistics').click()
      })
    // Ignore ResizeObserver loop limit error which happens randomly
    cy.on('uncaught:exception', (err) => !err.message.includes('ResizeObserver loop'))
  })

  it('opens staff tag page', () => {
    cy.contains('Tags').should('exist')
  })

  it('displays all available tags to staff', () => {
    cy.contains('Coding').should('exist')
    cy.contains('Meeting').should('exist')
  })

  it('displays correct tag data for group', () => {
    cy.get('[data-cy="configuration-selector"]').should('be.visible').click()
    cy.wait(500)
    cy.get('.configuration-menu-item').contains('Konfiguraatio 1').click()

    cy.get('[data-cy="group-selector"]').should('be.visible').click()
    cy.wait(500)
    cy.get('.group-menu-item').contains('Brand New Group').click()
    cy.contains('Tag usage for Brand New Group').should('exist')
    cy.get('#bar-Coding').trigger('mouseover')
    cy.get('.recharts-tooltip-wrapper').should('be.visible').and('contain.text', '6 h')

    cy.get('#bar-Meeting').trigger('mouseover')
    cy.get('.recharts-tooltip-wrapper').should('be.visible').and('contain.text', '6 h')

    cy.get('#tag-usage-line-chart .recharts-cartesian-grid-vertical').trigger('mouseover', 'left', {
      force: true,
    })
    cy.get('.recharts-tooltip-wrapper')
      .should('be.visible')
      .and('contain.text', 'Coding : 6 h')
      .and('contain.text', 'Meeting : 2 h')

    cy.get('#tag-usage-line-chart .recharts-cartesian-grid-vertical').trigger(
      'mouseover',
      'right',
      { force: true },
    )
    cy.get('.recharts-tooltip-wrapper')
      .should('be.visible')
      .and('contain.text', 'Coding : 0 h')
      .and('contain.text', 'Meeting : 4 h')
  })

  it('displays correct tag data for individual student', () => {
    cy.get('[data-cy="configuration-selector"]').should('be.visible').click()
    cy.wait(500)
    cy.get('.configuration-menu-item').contains('Konfiguraatio 1').click()

    cy.get('[data-cy="group-selector"]').should('be.visible').click()
    cy.wait(500)
    cy.get('.group-menu-item').contains('Brand New Group').click()

    cy.get('[data-cy="student-selector"]').should('be.visible').click()
    cy.wait(500)
    cy.get('.student-menu-item').contains('Volodymyr').click()
    cy.contains('Tag usage for Volodymyr').should('exist')
    cy.get('#bar-Coding').trigger('mouseover')
    cy.get('.recharts-tooltip-wrapper').should('be.visible').and('contain.text', '4 h')

    cy.get('#bar-Meeting').trigger('mouseover')
    cy.get('.recharts-tooltip-wrapper').should('be.visible').and('contain.text', '3 h')

    cy.get('#tag-usage-line-chart .recharts-cartesian-grid-vertical').trigger('mouseover', 'left', {
      force: true,
    })
    cy.get('.recharts-tooltip-wrapper')
      .should('be.visible')
      .and('contain.text', 'Coding : 4 h')
      .and('contain.text', 'Meeting : 2 h')

    cy.get('#tag-usage-line-chart .recharts-cartesian-grid-vertical').trigger(
      'mouseover',
      'right',
      { force: true },
    )
    cy.get('.recharts-tooltip-wrapper')
      .should('be.visible')
      .and('contain.text', 'Coding : 0 h')
      .and('contain.text', 'Meeting : 1 h')
  })

  after(() => {
    cy.deleteAllGroups()
    cy.deleteAllTags()
  })
})
