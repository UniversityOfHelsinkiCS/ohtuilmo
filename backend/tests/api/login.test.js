const { describe, test, expect, beforeEach, beforeAll, afterAll } = require('@jest/globals')
const jwt = require('jsonwebtoken')
const request = require('supertest')

const config = require('../../config/index')
const { app, server, db } = require('../../index')
const { createTestUser, resetUsers } = require('../utils/login')

const testUser = {
  username: 'mluukkai',
  student_number: '1234567890',
  first_names: 'Matti',
  last_name: 'Luukkainen',
  email: 'jokutosihassu@sähköposti.fi',
  admin: false,
}

// JWT creates changing iat and exp fields depending on the time signed, not good for tests
const filterOutIatJWT = (verifiedToken) => {
  // eslint-disable-next-line no-unused-vars
  const { iat, exp, ...rest } = verifiedToken
  return rest
}

describe('Login', () => {
  test('fails with missing student number', async () => {
    const res = await request(app).post('/api/login')

    expect(res.statusCode).toEqual(401)
    expect(res.body.error).toEqual('Student number missing from headers.')
    expect(res.header['cache-control']).toEqual('no-store')
  })
  test('is successful with existing student number', async () => {
    const resHyPersonId = await request(app)
      .post('/api/login')
      .set('hypersonstudentid', testUser.student_number)

    const resSchacCode = await request(app)
      .post('/api/login')
      .set('schacpersonaluniquecode', testUser.student_number)

    const tokenHyPersonId = filterOutIatJWT(jwt.verify(resHyPersonId.body.token, config.secret))
    const tokenSchacCode = filterOutIatJWT(jwt.verify(resSchacCode.body.token, config.secret))

    expect(resHyPersonId.statusCode).toEqual(200)
    expect(resHyPersonId.headers['cache-control']).toEqual('no-store')
    expect(Object.keys(resHyPersonId.body)).toContain('user', 'token')
    expect(tokenHyPersonId).toEqual({
      id: testUser.student_number,
      admin: testUser.admin,
      instructor: false,
    })

    expect(resSchacCode.statusCode).toEqual(200)
    expect(resSchacCode.headers['cache-control']).toEqual('no-store')
    expect(Object.keys(resSchacCode.body)).toContain('user', 'token')
    expect(tokenSchacCode).toEqual({
      id: testUser.student_number,
      admin: testUser.admin,
      instructor: false,
    })
  })
  test('is successful with new student number', async () => {
    // user doesn't exist in database
    expect(await db.User.findAll({ where: { student_number: '13355557777777' } })).toHaveLength(0)

    const res = await request(app)
      .post('/api/login')
      .set('hypersonstudentid', 13355557777777)
      .set('uid', 'paavi')
      .set('givenname', 'Paavali')
      .set('sn', 'of Tarsus')
      .set('mail', 'paavali@kirje.gov')

    const token = filterOutIatJWT(jwt.verify(res.body.token, config.secret))

    expect(res.statusCode).toEqual(200)
    expect(res.headers['cache-control']).toEqual('no-store')
    expect(Object.keys(res.body)).toContain('user', 'token')
    expect(token).toEqual({ id: '13355557777777', admin: testUser.admin, instructor: false })

    // User is created after query
    expect(await db.User.findAll({ where: { student_number: '13355557777777' } })).not.toHaveLength(
      0,
    )
  })

  test('returns a token that expires', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('hypersonstudentid', testUser.student_number)

    const { iat, exp } = jwt.verify(res.body.token, config.secret)
    expect(exp).toBeDefined()
    expect(exp - iat).toBeLessThanOrEqual(24 * 60 * 60)
  })

  test('expired token is rejected', async () => {
    const expiredToken = jwt.sign(
      { id: testUser.student_number, admin: false, instructor: false },
      config.secret,
      { expiresIn: -10 },
    )

    const res = await request(app)
      .get('/api/tokenCheck/login')
      .set('Authorization', `bearer ${expiredToken}`)

    expect(res.statusCode).toEqual(401)
  })

  beforeAll(async () => {
    await db.sequelize.truncate({ cascade: true, restartIdentity: true })
  })
  beforeEach(async () => {
    await resetUsers(db)
    await createTestUser(db, testUser)
  })
  afterAll(async () => {
    server.close()
    // https://github.com/forwardemail/supertest/issues/520#issuecomment-1242761766
    await new Promise((res) => {
      setTimeout(res, 1)
    })
  })
})
