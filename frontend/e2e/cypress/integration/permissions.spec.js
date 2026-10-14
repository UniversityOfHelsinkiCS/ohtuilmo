/* global cy describe before beforeEach it */
import { TEST_USER2, TEST_USER3, TEST_INSTRUCTOR, TEST_INSTRUCTOR2 } from '../common'

const STUDENT_ID = TEST_USER2.headers.hypersonstudentid
const OTHER_STUDENT_ID = TEST_USER3.headers.hypersonstudentid
const INSTRUCTOR_ID = TEST_INSTRUCTOR.headers.hypersonstudentid
const INSTRUCTOR2_ID = TEST_INSTRUCTOR2.headers.hypersonstudentid

const formatDate = (date) => date.toISOString().slice(0, 10)

const addDays = (date, days) => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

const topicContent = {
  title: 'Permission test topic',
  customerName: 'Permission customer',
  email: 'customer@example.com',
  description: 'Topic for testing permissions',
  environment: 'Web',
  specialRequests: '',
  additionalInfo: '',
}

// the instructor role is given at login to users who instruct a group of an
// active configuration, so the groups are created before the instructors log in
const setUpGroups = () => {
  cy.deleteAllGroups()
  // logging in creates the users
  cy.requestAs(TEST_INSTRUCTOR, { url: '/api/groups' })
  cy.requestAs(TEST_INSTRUCTOR2, { url: '/api/groups' })
  cy.requestAs(TEST_USER3, { url: '/api/groups' })

  cy.createTopic(topicContent, 1).as('topic')
  cy.get('@topic').then((topic) => {
    cy.createGroupHack({
      name: 'Instructed group',
      topicId: topic.id,
      configurationId: 1,
      instructorId: INSTRUCTOR_ID,
      studentIds: [STUDENT_ID],
    }).as('group')
  })
  cy.createGroupHack({
    name: 'Group of the other instructor',
    topicId: 1,
    configurationId: 1,
    instructorId: INSTRUCTOR2_ID,
    studentIds: [OTHER_STUDENT_ID],
  })
}

const addTimeLog = (description) => {
  const today = new Date()
  cy.get('@group').then((group) => {
    cy.addTimelogEntry({
      studentNumber: STUDENT_ID,
      sprint: 1,
      date: formatDate(today),
      minutes: 60,
      description,
      tags: [],
      groupId: group.id,
    })
  })
  return cy
    .requestAs(TEST_INSTRUCTOR, { url: '/api/instructorTimeLogs' })
    .then((res) => res.body.find((log) => log.description === description).id)
}

describe('Access control', () => {
  before(() => {
    cy.loginAsAdmin()
    cy.visit('/')
    setUpGroups()
    const today = new Date()
    cy.createSprint({
      sprint: 1,
      start_date: formatDate(addDays(today, -1)),
      end_date: formatDate(addDays(today, 7)),
    })
  })

  beforeEach(() => {
    // aliases are cleared between tests, so they are restored for each test
    cy.requestAs(TEST_INSTRUCTOR, { url: '/api/groups' }).then((res) => {
      const group = res.body.find((g) => g.name === 'Instructed group')
      cy.wrap(group).as('group')
    })
  })

  describe('API', () => {
    it('an anonymous user can not copy topics', () => {
      cy.requestAs(null, { url: '/api/topics/1/copy', method: 'POST' })
        .its('status')
        .should('eq', 401)
    })

    it('a student can not copy topics', () => {
      cy.requestAs(TEST_USER2, { url: '/api/topics/1/copy', method: 'POST' })
        .its('status')
        .should('eq', 401)
    })

    it('a student can not list groups', () => {
      cy.requestAs(TEST_USER2, { url: '/api/groups' }).its('status').should('eq', 401)
    })

    it('a customer review is rejected without a valid review link', () => {
      cy.get('@group').then((group) => {
        cy.requestAs(null, {
          url: '/api/customerReview',
          method: 'POST',
          body: { customerReview: { answer_sheet: [], group_id: group.id } },
        })
          .its('status')
          .should('eq', 401)

        cy.requestAs(null, {
          url: '/api/customerReview',
          method: 'POST',
          body: {
            customerReview: { answer_sheet: [], group_id: group.id, secret_id: 'not-a-secret' },
          },
        })
          .its('status')
          .should('eq', 401)
      })
    })

    it('a customer review is accepted once with a valid review link', () => {
      cy.createTopic(topicContent, 1).then((topic) => {
        cy.createGroupHack({
          name: 'Reviewed group',
          topicId: topic.id,
          configurationId: 1,
          instructorId: null,
          studentIds: [],
        }).then((group) => {
          const review = {
            url: '/api/customerReview',
            method: 'POST',
            body: {
              customerReview: { answer_sheet: [], group_id: group.id, secret_id: topic.secret_id },
            },
          }
          cy.requestAs(null, review).its('status').should('eq', 201)
          cy.requestAs(null, review).its('status').should('eq', 400)
        })
      })
    })

    it('a student can not create sprints for the group of another student', () => {
      const today = new Date()
      cy.requestAs(TEST_USER2, {
        url: '/api/sprints',
        method: 'POST',
        body: {
          sprint: 2,
          start_date: formatDate(addDays(today, 8)),
          end_date: formatDate(addDays(today, 14)),
          user_id: OTHER_STUDENT_ID,
        },
      })
      // the sprint goes to the group of the requester, never to the other group
      cy.requestAs(TEST_USER3, { url: '/api/sprints' }).its('body').should('have.length', 0)
    })

    it('another instructor can not move or delete time logs of the group', () => {
      addTimeLog('Log of another instructor test').then((logId) => {
        cy.requestAs(TEST_INSTRUCTOR2, {
          url: `/api/instructorTimeLogs/${logId}`,
          method: 'DELETE',
        })
          .its('status')
          .should('eq', 403)
        cy.requestAs(TEST_INSTRUCTOR2, {
          url: `/api/instructorTimeLogs/${logId}/moveToNext`,
          method: 'PATCH',
        })
          .its('status')
          .should('eq', 403)
      })
    })

    it('the instructor of the group can delete its time logs', () => {
      addTimeLog('Log of the own instructor test').then((logId) => {
        cy.requestAs(TEST_INSTRUCTOR, {
          url: `/api/instructorTimeLogs/${logId}`,
          method: 'DELETE',
        })
          .its('status')
          .should('eq', 200)
      })
    })
  })

  describe('Pages', () => {
    it('an instructor sees the instructor menu but not the admin menu', () => {
      cy.loginAsInstructor()
      cy.visit('/')
      cy.get('#hamburger-menu-button').click()
      cy.get('#hamburger-menu-popper').within(() => {
        cy.contains('Group time logs').should('exist')
        cy.contains('Peer reviews').should('exist')
        cy.contains('Group Management').should('not.exist')
        cy.contains('Users').should('not.exist')
      })
    })

    it('an instructor can not open admin pages', () => {
      cy.loginAsInstructor()
      cy.visit('/administration/groups')
      cy.contains('Unauthorized.')
    })

    it('a student can not open instructor pages', () => {
      cy.loginAsRegisteredUser()
      cy.visit('/instructorpage')
      cy.contains('Unauthorized.')
      cy.visit('/instructor-timelogs')
      cy.contains('Unauthorized.')
    })

    it('the instructor time logs page restores its selection from the URL', () => {
      addTimeLog('Log shown by url test')
      cy.loginAsInstructor()
      cy.get('@group').then((group) => {
        cy.visit(`/instructor-timelogs?configuration=1&group=${group.id}&student=${STUDENT_ID}`)
        cy.contains('Timelogs by Instructed group')
        cy.contains('Log shown by url test')
      })
    })
  })
})
