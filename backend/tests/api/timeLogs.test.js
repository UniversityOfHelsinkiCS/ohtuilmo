const { describe, test, expect, beforeEach, afterAll } = require('@jest/globals')
const request = require('supertest')

const { app, server, db } = require('../../index')
const { loginAs } = require('../utils/login')
const { student, otherStudent, createUsers, createGroup } = require('../utils/fixtures')

const day = 24 * 60 * 60 * 1000
const today = new Date().toISOString().slice(0, 10)

let ownGroup
let otherGroup

const createSprint = (group) =>
  db.Sprint.create({
    sprint: 1,
    start_date: new Date(Date.now() - day),
    end_date: new Date(Date.now() + day),
    group_id: group.id,
  })

const logTime = async (groupId) => {
  const login = await loginAs(app, student.student_number)
  return request(app)
    .post('/api/timelogs')
    .set('Authorization', `bearer ${login.token}`)
    .send({ sprint: 1, date: today, minutes: 60, description: 'Koodailua', tags: [], groupId })
}

describe('Time logs', () => {
  test('can be added to a sprint of the own group', async () => {
    const res = await logTime(ownGroup.id)

    expect(res.statusCode).toEqual(201)
    expect(await db.TimeLog.count()).toEqual(1)
  })

  test('can not be added to a sprint of another group', async () => {
    const res = await logTime(otherGroup.id)

    expect(res.statusCode).toEqual(403)
    expect(await db.TimeLog.count()).toEqual(0)
  })

  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true, restartIdentity: true })
    await createUsers(db)
    ownGroup = await createGroup(db, [student.student_number])
    otherGroup = await createGroup(db, [otherStudent.student_number])
    await createSprint(ownGroup)
    await createSprint(otherGroup)
  })
})

afterAll(async () => {
  server.close()
  // https://github.com/forwardemail/supertest/issues/520#issuecomment-1242761766
  await new Promise((res) => {
    setTimeout(res, 1)
  })
})
