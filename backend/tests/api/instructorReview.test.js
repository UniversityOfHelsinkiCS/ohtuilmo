const { describe, test, expect, beforeEach, afterAll } = require('@jest/globals')
const request = require('supertest')

const { app, server, db } = require('../../index')
const { loginAs } = require('../utils/login')
const { student, otherStudent, instructor, createUsers, createGroup } = require('../utils/fixtures')

let ownGroup
let otherGroup

const validSheet = [{ answers: [{ type: 'text', answer: 'Hyvin toimiva ryhmä' }] }]

const sendReview = async (group, answerSheet = validSheet) => {
  const login = await loginAs(app, instructor.student_number)
  return request(app)
    .post('/api/instructorreview')
    .set('Authorization', `bearer ${login.token}`)
    .send({
      instructorReview: {
        group_id: group.id,
        group_name: group.name,
        user_id: instructor.student_number,
        answer_sheet: answerSheet,
      },
    })
}

const name = { first_names: 'Olli', last_name: 'Opiskelija' }

describe('Instructor review', () => {
  test('can be given to an instructed group', async () => {
    const res = await sendReview(ownGroup)

    expect(res.statusCode).toEqual(201)
    expect(await db.InstructorReview.count()).toEqual(1)
  })

  test('can not be given to a group of another instructor', async () => {
    const res = await sendReview(otherGroup)

    expect(res.statusCode).toEqual(403)
    expect(await db.InstructorReview.count()).toEqual(0)
  })

  test('validation errors name the student and the question', async () => {
    const res = await sendReview(ownGroup, [
      { name, answers: [{ type: 'text', header: 'Ohjaajan kommentit', answer: '' }] },
    ])

    expect(res.statusCode).toEqual(400)
    expect(res.body.error).toEqual(
      'Olli Opiskelija: Ohjaajan kommentit: You must answer all questions',
    )
  })

  test('a missing answer is rejected with a message', async () => {
    const res = await sendReview(ownGroup, [
      { name, answers: [{ type: 'number', header: 'Arvosana' }] },
    ])

    expect(res.statusCode).toEqual(400)
    expect(res.body.error).toEqual('Olli Opiskelija: Arvosana: You must answer all questions')
  })

  test('an answer sheet that is not a list is rejected', async () => {
    const res = await sendReview(ownGroup, { foo: 'bar' })

    expect(res.statusCode).toEqual(400)
    expect(await db.InstructorReview.count()).toEqual(0)
  })

  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true, restartIdentity: true })
    await createUsers(db)
    ownGroup = await createGroup(db, [student.student_number], instructor.student_number)
    otherGroup = await createGroup(db, [otherStudent.student_number])
  })
})

afterAll(async () => {
  server.close()
  // https://github.com/forwardemail/supertest/issues/520#issuecomment-1242761766
  await new Promise((res) => {
    setTimeout(res, 1)
  })
})
