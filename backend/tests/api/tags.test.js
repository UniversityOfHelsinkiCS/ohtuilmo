const { describe, test, expect, beforeEach, afterAll } = require('@jest/globals')
const request = require('supertest')

const { app, server, db } = require('../../index')
const { loginAs } = require('../utils/login')
const {
  student,
  otherStudent,
  instructor,
  admin,
  createUsers,
  createGroup,
} = require('../utils/fixtures')

const getTagsOf = async (studentNumber, user) => {
  const login = await loginAs(app, user.student_number)
  return request(app)
    .get(`/api/tags/tagsByStudent/${studentNumber}`)
    .set('Authorization', `bearer ${login.token}`)
}

describe('Tags of a student', () => {
  test('can be read by the student', async () => {
    const res = await getTagsOf(student.student_number, student)
    expect(res.statusCode).toEqual(200)
  })

  test('can not be read by another student', async () => {
    const res = await getTagsOf(student.student_number, otherStudent)
    expect(res.statusCode).toEqual(403)
  })

  test('can be read by an instructor', async () => {
    const res = await getTagsOf(student.student_number, instructor)
    expect(res.statusCode).toEqual(200)
  })

  test('can be read by an admin', async () => {
    const res = await getTagsOf(student.student_number, admin)
    expect(res.statusCode).toEqual(200)
  })

  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true, restartIdentity: true })
    await createUsers(db)
    await createGroup(db, [student.student_number], instructor.student_number)
  })
})

afterAll(async () => {
  server.close()
  // https://github.com/forwardemail/supertest/issues/520#issuecomment-1242761766
  await new Promise((res) => {
    setTimeout(res, 1)
  })
})
