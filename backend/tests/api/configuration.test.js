const { describe, test, expect, beforeEach, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')

const { app, server, db } = require('../../index')
const { createAndLoginAs, testAdmin, resetUsers } = require('../utils/login')
const {
  createTestRegistrationQuestionSet,
  resetRegistrationQuestionSets,
} = require('../utils/registrationQuestionSet')

describe('Configurations', () => {
  test('should not be created with missing data', async () => {
    const login = await createAndLoginAs(db, app, testAdmin)
    const res = await request(app)
      .post('/api/configurations')
      .set('Authorization', `bearer ${login.token}`)

    expect(res.statusCode).toEqual(400)
    expect(Object.keys(res.body)).toContain('error')
    expect(res.body.error).toEqual('name undefined')
  })

  test('should be created with valid data', async () => {
    const registrationQuestionSetId = await createTestRegistrationQuestionSet(db)
    const login = await createAndLoginAs(db, app, testAdmin)

    const res = await request(app)
      .post('/api/configurations')
      .set('Authorization', `bearer ${login.token}`)
      .send({ name: 'Konfiguraatiolainen', content: { registrationQuestionSetId } })

    expect(res.statusCode).toEqual(200)
    expect(Object.keys(res.body)).toContain('configuration')
    expect(res.body.configuration.name).toEqual('Konfiguraatiolainen')
  })
  test('should not be created with duplicate name', async () => {
    const registrationQuestionSetId = await createTestRegistrationQuestionSet(db)
    const login = await createAndLoginAs(db, app, testAdmin)

    const res = await request(app)
      .post('/api/configurations')
      .set('Authorization', `bearer ${login.token}`)
      .send({ name: 'Konfiguraatiolainen', content: { registrationQuestionSetId } })

    const resDuplicate = await request(app)
      .post('/api/configurations')
      .set('Authorization', `bearer ${login.token}`)
      .send({ name: 'Konfiguraatiolainen', content: { registrationQuestionSetId } })

    expect(res.statusCode).toEqual(200)
    expect(Object.keys(res.body)).toContain('configuration')
    expect(res.body.configuration.name).toEqual('Konfiguraatiolainen')

    expect(resDuplicate.statusCode).toEqual(400)
    expect(Object.keys(resDuplicate.body)).toContain('error')
    expect(resDuplicate.body.error).toEqual('name already in use')
  })

  test('review questions of a missing configuration are not found', async () => {
    const login = await createAndLoginAs(db, app, testAdmin)

    const res = await request(app)
      .get('/api/configurations/0/reviewquestions/1')
      .set('Authorization', `bearer ${login.token}`)

    expect(res.statusCode).toEqual(404)
  })

  test('customer review questions of a missing configuration are not found', async () => {
    const res = await request(app).get('/api/configurations/0/customerreviewquestions')

    expect(res.statusCode).toEqual(404)
  })

  beforeEach(async () => {
    await resetUsers(db)
    await resetRegistrationQuestionSets(db)
    await db.Configuration.truncate({ cascade: true })
  })
})

beforeAll(async () => {
  await db.sequelize.truncate({ cascade: true, restartIdentity: true })
})

afterAll(async () => {
  server.close()
  // https://github.com/forwardemail/supertest/issues/520#issuecomment-1242761766
  await new Promise((res) => {
    setTimeout(res, 1)
  })
})
