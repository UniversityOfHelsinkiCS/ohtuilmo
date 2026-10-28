const { describe, test, expect, beforeEach, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')

const { app, server, db } = require('../../index')
const {
  createAndLoginAs,
  createTestUser,
  testUser,
  testUsers,
  resetUsers,
} = require('../utils/login')

const otherUser = testUsers[1]

describe("User's email", () => {
  test('should be updated with matching sn', async () => {
    const login = await createAndLoginAs(db, app, testUser)

    const res = await request(app)
      .put(`/api/users/${testUser.student_number}`)
      .set('Authorization', `bearer ${login.token}`)
      .send({ email: 'uusi@posti.fi' })

    expect(res.statusCode).toEqual(200)
    expect(res.body.user.email).toEqual('uusi@posti.fi')
  })

  test("shouldn't be updated with different sn", async () => {
    const login = await createAndLoginAs(db, app, testUser)
    await createTestUser(db, otherUser)

    const res = await request(app)
      .put(`/api/users/${otherUser.student_number}`)
      .set('Authorization', `bearer ${login.token}`)
      .send({ email: 'uusi@posti.fi' })

    expect(res.statusCode).toEqual(403)
    const user = await db.User.findByPk(String(otherUser.student_number))
    expect(user.email).toEqual(otherUser.email)
  })

  test("shouldn't be updated for non-existent user", async () => {
    const login = await createAndLoginAs(db, app, testUser)
    await db.User.destroy({ where: { student_number: String(testUser.student_number) } })

    const res = await request(app)
      .put(`/api/users/${testUser.student_number}`)
      .set('Authorization', `bearer ${login.token}`)
      .send({ email: 'uusi@posti.fi' })

    expect(res.statusCode).toEqual(400)
  })
})

describe("User's research consent", () => {
  test('can be updated by the user', async () => {
    const login = await createAndLoginAs(db, app, testUser)

    const res = await request(app)
      .put(`/api/users/consent/${testUser.student_number}`)
      .set('Authorization', `bearer ${login.token}`)
      .send({ research_consent: true })

    expect(res.statusCode).toEqual(200)
    expect(res.body.user.research_consent).toEqual(true)
  })

  test('can not be updated for another user', async () => {
    const login = await createAndLoginAs(db, app, testUser)
    await createTestUser(db, otherUser)

    const res = await request(app)
      .put(`/api/users/consent/${otherUser.student_number}`)
      .set('Authorization', `bearer ${login.token}`)
      .send({ research_consent: true })

    expect(res.statusCode).toEqual(403)
    const user = await db.User.findByPk(String(otherUser.student_number))
    expect(user.research_consent).not.toEqual(true)
  })

  test('can not be updated without login', async () => {
    await createTestUser(db, testUser)

    const res = await request(app)
      .put(`/api/users/consent/${testUser.student_number}`)
      .send({ research_consent: true })

    expect(res.statusCode).toEqual(401)
  })
})

beforeAll(async () => {
  await db.sequelize.truncate({ cascade: true, restartIdentity: true })
})
beforeEach(async () => {
  await resetUsers(db)
})
afterAll(async () => {
  server.close()
  // https://github.com/forwardemail/supertest/issues/520#issuecomment-1242761766
  await new Promise((res) => {
    setTimeout(res, 1)
  })
})
