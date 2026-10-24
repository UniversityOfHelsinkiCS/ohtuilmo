import { test, expect } from '../test'
import { TEST_USER2, TEST_USER3, TEST_INSTRUCTOR, TEST_INSTRUCTOR2 } from '../common'
import {
  addTimelogEntry,
  createGroup,
  createSprint,
  createTopic,
  deleteAllGroups,
  loginAsInstructor,
  loginAsRegisteredUser,
  requestAs,
} from '../helpers'

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

// the topics are put in the seeded second configuration, so that they do not
// change the topic count of configuration 1 that topicListPage checks
const TOPIC_CONFIGURATION_ID = 2

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
const setUpGroups = async (request) => {
  await deleteAllGroups(request)
  // logging in creates the users
  await requestAs(request, TEST_INSTRUCTOR, { url: 'api/groups' })
  await requestAs(request, TEST_INSTRUCTOR2, { url: 'api/groups' })
  await requestAs(request, TEST_USER3, { url: 'api/groups' })

  const topic = await createTopic(request, topicContent, TOPIC_CONFIGURATION_ID)
  await createGroup(request, {
    name: 'Instructed group',
    topicId: topic.id,
    configurationId: 1,
    instructorId: INSTRUCTOR_ID,
    studentIds: [STUDENT_ID],
  })
  await createGroup(request, {
    name: 'Group of the other instructor',
    topicId: 1,
    configurationId: 1,
    instructorId: INSTRUCTOR2_ID,
    studentIds: [OTHER_STUDENT_ID],
  })
}

let group

const addTimeLog = async (request, description) => {
  const today = new Date()
  await addTimelogEntry(request, {
    studentNumber: STUDENT_ID,
    sprint: 1,
    date: formatDate(today),
    minutes: 60,
    description,
    tags: [],
    groupId: group.id,
  })
  const res = await requestAs(request, TEST_INSTRUCTOR, { url: 'api/instructorTimeLogs' })
  return res.body.find((log) => log.description === description).id
}

test.describe('Access control', () => {
  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext({
      baseURL: test.info().project.use.baseURL,
    })
    await setUpGroups(request)
    const today = new Date()
    await createSprint(request, {
      sprint: 1,
      start_date: formatDate(addDays(today, -1)),
      end_date: formatDate(addDays(today, 7)),
    })
    await request.dispose()
  })

  test.beforeEach(async ({ request }) => {
    const res = await requestAs(request, TEST_INSTRUCTOR, { url: 'api/groups' })
    group = res.body.find((g) => g.name === 'Instructed group')
  })

  test.describe('API', () => {
    test('an anonymous user can not copy topics', async ({ request }) => {
      const res = await requestAs(request, null, { url: 'api/topics/1/copy', method: 'POST' })
      expect(res.status).toBe(401)
    })

    test('a student can not copy topics', async ({ request }) => {
      const res = await requestAs(request, TEST_USER2, {
        url: 'api/topics/1/copy',
        method: 'POST',
      })
      expect(res.status).toBe(401)
    })

    test('a student can not list groups', async ({ request }) => {
      const res = await requestAs(request, TEST_USER2, { url: 'api/groups' })
      expect(res.status).toBe(401)
    })

    test('a customer review is rejected without a valid review link', async ({ request }) => {
      const withoutSecret = await requestAs(request, null, {
        url: 'api/customerReview',
        method: 'POST',
        body: { customerReview: { answer_sheet: [], group_id: group.id } },
      })
      expect(withoutSecret.status).toBe(401)

      const wrongSecret = await requestAs(request, null, {
        url: 'api/customerReview',
        method: 'POST',
        body: {
          customerReview: { answer_sheet: [], group_id: group.id, secret_id: 'not-a-secret' },
        },
      })
      expect(wrongSecret.status).toBe(401)
    })

    test('a customer review is accepted once with a valid review link', async ({ request }) => {
      const topic = await createTopic(request, topicContent, TOPIC_CONFIGURATION_ID)
      const reviewedGroup = await createGroup(request, {
        name: 'Reviewed group',
        topicId: topic.id,
        configurationId: 1,
        instructorId: null,
        studentIds: [],
      })
      const review = {
        url: 'api/customerReview',
        method: 'POST',
        body: {
          customerReview: {
            answer_sheet: [],
            group_id: reviewedGroup.id,
            secret_id: topic.secret_id,
          },
        },
      }
      expect((await requestAs(request, null, review)).status).toBe(201)
      expect((await requestAs(request, null, review)).status).toBe(400)
    })

    test('a student can not create sprints for the group of another student', async ({
      request,
    }) => {
      const today = new Date()
      await requestAs(request, TEST_USER2, {
        url: 'api/sprints',
        method: 'POST',
        body: {
          sprint: 2,
          start_date: formatDate(addDays(today, 8)),
          end_date: formatDate(addDays(today, 14)),
          user_id: OTHER_STUDENT_ID,
        },
      })
      // the sprint goes to the group of the requester, never to the other group
      const res = await requestAs(request, TEST_USER3, { url: 'api/sprints' })
      expect(res.body).toHaveLength(0)
    })

    test('another instructor can not move or delete time logs of the group', async ({
      request,
    }) => {
      const logId = await addTimeLog(request, 'Log of another instructor test')
      const deleteRes = await requestAs(request, TEST_INSTRUCTOR2, {
        url: `api/instructorTimeLogs/${logId}`,
        method: 'DELETE',
      })
      expect(deleteRes.status).toBe(403)
      const moveRes = await requestAs(request, TEST_INSTRUCTOR2, {
        url: `api/instructorTimeLogs/${logId}/moveToNext`,
        method: 'PATCH',
      })
      expect(moveRes.status).toBe(403)
    })

    test('the instructor of the group can delete its time logs', async ({ request }) => {
      const logId = await addTimeLog(request, 'Log of the own instructor test')
      const res = await requestAs(request, TEST_INSTRUCTOR, {
        url: `api/instructorTimeLogs/${logId}`,
        method: 'DELETE',
      })
      expect(res.status).toBe(200)
    })
  })

  test.describe('Pages', () => {
    test('an instructor sees the instructor menu but not the admin menu', async ({ page }) => {
      await loginAsInstructor(page)
      await page.goto('')
      await page.locator('#hamburger-menu-button').click()
      const menu = page.locator('#hamburger-menu-popper')
      await expect(menu.getByText('Group time logs').first()).toBeAttached()
      await expect(menu.getByText('Peer reviews').first()).toBeAttached()
      await expect(menu.getByText('Group Management')).toHaveCount(0)
      await expect(menu.getByText('Users')).toHaveCount(0)
    })

    test('an instructor can not open admin pages', async ({ page }) => {
      await loginAsInstructor(page)
      await page.goto('administration/groups')
      await expect(page.getByText('Unauthorized.')).toBeVisible()
    })

    test('a student can not open instructor pages', async ({ page }) => {
      await loginAsRegisteredUser(page)
      await page.goto('instructorpage')
      await expect(page.getByText('Unauthorized.')).toBeVisible()
      await page.goto('instructor-timelogs')
      await expect(page.getByText('Unauthorized.')).toBeVisible()
    })

    test('the instructor time logs page restores its selection from the URL', async ({ page }) => {
      await addTimeLog(page.request, 'Log shown by url test')
      await loginAsInstructor(page)
      await page.goto(`instructor-timelogs?configuration=1&group=${group.id}&student=${STUDENT_ID}`)
      await expect(page.getByText('Timelogs by Instructed group')).toBeVisible()
      await expect(page.getByText('Log shown by url test').first()).toBeVisible()
    })
  })
})
