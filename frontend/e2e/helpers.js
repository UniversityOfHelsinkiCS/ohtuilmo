// Login and data setup helpers for the Playwright tests. They call the API
// directly, the request context of a page shares its base url (see
// playwright.config.js), so API paths are written without a leading slash.
import { expect } from '@playwright/test'
import { TEST_USER, TEST_USER2, TEST_USER3, TEST_ADMIN, TEST_INSTRUCTOR } from './common'

const apiUrl = (url) => url.replace(/^\//, '')

const postLogin = async (request, user) => {
  const res = await request.post('api/login', { headers: user.headers })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

const tokenOf = async (request, user) => (await postLogin(request, user)).token

const authHeaders = (token) => ({ Authorization: 'Bearer ' + token })

// makes a request that must succeed and returns the parsed body
const call = async (request, token, url, { method = 'GET', body } = {}) => {
  const res = await request.fetch(apiUrl(url), {
    method,
    headers: authHeaders(token),
    data: body,
  })
  expect(res.ok(), `${method} ${url} returned ${res.status()}`).toBeTruthy()
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

const asAdmin = async (request, url, options) =>
  call(request, await tokenOf(request, TEST_ADMIN), url, options)

// Writes localStorage on the next page load, and right away if the app is already open.
// An init script is used because the page is usually still blank when logging in, the
// sessionStorage marker makes it run only once so that later logouts are not undone.
let storageChange = 0
const changeLocalStorage = async (page, key, value) => {
  const marker = `e2e-storage-change-${++storageChange}`
  const apply = ({ marker, key, value }) => {
    if (window.sessionStorage.getItem(marker)) return
    window.sessionStorage.setItem(marker, 'done')
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  }
  await page.addInitScript(apply, { marker, key, value })
  if (page.url().startsWith('http')) {
    await page.evaluate(apply, { marker, key, value })
  }
}

export const loginAs = async (page, user) => {
  const userData = await postLogin(page.request, user)
  // the app checks the instructor role after logging in, do the same here
  const { isInstructor } = await call(page.request, userData.token, 'api/users/isInstructor')
  const loggedInUser = { ...userData, user: { ...userData.user, instructor: isInstructor } }
  await changeLocalStorage(page, 'loggedInUser', JSON.stringify(loggedInUser))
}

export const loginAsUnregisteredUser = (page) => loginAs(page, TEST_USER)
export const loginAsRegisteredUser = (page) => loginAs(page, TEST_USER2)
export const loginAsRegisteredIndicatedUser = (page) => loginAs(page, TEST_USER3)
export const loginAsAdmin = (page) => loginAs(page, TEST_ADMIN)
export const loginAsInstructor = (page) => loginAs(page, TEST_INSTRUCTOR)

export const logout = (page) => changeLocalStorage(page, 'loggedInUser', null)

// makes an API request as the given user (or anonymously when user is null)
// without failing on error statuses, for testing access control
export const requestAs = async (request, user, { url, method = 'GET', body } = {}) => {
  const token = user ? await tokenOf(request, user) : null
  const res = await request.fetch(apiUrl(url), {
    method,
    headers: token ? authHeaders(token) : {},
    data: body,
  })
  const text = await res.text()
  let resBody = text
  try {
    resBody = JSON.parse(text)
  } catch {
    // not json
  }
  return { status: res.status(), body: resBody }
}

/* QUESTION SETS */

const deleteQuestionSets = async (request, path) => {
  const { questionSets } = await asAdmin(request, path)
  for (const set of questionSets) {
    await asAdmin(request, `${path}/${set.id}`, { method: 'DELETE' })
  }
}

export const deleteRegistrationQuestions = (request) =>
  deleteQuestionSets(request, 'api/registrationQuestions')

export const createRegistrationQuestionSet = (request, name, questions) =>
  asAdmin(request, 'api/registrationQuestions', { method: 'POST', body: { name, questions } })

export const deleteReviewQuestions = (request) => deleteQuestionSets(request, 'api/reviewQuestions')

export const createReviewQuestionSet = (request, name, questions) =>
  asAdmin(request, 'api/reviewQuestions', { method: 'POST', body: { name, questions } })

export const deleteCustomerReviewQuestions = (request) =>
  deleteQuestionSets(request, 'api/customerReviewQuestions')

export const createCustomerReviewQuestionSet = (request, name, questions) =>
  asAdmin(request, 'api/customerReviewQuestions', { method: 'POST', body: { name, questions } })

export const setCustomerReviewQuestionSetToConfiguration = async (request, configurationId) => {
  const { questionSets } = await asAdmin(request, 'api/customerReviewQuestions')
  await asAdmin(request, `api/configurations/${configurationId}`, {
    method: 'PUT',
    body: {
      content: null,
      customer_review_question_set_id: questionSets[0].id,
      name: 'Konfiguraatio 1',
      registration_question_set_id: null,
      review_question_set1_id: null,
      review_question_set2_id: null,
    },
  })
}

/* CONFIGURATIONS AND TOPICS */

export const createConfiguration = async (request, configurationData) => {
  const {
    name,
    content,
    registration_question_set_id,
    review_question_set1_id,
    review_question_set2_id,
    customer_review_question_set_id,
  } = configurationData
  const { configuration } = await asAdmin(request, 'api/configurations', {
    method: 'POST',
    body: {
      name,
      content,
      registration_question_set_id,
      review_question_set1_id,
      review_question_set2_id,
      customer_review_question_set_id,
    },
  })
  return configuration
}

export const deleteConfiguration = (request, configurationId) =>
  asAdmin(request, `api/configurations/${configurationId}`, { method: 'DELETE' })

export const createNewTopic = (request, newTopicName, customerName, topicDescription) =>
  asAdmin(request, 'api/topics', {
    method: 'POST',
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

export const createTopic = async (request, topicContent, topicConfigurationId) => {
  const { topic } = await asAdmin(request, 'api/topics', {
    method: 'POST',
    body: { content: topicContent, configuration_id: topicConfigurationId },
  })
  return topic
}

export const setTopicActive = (request, topicId) =>
  asAdmin(request, `api/topics/${topicId}`, { method: 'PUT', body: { topic: { active: true } } })

/* PEER, CUSTOMER AND INSTRUCTOR REVIEWS */

export const setPeerReviewOneActive = async (
  request,
  configurationName,
  configurationId,
  questionSetName,
) => {
  const token = await tokenOf(request, TEST_ADMIN)
  const { questionSets } = await call(request, token, 'api/reviewQuestions')
  const set = questionSets.find((set) => set.name === questionSetName)
  await call(request, token, `api/configurations/${configurationId}`, {
    method: 'PUT',
    body: { name: configurationName, review_question_set1_id: set && set.id },
  })
  await call(request, token, 'api/registrationManagement', {
    method: 'POST',
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
}

export const deleteAllPeerReviews = async (request) => {
  const reviews = await asAdmin(request, 'api/peerreview/all')
  for (const review of reviews) {
    await asAdmin(request, `api/peerreview/${review.id}`, { method: 'DELETE' })
  }
}

export const createPeerReviews = (request, peerReviews) =>
  asAdmin(request, 'api/peerreview/insertTestData', { method: 'POST', body: peerReviews })

export const createCustomerReview = (request, customerReview) =>
  asAdmin(request, 'api/customerReview', { method: 'POST', body: { customerReview } })

export const deleteCustomerReviews = async (request) => {
  const { reviews } = await asAdmin(request, 'api/customerReview/')
  for (const review of reviews || []) {
    await asAdmin(request, `api/customerReview/${review.id}`, { method: 'DELETE' })
  }
}

export const deleteInstructorReviews = async (request) => {
  const { reviews } = await asAdmin(request, 'api/instructorReview/')
  for (const review of reviews || []) {
    await asAdmin(request, `api/instructorReview/${review.id}`, { method: 'DELETE' })
  }
}

/* EMAILS */

export const deleteAllEmailTemplates = (request) =>
  asAdmin(request, 'api/email/templates', { method: 'DELETE' })

export const updateEmailTemplate = (request, templateName, templateLanguage, text) => {
  const body = {
    topicAccepted: { finnish: '', english: '' },
    topicRejected: { finnish: '', english: '' },
  }
  body[templateName][templateLanguage] = text
  return asAdmin(request, 'api/email/templates', { method: 'POST', body })
}

export const updateAllEmailTemplates = (request, body) =>
  asAdmin(request, 'api/email/templates', { method: 'POST', body })

export const deleteSentEmails = (request) =>
  asAdmin(request, 'api/email/sent-emails', { method: 'DELETE' })

/* GROUPS */

export const createGroup = (request, groupData) => {
  const {
    name,
    topicId,
    configurationId,
    instructorId,
    isShortProject = false,
    studentIds,
  } = groupData
  return asAdmin(request, 'api/groups', {
    method: 'POST',
    body: { name, topicId, configurationId, instructorId, isShortProject, studentIds },
  })
}

export const getGroups = (request) => asAdmin(request, 'api/groups')

export const deleteAllGroups = async (request) => {
  const groups = await asAdmin(request, 'api/groups')
  for (const group of groups) {
    await asAdmin(request, `api/groups/${group.id}`, { method: 'DELETE' })
  }
}

/* SPRINTS AND TIME LOGS */

// sprints are created for the group of TEST_USER2
export const createSprint = async (request, { sprint, start_date, end_date }) =>
  call(request, await tokenOf(request, TEST_USER2), 'api/sprints', {
    method: 'POST',
    body: { start_date, end_date, sprint, user_id: TEST_USER2.headers.hypersonstudentid },
  })

// the sprints of the group of TEST_USER3
export const getSprints = async (request) =>
  call(request, await tokenOf(request, TEST_USER3), 'api/sprints')

export const deleteAllSprintsChartTest = async (request) => {
  const token = await tokenOf(request, TEST_USER3)
  const sprints = await call(request, token, 'api/sprints')
  for (const sprint of sprints) {
    await call(request, token, `api/sprints/${sprint.id}`, { method: 'DELETE' })
  }
}

export const deleteAllSprints = async (request) => {
  const token = await tokenOf(request, TEST_ADMIN)
  const sprints = await call(request, token, 'api/sprints')
  for (const sprint of sprints) {
    // may fail, e.g. when the sprint has time logs
    await request.delete(`api/sprints/${sprint.id}`, { headers: authHeaders(token) })
  }
}

const addTimelogEntryAs = async (request, user, timeLogEntryData) => {
  const { studentNumber, sprint, date, minutes, description, tags, groupId } = timeLogEntryData
  return call(request, await tokenOf(request, user), 'api/timelogs', {
    method: 'POST',
    body: { studentNumber, sprint, date, minutes, description, tags, groupId },
  })
}

export const addTimelogEntry = (request, data) => addTimelogEntryAs(request, TEST_USER2, data)
export const addTimelogEntryAlt = (request, data) => addTimelogEntryAs(request, TEST_USER3, data)

// deletes the time logs of TEST_USER3
export const deleteAllTimelogs = async (request) => {
  const token = await tokenOf(request, TEST_USER3)
  const timelogs = await call(request, token, 'api/timelogs')
  for (const timelog of timelogs) {
    await call(request, token, `api/timelogs/${timelog.id}`, { method: 'DELETE' })
  }
}

/* TAGS */

export const createTag = (request, tagTitle) =>
  asAdmin(request, 'api/tags', { method: 'POST', body: { title: tagTitle } })

export const deleteAllTags = async (request) => {
  const tags = await asAdmin(request, 'api/tags')
  for (const tag of tags) {
    await asAdmin(request, `api/tags/${tag.id}`, { method: 'DELETE' })
  }
}

/* UI HELPERS */

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

// selects a date with the MUI date picker that the given input belongs to
export const selectDate = async (page, input, date) => {
  const target = typeof date === 'string' ? new Date(date) : date
  const targetMonth = target.getMonth()
  const targetYear = target.getFullYear()

  await input
    .locator('xpath=ancestor::*[contains(@class, "MuiFormControl-root")][1]')
    .locator('button')
    .first()
    .click()

  // the dialog of a previous selection may still be closing, use the newest one
  const dialog = page.locator('div[role="dialog"]').last()
  const header = dialog.locator('.MuiPickersCalendarHeader-labelContainer')

  for (let i = 0; i < 240; i++) {
    const label = (await header.textContent()).toLowerCase()
    const yearMatch = label.match(/\d{4}/)
    const currentYear = yearMatch ? parseInt(yearMatch[0]) : targetYear
    const currentMonth = fiMonths.findIndex((month) => label.includes(month))

    if (currentYear !== targetYear) {
      await header.click()
      await dialog.locator('.MuiYearCalendar-root button', { hasText: String(targetYear) }).click()
      await expect(header).toContainText(String(targetYear))
      continue
    }
    if (currentMonth === targetMonth) {
      await dialog
        .locator('[role="gridcell"]:not([disabled])')
        .filter({ hasText: new RegExp(`^${target.getDate()}$`) })
        .first()
        .click()
      return
    }
    const title = targetMonth < currentMonth ? 'Previous month' : 'Next month'
    await dialog.locator(`button[title="${title}"]`).click()
    await expect(header).not.toHaveText(label, { ignoreCase: true })
  }
  throw new Error(`could not select date ${target}`)
}
