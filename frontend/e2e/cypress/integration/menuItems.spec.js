/* eslint-disable */

describe('Menu items for different user roles', () => {
  describe('Main menu of admin', () => {
    beforeEach(() => {
      cy.loginAsAdmin()
      cy.visit('/')
    })

    it('Admin should see admin menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Course').should('exist')
            cy.contains('Create Topic').should('exist')
            cy.contains('Topics').should('exist')
            cy.contains('Grades given by instructors').should('exist')
            cy.contains('Course instance questions').should('exist')
            cy.contains('Registration and review settings').should('exist')
            cy.contains('Current registrations').should('exist')
            cy.contains('Group Management').should('exist')
            cy.contains('Participants').should('exist')
            cy.contains('Users').should('exist')
            cy.contains('Registration Questions').should('exist')
            cy.contains('Customer Review Questions').should('exist')
            cy.contains('Peer Review Questions').should('exist')
            cy.contains('Email Templates').should('exist')
          })
        })
    })

    it('Admin should see instructor menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Instructor').should('exist')
            cy.contains('Home').should('exist')
            cy.contains('Instructor Review').should('exist')
            cy.contains('Customer reviews').should('exist')
          })
        })
    })

    it('Admin should see student menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Student').should('exist')
            cy.contains('Register').should('exist')
            cy.contains('Registration Details').should('exist')
            cy.contains('Peer Review').should('exist')
            cy.contains('Time Logs').should('exist')
            cy.contains('Sprint Dashboard').should('exist')
          })
        })
    })
  })

  describe('Main menu of student', () => {
    before(() => {
      cy.loginAsAdmin()
      cy.createGroup({
        name: 'Brand New Group',
        topicId: 1,
        configurationId: 1,
        instructorId: null,
        studentIds: ['012345698'],
      })
    })
    after(() => {
      cy.deleteAllGroups()
    })
    beforeEach(() => {
      cy.loginAsRegisteredUser()
      cy.visit('/')
    })

    it('Student should not see admin menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Admin').should('not.exist')
            cy.contains('Topics').should('not.exist')
            cy.contains('Create Topic').should('not.exist')
            cy.contains('Reviews').should('not.exist')
            cy.contains('Course instance questions').should('not.exist')
            cy.contains('Registration and review settings').should('not.exist')
            cy.contains('Current registrations').should('not.exist')
            cy.contains('Group Management').should('not.exist')
            cy.contains('Participants').should('not.exist')
            cy.contains('Users').should('not.exist')
            cy.contains('Registration Questions').should('not.exist')
            cy.contains('Customer Review Questions').should('not.exist')
            cy.contains('Peer Review Questions').should('not.exist')
            cy.contains('Email Templates').should('not.exist')
          })
        })
    })

    it('Student should not see instructor menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Instructor').should('not.exist')
            cy.contains('Instructor Review').should('not.exist')
            cy.contains('Reviews').should('not.exist')
            cy.contains('Customer reviews').should('not.exist')
          })
        })
    })

    it('Student should see student menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Student').should('exist')
            cy.contains('Home').should('exist')
            cy.contains('Registration Details').should('exist')
            cy.contains('Peer Review').should('exist')
            cy.contains('Time Logs').should('exist')
            cy.contains('Sprint Dashboard').should('exist')
          })
        })
    })
  })
  describe('Main menu of student without group', () => {
    beforeEach(() => {
      cy.loginAsRegisteredUser()
      cy.visit('/')
    })

    it('Student without group should not see admin menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Admin').should('not.exist')
            cy.contains('Topics').should('not.exist')
            cy.contains('Create Topic').should('not.exist')
            cy.contains('Reviews').should('not.exist')
            cy.contains('Course instance questions').should('not.exist')
            cy.contains('Registration and review settings').should('not.exist')
            cy.contains('Current registrations').should('not.exist')
            cy.contains('Group Management').should('not.exist')
            cy.contains('Participants').should('not.exist')
            cy.contains('Users').should('not.exist')
            cy.contains('Registration Questions').should('not.exist')
            cy.contains('Customer Review Questions').should('not.exist')
            cy.contains('Peer Review Questions').should('not.exist')
            cy.contains('Email Templates').should('not.exist')
          })
        })
    })

    it('Student without group should not see instructor menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Instructor').should('not.exist')
            cy.contains('Instructor Review').should('not.exist')
            cy.contains('Reviews').should('not.exist')
            cy.contains('Customer reviews').should('not.exist')
          })
        })
    })

    it('Student without group should not see student menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Peer Review').should('not.exist')
            cy.contains('Time Logs').should('not.exist')
            cy.contains('Sprint Dashboard').should('not.exist')
          })
        })
    })
    it('Student without group should see student without group menu items', () => {
      cy.get('#hamburger-menu-button')
        .click()
        .then(() => {
          cy.get('#hamburger-menu-popper').within(() => {
            cy.contains('Student - no group').should('exist')
            cy.contains('Register').should('exist')
            cy.contains('Registration Details').should('exist')
          })
        })
    })
  })
})
