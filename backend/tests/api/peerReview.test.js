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

const answerSheet = [{ type: 'number', id: 0, questionHeader: 'Tunnit', answer: 120 }]

let group

const openPeerReview = async (open = true, round = 1) => {
  await db.RegistrationManagement.create({
    peer_review_conf: group.configurationId,
    peer_review_open: open,
    peer_review_round: round,
    project_registration_conf: group.configurationId,
    project_registration_open: false,
    project_registration_message: '',
    project_registration_info: '',
    topic_registration_conf: group.configurationId,
    topic_registration_open: false,
    topic_registration_message: '',
  })
}

const sendPeerReview = async (peerReview, user = student) => {
  const login = await loginAs(app, user.student_number)
  return request(app)
    .post('/api/peerreview')
    .set('Authorization', `bearer ${login.token}`)
    .send({ peerReview: { user_id: user.student_number, ...peerReview } })
}

describe('Peer review', () => {
  test('is saved for the open peer review configuration and round', async () => {
    await openPeerReview()
    const otherConfiguration = await db.Configuration.create({ name: 'Toinen', active: false })

    const res = await sendPeerReview({
      answer_sheet: answerSheet,
      configuration_id: otherConfiguration.id,
      review_round: 2,
    })

    expect(res.statusCode).toEqual(201)
    const saved = await db.PeerReview.findAll({ where: { user_id: student.student_number } })
    expect(saved).toHaveLength(1)
    expect(saved[0].configuration_id).toEqual(group.configurationId)
    expect(saved[0].review_round).toEqual(1)
  })

  test('can not be sent twice for the same round', async () => {
    await openPeerReview()
    const peerReview = {
      answer_sheet: answerSheet,
      configuration_id: group.configurationId,
      review_round: 1,
    }

    await sendPeerReview(peerReview)
    const res = await sendPeerReview(peerReview)

    expect(res.statusCode).toEqual(400)
    expect(res.body.error).toEqual('peer review already submitted')
    expect(await db.PeerReview.count()).toEqual(1)
  })

  test('can not be sent when peer review is closed', async () => {
    await openPeerReview(false)

    const res = await sendPeerReview({
      answer_sheet: answerSheet,
      configuration_id: group.configurationId,
      review_round: 1,
    })

    expect(res.statusCode).toEqual(400)
    expect(res.body.error).toEqual('peer review is not open')
    expect(await db.PeerReview.count()).toEqual(0)
  })

  test('can not be sent in the name of another user', async () => {
    await openPeerReview()
    const login = await loginAs(app, student.student_number)

    const res = await request(app)
      .post('/api/peerreview')
      .set('Authorization', `bearer ${login.token}`)
      .send({
        peerReview: {
          user_id: otherStudent.student_number,
          answer_sheet: answerSheet,
          configuration_id: group.configurationId,
          review_round: 1,
        },
      })

    expect(res.statusCode).toEqual(401)
    expect(await db.PeerReview.count()).toEqual(0)
  })

  test('with unanswered peer questions is rejected with a message', async () => {
    await openPeerReview()

    const res = await sendPeerReview({
      answer_sheet: [
        { type: 'peerReview', id: 0, questionHeader: 'Arvio', peers: { 'Tiina Toinen': null } },
      ],
      configuration_id: group.configurationId,
      review_round: 1,
    })

    expect(res.statusCode).toEqual(400)
    expect(res.body.error).toEqual('You must answer all questions')
  })

  test('without an answer sheet array is rejected', async () => {
    await openPeerReview()

    const res = await sendPeerReview({
      answer_sheet: { foo: 'bar' },
      configuration_id: group.configurationId,
      review_round: 1,
    })

    expect(res.statusCode).toEqual(400)
  })

  describe('deletion', () => {
    const createReview = () =>
      db.PeerReview.create({
        user_id: student.student_number,
        configuration_id: group.configurationId,
        review_round: 1,
        answer_sheet: answerSheet,
      })

    const deleteAs = async (user, review) => {
      const login = await loginAs(app, user.student_number)
      return request(app)
        .delete(`/api/peerreview/${review.id}`)
        .set('Authorization', `bearer ${login.token}`)
    }

    test('the answers shown on the instructor page contain the review id', async () => {
      const review = await createReview()
      const login = await loginAs(app, admin.student_number)

      const res = await request(app)
        .get('/api/peerreview/forInstructor')
        .set('Authorization', `bearer ${login.token}`)

      expect(res.statusCode).toEqual(200)
      const answers = res.body.find((answers) => answers.group.id === group.id).round1Answers
      expect(answers).toHaveLength(1)
      expect(answers[0].id).toEqual(review.id)
    })

    test('can be done by an admin', async () => {
      const review = await createReview()

      const res = await deleteAs(admin, review)

      expect(res.statusCode).toEqual(204)
      expect(await db.PeerReview.count()).toEqual(0)
    })

    test('can not be done by the student', async () => {
      const review = await createReview()

      const res = await deleteAs(student, review)

      expect(res.statusCode).toEqual(401)
      expect(await db.PeerReview.count()).toEqual(1)
    })

    test('can not be done by the instructor of the group', async () => {
      await group.update({ instructorId: instructor.student_number })
      const review = await createReview()

      const res = await deleteAs(instructor, review)

      expect(res.statusCode).toEqual(401)
      expect(await db.PeerReview.count()).toEqual(1)
    })
  })

  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true, restartIdentity: true })
    await createUsers(db)
    group = await createGroup(db, [student.student_number, otherStudent.student_number])
  })
})

afterAll(async () => {
  server.close()
  // https://github.com/forwardemail/supertest/issues/520#issuecomment-1242761766
  await new Promise((res) => {
    setTimeout(res, 1)
  })
})
