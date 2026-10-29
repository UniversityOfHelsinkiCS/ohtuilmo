const { describe, test, expect, beforeEach, afterAll } = require('@jest/globals')
const request = require('supertest')

const { app, server, db } = require('../../index')
const { loginAs } = require('../utils/login')
const { student, admin, otherStudent, createUsers, createGroup } = require('../utils/fixtures')

const day = 24 * 60 * 60 * 1000

let ownGroup
let otherGroup
let ownSprint
let otherSprint

const createSprint = (group) =>
  db.Sprint.create({
    sprint: 1,
    start_date: new Date(Date.now() - day),
    end_date: new Date(Date.now() + day),
    group_id: group.id,
  })

const initialModelsUsed = {
  claude: false,
  curreChat: true,
  cursor: false,
  copilot: true,
  codex: false,
  other: true,
  otherExamples: 'En oikeesti käyttänyt mitään, mutta laitoin silti',
}
// options none | consult | generate
const initialHowUsed = {
  understandCode: 'none',
  debugging: 'none',
  features: 'generate',
  refactoring: 'none',
  codeReview: 'consult',
  planning: 'none',
  uiPlanning: 'none',
  documentation: 'none',
  tests: 'generate',
  databases: 'none',
  infra: 'none',
}
const createAIUsage = async (groupId, sprint, data, type = '') => {
  const login =
    type === 'other'
      ? await loginAs(app, otherStudent.student_number)
      : await loginAs(app, student.student_number)
  return request(app).post('/api/aiusage').set('Authorization', `bearer ${login.token}`).send({
    groupId,
    sprint,
    howUsed: data.howUsed,
    modelsUsed: data.modelsUsed,
  })
}
const updateAIUsage = async (groupId, sprint, data) => {
  const login = await loginAs(app, student.student_number)
  return request(app).put(`/api/aiusage`).set('Authorization', `bearer ${login.token}`).send({
    groupId,
    sprint,
    howUsed: data.howUsed,
    modelsUsed: data.modelsUsed,
  })
}

const getAIUsage = async (role) => {
  const login =
    role === 'student'
      ? await loginAs(app, student.student_number)
      : await loginAs(app, admin.student_number)
  console.log(role, login.user)
  return request(app).get(`/api/aiusage/${role}`).set('Authorization', `bearer ${login.token}`)
}

describe('Users AI usage', () => {
  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true, restartIdentity: true })
    await createUsers(db)
    ownGroup = await createGroup(db, [student.student_number])
    otherGroup = await createGroup(db, [otherStudent.student_number], admin.student_number)
    ownSprint = await createSprint(ownGroup)
    otherSprint = await createSprint(otherGroup)
  })
  test('can be created to own group and sprint', async () => {
    const data = {
      howUsed: initialHowUsed,
      modelsUsed: initialModelsUsed,
    }
    const res = await createAIUsage(ownGroup.id, ownSprint.id, data)

    expect(res.statusCode).toEqual(201)
    expect(await db.UserAIUsage.count()).toEqual(1)
  })

  test('cannot be added to non existing or other group`s sprint', async () => {
    const data = {
      howUsed: initialHowUsed,
      modelsUsed: initialModelsUsed,
    }
    const res = await createAIUsage(ownGroup.id, otherSprint.id, data)

    expect(res.statusCode).toEqual(404)
    expect(res._body.error).toEqual('Sprint not found.')
    expect(await db.UserAIUsage.count()).toEqual(0)
  })

  test('cannot be added to a other group', async () => {
    const data = {
      howUsed: initialHowUsed,
      modelsUsed: initialModelsUsed,
    }
    const res = await createAIUsage(otherGroup.id, otherSprint.id, data)

    expect(res.statusCode).toEqual(403)
    expect(res._body.error).toEqual('Forbidden, not a member of the group')
    expect(await db.UserAIUsage.count()).toEqual(0)
  })

  test('cannot be created with malformatted input', async () => {
    const data = {
      howUsed: { ...initialHowUsed, databases: 'jippii' },
      modelsUsed: initialModelsUsed,
    }
    const res = await createAIUsage(ownGroup.id, ownSprint.id, data)

    expect(res.statusCode).toEqual(400)
    expect(res._body.error).toEqual('Data malformatted')
    expect(await db.UserAIUsage.count()).toEqual(0)
  })

  test('can update AI usage of the sprint', async () => {
    let data = {
      howUsed: initialHowUsed,
      modelsUsed: initialModelsUsed,
    }
    await createAIUsage(ownGroup.id, ownSprint.id, data)

    data.modelsUsed = {
      claude: true,
      curreChat: true,
      cursor: true,
      copilot: true,
      codex: false,
      other: false,
      otherExamples: '',
    }
    const res = await updateAIUsage(ownGroup.id, ownSprint.id, data)

    expect(res.statusCode).toEqual(200)
    expect(await db.UserAIUsage.count()).toEqual(1)
    expect(res._body[0].modelsUsed).toEqual(data.modelsUsed)
  })

  test('cannot update AI usage to sprint that does not exist for group', async () => {
    let data = {
      howUsed: initialHowUsed,
      modelsUsed: initialModelsUsed,
    }
    await createAIUsage(ownGroup.id, ownSprint.id, data)

    const res = await updateAIUsage(ownGroup.id, otherSprint.id, data)

    expect(res.statusCode).toEqual(404)
    expect(res._body.error).toEqual('Not found')
  })

  test('cannot update AI usage for different group', async () => {
    let data = {
      howUsed: initialHowUsed,
      modelsUsed: initialModelsUsed,
    }
    await createAIUsage(ownGroup.id, ownSprint.id, data)

    const res = await updateAIUsage(otherGroup.id, ownSprint.id, data)

    expect(res.statusCode).toEqual(403)
    expect(res._body.error).toEqual('Forbidden')
  })
  // TODO: check sprint closed validation
  test('gets own data', async () => {
    let data = {
      howUsed: initialHowUsed,
      modelsUsed: initialModelsUsed,
    }
    await createAIUsage(ownGroup.id, ownSprint.id, data)
    const res = await getAIUsage('student')

    expect(res.statusCode).toEqual(200)
    expect(res._body.length).toEqual(1)
    expect(res._body[0].studentNumber).toEqual('111111111')
  })
  //TODO: this also for instructor

  test('teachers gets own groups` data', async () => {
    let data = {
      howUsed: initialHowUsed,
      modelsUsed: initialModelsUsed,
    }
    await createAIUsage(ownGroup.id, ownSprint.id, data)
    await createAIUsage(otherGroup.id, otherSprint.id, data, 'other')
    const res = await getAIUsage('teacher')
    expect(res.statusCode).toEqual(200)
    expect(res._body.length).toEqual(1)
  })
})

afterAll(async () => {
  server.close()
  // https://github.com/forwardemail/supertest/issues/520#issuecomment-1242761766
  await new Promise((res) => {
    setTimeout(res, 1)
  })
})
