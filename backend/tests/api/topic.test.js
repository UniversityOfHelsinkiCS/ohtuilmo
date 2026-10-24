const { describe, test, expect, beforeEach, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')

// sending emails always fails, emails are sent only when enabled in the config
jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: (options, callback) => callback(new Error('SMTP server is down')),
  }),
}))

const config = require('../../config')

const { app, server, db } = require('../../index')
const { createAndLoginAs, testAdmin, resetUsers } = require('../utils/login')
const {
  createTestRegistrationManagement,
  resetRegistrationManagements,
} = require('../utils/registrationManagement')
const { createTestConfiguration, resetConfigurations } = require('../utils/configuration')
const { testContent } = require('../utils/topic')

describe('Topics', () => {
  test('should not be created with missing registration management open', async () => {
    const login = await createAndLoginAs(db, app, testAdmin)

    const res = await request(app)
      .post('/api/topics')
      .set('Authorization', `bearer ${login.token}`)
      .send({ testContent, configuration_id: 1 })

    expect(res.statusCode).toEqual(400)
    expect(Object.keys(res.body)).toContain('error')
    expect(res.body.error).toEqual('topic registration is not currently open')
  })
  test('should not be created with missing data', async () => {
    const login = await createAndLoginAs(db, app, testAdmin)
    await createTestRegistrationManagement(db)

    const resContent = await request(app)
      .post('/api/topics')
      .set('Authorization', `bearer ${login.token}`)
      .send({ configuration_id: '' })

    const resConfigurationId = await request(app)
      .post('/api/topics')
      .set('Authorization', `bearer ${login.token}`)
      .send({ content: testContent, configuration_id: '' })

    expect(resConfigurationId.statusCode).toEqual(400)
    expect(Object.keys(resConfigurationId.body)).toContain('error')
    expect(resConfigurationId.body.error).toEqual('Topic must be associated with configuration')

    expect(resContent.statusCode).toEqual(400)
    expect(Object.keys(resContent.body)).toContain('error')
    expect(resContent.body.error).toEqual('content undefined')
  })
  test('should be created with correct data', async () => {
    const login = await createAndLoginAs(db, app, testAdmin)
    const configuration_id = await createTestConfiguration(db)
    await createTestRegistrationManagement(db, configuration_id)

    const res = await request(app)
      .post('/api/topics')
      .set('Authorization', `bearer ${login.token}`)
      .send({ content: testContent, configuration_id })

    expect(res.statusCode).toEqual(200)
  })

  test('should be created even if sending the secret link email fails', async () => {
    const configuration_id = await createTestConfiguration(db)
    await createTestRegistrationManagement(db, configuration_id)
    const unhandledRejection = jest.fn()
    process.on('unhandledRejection', unhandledRejection)
    config.email.isEnabled = true

    try {
      const res = await request(app)
        .post('/api/topics')
        .send({ content: testContent, configuration_id })

      expect(res.statusCode).toEqual(200)
      // a rejected email promise that nobody handles would crash the server
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(unhandledRejection).not.toHaveBeenCalled()
    } finally {
      config.email.isEnabled = false
      process.off('unhandledRejection', unhandledRejection)
    }
  })

  test('secret link can update the content but not activate the topic', async () => {
    const configuration_id = await createTestConfiguration(db)
    const topic = await db.Topic.create({
      active: false,
      configuration_id,
      content: testContent,
      secret_id: 'asalainenlinkki',
    })

    const res = await request(app)
      .put('/api/topics/asalainenlinkki')
      .send({ active: true, content: { ...testContent, title: 'Uusi otsikko' }, acronym: 'UO' })

    expect(res.statusCode).toEqual(200)
    await topic.reload()
    expect(topic.active).toEqual(false)
    expect(topic.content.title).toEqual('Uusi otsikko')
    expect(topic.acronym).toEqual('UO')
  })

  test('admin can activate a topic', async () => {
    const login = await createAndLoginAs(db, app, testAdmin)
    const configuration_id = await createTestConfiguration(db)
    const topic = await db.Topic.create({
      active: false,
      configuration_id,
      content: testContent,
      secret_id: 'asalainenlinkki',
    })

    const res = await request(app)
      .put(`/api/topics/${topic.id}`)
      .set('Authorization', `bearer ${login.token}`)
      .send({ active: true, content: testContent })

    expect(res.statusCode).toEqual(200)
    await topic.reload()
    expect(topic.active).toEqual(true)
  })

  beforeEach(async () => {
    await resetUsers(db)
    await resetConfigurations(db)
    await resetRegistrationManagements(db)
    await db.Topic.truncate({ cascade: true })
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
