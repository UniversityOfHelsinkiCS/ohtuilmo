/* globals cy Cypress */
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import { TEST_USER, TEST_USER2, TEST_ADMIN, TEST_USER3, TEST_INSTRUCTOR } from '../common'

const postLogin = (user) => {
  const { headers } = user
  return cy.request({
    url: '/api/login',
    method: 'POST',
    headers,
  })
}

const loginAsUser = (user) => {
  postLogin(user).then((res) => {
    const userData = res.body
    // the app checks the instructor role after logging in, do the same here
    cy.request({
      url: '/api/users/isInstructor',
      headers: { Authorization: 'Bearer ' + userData.token },
    }).then((instructorRes) => {
      const loggedInUser = {
        ...userData,
        user: { ...userData.user, instructor: instructorRes.body.isInstructor },
      }
      cy.window().then((win) => {
        win.localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser))
      })
    })
  })
}

Cypress.Commands.add('loginAsUnregisteredUser', () => {
  loginAsUser(TEST_USER)
})

Cypress.Commands.add('loginAsRegisteredUser', () => {
  loginAsUser(TEST_USER2)
})

Cypress.Commands.add('loginAsAdmin', () => {
  loginAsUser(TEST_ADMIN)
})

Cypress.Commands.add('loginAsRegisteredIndicatedUser', () => {
  loginAsUser(TEST_USER3)
})

Cypress.Commands.add('loginAs', (user) => {
  loginAsUser(user)
})

Cypress.Commands.add('loginAsInstructor', () => {
  loginAsUser(TEST_INSTRUCTOR)
})

// makes an API request as the given user (or anonymously when user is null)
// without failing the test on error statuses, for testing access control
Cypress.Commands.add('requestAs', (user, options) => {
  const token = user ? postLogin(user).its('body.token') : cy.wrap(null)
  return token.then((t) =>
    cy.request({
      ...options,
      failOnStatusCode: false,
      headers: t ? { Authorization: 'Bearer ' + t } : {},
    }),
  )
})

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('loggedInUser')
})

const withLoggedRegisteredUserToken = (fn) => {
  postLogin(TEST_USER2).then((res) => {
    const { token } = res.body
    fn(token)
  })
}

const withLoggedRegisteredUserTokenAlt = (fn) => {
  postLogin(TEST_USER3).then((res) => {
    const { token } = res.body
    fn(token)
  })
}

const withLoggedAdminToken = (fn) => {
  postLogin(TEST_ADMIN).then((res) => {
    const { token } = res.body
    fn(token)
  })
}

const withLoggedAdminTokenSuperHack = () => {
  return postLogin(TEST_ADMIN).then((res) => res.body.token)
}

Cypress.Commands.add('deleteRegistrationQuestions', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/registrationQuestions',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const { questionSets } = res.body

      for (const set of questionSets) {
        cy.request({
          url: `/api/registrationQuestions/${set.id}`,
          method: 'DELETE',
          headers: authHeaders,
        })
      }
    })
  })
})

Cypress.Commands.add('createRegistrationQuestionSet', (name, questions) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/registrationQuestions',
      method: 'POST',
      headers: authHeaders,
      body: {
        name,
        questions,
      },
    })
  })
})

Cypress.Commands.add('deleteReviewQuestions', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/reviewQuestions',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const { questionSets } = res.body

      for (const set of questionSets) {
        cy.request({
          url: `/api/reviewQuestions/${set.id}`,
          method: 'DELETE',
          headers: authHeaders,
        })
      }
    })
  })
})

Cypress.Commands.add('createReviewQuestionSet', (name, questions) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/reviewQuestions',
      method: 'POST',
      headers: authHeaders,
      body: {
        name,
        questions,
      },
    })
  })
})

Cypress.Commands.add('deleteAllGroups', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/groups',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const allGroups = res.body
      for (const group of allGroups) {
        cy.request({
          url: `/api/groups/${group.id}`,
          method: 'DELETE',
          headers: authHeaders,
        })
      }
    })
  })
})

Cypress.Commands.add('createNewTopic', (newTopicName, customerName, topicDescription) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/topics',
      method: 'POST',
      headers: authHeaders,
      active: true,
      body: {
        content: {
          email: 'asiakas@asiakas.com',
          title: newTopicName,
          description: topicDescription,
          environment: 'Web',
          customerName: customerName,
          additionalInfo: '',
          specialRequests: '',
        },
      },
    })
  })
})

Cypress.Commands.add('setTopicActive', (topicId) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: `api/topics/${topicId}`,
      method: 'PUT',
      headers: authHeaders,
      body: {
        topic: {
          active: true,
        },
      },
    })
  })
})

Cypress.Commands.add(
  'setPeerReviewOneActive',
  (configurationName, configurationId, questionSetName) => {
    withLoggedAdminToken((token) => {
      const authHeaders = {
        Authorization: 'Bearer ' + token,
      }
      findReviewQuestionId(authHeaders, questionSetName).then((setId) => {
        cy.request({
          url: `api/configurations/${configurationId}`,
          method: 'PUT',
          headers: authHeaders,
          body: {
            name: configurationName,
            review_question_set1_id: setId,
          },
        })
        cy.request({
          url: '/api/registrationManagement',
          method: 'POST',
          headers: authHeaders,
          body: {
            registrationManagement: {
              peer_review_conf: 1,
              peer_review_open: true,
              peer_review_round: 1,
              project_registration_conf: 1,
              project_registration_open: true,
              project_registration_message: '',
              project_registration_info: 'Project registration will be open until DD.MM.2019.',
              topic_registration_conf: 1,
              topic_registration_open: true,
              topic_registration_message: '',
            },
          },
        })
      })
    })
  },
)

Cypress.Commands.add('deleteAllPeerReviews', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/peerreview/all',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const allReviews = res.body
      for (const review of allReviews) {
        cy.request({
          url: `/api/peerreview/${review.id}`,
          method: 'DELETE',
          headers: authHeaders,
        })
      }
    })
  })
})

const findReviewQuestionId = (authHeaders, questionSetName) => {
  return cy
    .request({
      url: '/api/reviewQuestions',
      method: 'GET',
      headers: authHeaders,
    })
    .then((res) => {
      const { questionSets } = res.body

      for (const set of questionSets) {
        if (set.name === questionSetName) {
          return set.id
        }
      }
    })
}

Cypress.Commands.add('deleteAllEmailTemplates', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/email/templates',
      method: 'DELETE',
      headers: authHeaders,
    })
  })
})

const defaultEmailTemplates = () => ({
  topicAccepted: { finnish: '', english: '' },
  topicRejected: { finnish: '', english: '' },
})

Cypress.Commands.add('updateEmailTemplate', (templateName, templateLanguage, text) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    const body = defaultEmailTemplates()
    body[templateName][templateLanguage] = text

    cy.request({
      url: '/api/email/templates',
      method: 'POST',
      headers: authHeaders,
      body,
    })
  })
})

Cypress.Commands.add('updateAllEmailTemplates', (body) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/email/templates',
      method: 'POST',
      headers: authHeaders,
      body,
    })
  })
})

Cypress.Commands.add('deleteSentEmails', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/email/sent-emails',
      method: 'DELETE',
      headers: authHeaders,
    })
  })
})

Cypress.Commands.add('deleteCustomerReviewQuestions', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/customerReviewQuestions',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const { questionSets } = res.body

      for (const set of questionSets) {
        cy.request({
          url: `/api/customerReviewQuestions/${set.id}`,
          method: 'DELETE',
          headers: authHeaders,
        })
      }
    })
  })
})

Cypress.Commands.add('createCustomerReviewQuestionSet', (name, questions) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/customerReviewQuestions',
      method: 'POST',
      headers: authHeaders,
      body: {
        name,
        questions,
      },
    })
  })
})

Cypress.Commands.add('setCustomerReviewQuestionSetToConfiguration', (configurationId) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/customerReviewQuestions',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const questionSet = res.body.questionSets[0]
      cy.request({
        url: `/api/configurations/${configurationId}`,
        method: 'PUT',
        headers: authHeaders,
        body: {
          content: null,
          customer_review_question_set_id: questionSet.id,
          name: 'Konfiguraatio 1',
          registration_question_set_id: null,
          review_question_set1_id: null,
          review_question_set2_id: null,
        },
      })
    })
  })
})

Cypress.Commands.add('deleteCustomerReviews', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/customerReview/',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const { reviews } = res.body
      if (reviews) {
        for (const review of reviews) {
          cy.request({
            url: `/api/customerReview/${review.id}`,
            method: 'DELETE',
            headers: authHeaders,
          })
        }
      }
    })
  })
})

Cypress.Commands.add('deleteInstructorReviews', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/instructorReview/',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const { reviews } = res.body
      if (reviews) {
        for (const review of reviews) {
          cy.request({
            url: `/api/instructorReview/${review.id}`,
            method: 'DELETE',
            headers: authHeaders,
          })
        }
      }
    })
  })
})

Cypress.Commands.add('createPeerReviews', (peerReviews) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    cy.request({
      url: '/api/peerreview/insertTestData',
      method: 'POST',
      headers: authHeaders,
      body: peerReviews,
    })
  })
})

Cypress.Commands.add('createConfiguration', (configurationData) => {
  return withLoggedAdminTokenSuperHack().then((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    const {
      name,
      content,
      registration_question_set_id,
      review_question_set1_id,
      review_question_set2_id,
      customer_review_question_set_id,
    } = configurationData

    return cy
      .request({
        url: '/api/configurations',
        method: 'POST',
        headers: authHeaders,
        body: {
          name,
          content,
          registration_question_set_id,
          review_question_set1_id,
          review_question_set2_id,
          customer_review_question_set_id,
        },
      })
      .then((res) => res.body.configuration)
  })
})

Cypress.Commands.add('createTopic', (topicContent, topicConfigurationId) => {
  return withLoggedAdminTokenSuperHack().then((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    return cy
      .request({
        url: '/api/topics',
        method: 'POST',
        headers: authHeaders,
        body: {
          content: topicContent,
          configuration_id: topicConfigurationId,
        },
      })
      .then((res) => res.body.topic)
  })
})

Cypress.Commands.add('deleteConfiguration', (configurationId) => {
  withLoggedAdminTokenSuperHack().then((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: `/api/configurations/${configurationId}`,
      method: 'DELETE',
      headers: authHeaders,
    })
  })
})

Cypress.Commands.add('createCustomerReview', (customerReview) => {
  withLoggedAdminTokenSuperHack().then((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    //const { answerSheet, group_id, topic_id, configuration_id } = customerReview
    cy.request({
      url: '/api/customerReview',
      method: 'POST',
      headers: authHeaders,
      body: {
        customerReview,
      },
    })
  })
})

Cypress.Commands.add('createGroupHack', (groupData) => {
  return withLoggedAdminTokenSuperHack().then((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    const {
      name,
      topicId,
      configurationId,
      instructorId,
      isShortProject = false,
      studentIds,
    } = groupData

    return cy
      .request({
        url: '/api/groups',
        method: 'POST',
        headers: authHeaders,
        body: {
          name,
          topicId,
          configurationId,
          instructorId,
          isShortProject,
          studentIds,
        },
      })
      .then((res) => res.body)
  })
})

/* GROUP CREATION FOR TESTING */

Cypress.Commands.add('createGroup', (groupData) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    const {
      name,
      topicId,
      configurationId,
      instructorId,
      isShortProject = false,
      studentIds,
    } = groupData

    cy.request({
      url: '/api/groups',
      method: 'POST',
      headers: authHeaders,
      body: {
        name,
        topicId,
        configurationId,
        instructorId,
        isShortProject,
        studentIds,
      },
    }).then((res) => {
      cy.wrap(res.body)
    })
  })
})

/* GROUP DATA FETCHING FOR TESTING */

Cypress.Commands.add('getGroups', () => {
  return withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    return cy
      .request({
        url: '/api/groups',
        method: 'GET',
        headers: authHeaders,
      })
      .then((res) => {
        return cy.wrap(res.body)
      })
  })
})

/* SPRINT CREATION FOR TESTING */

Cypress.Commands.add('createSprint', (sprintData) => {
  withLoggedRegisteredUserToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    const { sprint, start_date, end_date } = sprintData
    const user_id = TEST_USER2.headers.hypersonstudentid

    cy.request({
      url: '/api/sprints',
      method: 'POST',
      headers: authHeaders,
      body: {
        start_date,
        end_date,
        sprint,
        user_id,
      },
    })
  })
})

/* SPRINT DATA FETCHING FOR TESTING */

Cypress.Commands.add('getSprints', () => {
  return withLoggedRegisteredUserTokenAlt((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }

    return cy
      .request({
        url: '/api/sprints',
        method: 'GET',
        headers: authHeaders,
      })
      .then((res) => {
        return cy.wrap(res.body)
      })
  })
})

/* DELETE ALL SPRINTS FOR TESTING */

Cypress.Commands.add('deleteAllSprintsChartTest', () => {
  withLoggedRegisteredUserTokenAlt((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/sprints',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const allSprints = res.body
      for (const sprint of allSprints) {
        cy.request({
          url: `/api/sprints/${sprint.id}`,
          method: 'DELETE',
          headers: authHeaders,
        })
      }
    })
  })
})

/* TIMELOGS ENTRY CREATION FOR TESTING */

Cypress.Commands.add('addTimelogEntry', (timeLogEntryData) => {
  withLoggedRegisteredUserToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    const { studentNumber, sprint, date, minutes, description, tags, groupId } = timeLogEntryData

    cy.request({
      url: '/api/timelogs',
      method: 'POST',
      headers: authHeaders,
      body: {
        studentNumber,
        sprint,
        date,
        minutes,
        description,
        tags,
        groupId,
      },
    })
  })
})

Cypress.Commands.add('addTimelogEntryAlt', (timeLogEntryData) => {
  withLoggedRegisteredUserTokenAlt((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    const { studentNumber, sprint, date, minutes, description, tags, groupId } = timeLogEntryData

    cy.request({
      url: '/api/timelogs',
      method: 'POST',
      headers: authHeaders,
      body: {
        studentNumber,
        sprint,
        date,
        minutes,
        description,
        tags,
        groupId,
      },
    })
  })
})

/* DELETE ALL TIMELOGS FOR TESTING */

Cypress.Commands.add('deleteAllTimelogs', () => {
  withLoggedRegisteredUserTokenAlt((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/timelogs',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const allTimelogs = res.body
      for (const timelog of allTimelogs) {
        cy.request({
          url: `/api/timelogs/${timelog.id}`,
          method: 'DELETE',
          headers: authHeaders,
        })
      }
    })
  })
})

Cypress.Commands.add('deleteAllSprints', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/sprints',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const allSprints = res.body
      for (const sprint of allSprints) {
        cy.request({
          url: `/api/sprints/${sprint.id}`,
          method: 'DELETE',
          failOnStatusCode: false,
          headers: authHeaders,
        })
      }
    })
  })
})

/* TAG CREATION FOR TESTING */

Cypress.Commands.add('createTag', (tagTitle) => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/tags',
      method: 'POST',
      headers: authHeaders,
      body: {
        title: tagTitle,
      },
    })
  })
})

/* DELETE ALL TAGS FOR TESTING */

Cypress.Commands.add('deleteAllTags', () => {
  withLoggedAdminToken((token) => {
    const authHeaders = {
      Authorization: 'Bearer ' + token,
    }
    cy.request({
      url: '/api/tags',
      method: 'GET',
      headers: authHeaders,
    }).then((res) => {
      const allTags = res.body
      for (const tag of allTags) {
        cy.request({
          url: `/api/tags/${tag.id}`,
          method: 'DELETE',
          headers: authHeaders,
        })
      }
    })
  })
})
