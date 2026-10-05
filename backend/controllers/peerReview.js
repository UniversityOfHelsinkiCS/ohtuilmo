const peerReviewRouter = require('express').Router()
const db = require('../models/index')
const { checkLogin, checkAdmin } = require('../middleware')

const handleDatabaseError = (res, error) => {
  console.log(error)
  res.status(500).json({ error: 'Something is wrong... try reloading the page' })
}

const isNil = (value) => value === undefined || value === null

const validateAnswerSheet = (peerReview) => {
  if (!peerReview) {
    return 'No peer review found'
  }

  const { user_id, answer_sheet, configuration_id, review_round } = peerReview

  if (isNil(user_id) || isNil(answer_sheet) || isNil(configuration_id) || isNil(review_round)) {
    return 'All attributes must be defined.'
  }
  let error = null
  for (let question of answer_sheet) {
    if (question.type === 'text') {
      error = validateTextAnswer(question)
      if (error) {
        return error
      }
    } else if (question.type === 'peerReview') {
      error = validatePeerReviewAnswer(question)
      if (error) {
        return error
      }
    } else if (question.type === 'radio') {
      error = validateRadioAnswer(question)
      if (error) {
        return error
      }
    } else if (question.type === 'radioOneliner') {
      error = validateRadioOneliner(question)
      if (error) {
        return error
      }
    } else if (question.type === 'number') {
      error = validateNumberAnswer(question)
      if (error) {
        return error
      }
    } else if (question.type !== 'info') {
      return 'Invalid question type in answer sheet'
    }
  }
  return null
}

const validatePeerReviewAnswer = (question) => {
  const peerAnswers = Object.values(question.peers)
  for (let answer of peerAnswers) {
    if (answer.length === 0) {
      return 'You must answer all questions'
    }
    if (answer.length < 7) {
      return 'Text answers must be over 7 characters long.'
    }
    if (answer.length > 200000) {
      return 'Text answer must be less than 200000 characters.'
    }
  }

  return null
}

const validateTextAnswer = (question) => {
  if (question.optional) {
    return null
  }
  if (question.answer.length === 0) {
    return 'You must answer all questions'
  }
  if (question.answer.length < 10) {
    return 'Text answers must be over 10 characters long.'
  }
  if (question.answer.length > 50000) {
    return 'Text answer must be less than 50000 characters.'
  }
  return null
}

const validateRadioAnswer = (question) => {
  let error = null
  Object.values(question.peers).forEach((value) => {
    if (isNil(value)) {
      error = 'You must answer all questions'
    }
  })
  return error
}

const validateRadioOneliner = (question) => {
  if (isNil(question.answer)) {
    return 'You must answer this question'
  }
}

const validateNumberAnswer = (question) => {
  if (isNil(question.answer)) {
    return 'You must answer all questions'
  }
  if (question.answer < 0) {
    return 'Number answer can not be negative'
  }
  if (question.answer > 100000) {
    return 'Number question can not be that large'
  }
  return null
}

const create = async (req, res) => {
  const { peerReview } = req.body
  try {
    const sentAnswerSheet = await db.PeerReview.create(peerReview)
    return res.status(201).json(sentAnswerSheet)
  } catch (err) {
    return handleDatabaseError(res, err)
  }
}

peerReviewRouter.post('/', checkLogin, async (req, res) => {
  const { peerReview } = req.body

  if (!peerReview.user_id || req.user.id !== peerReview.user_id) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const error = validateAnswerSheet(peerReview)

  if (error) {
    return res.status(400).json({ error })
  }
  create(req, res)
})

peerReviewRouter.post('/insertTestData', checkAdmin, async (req, res) => {
  const { peerReviews } = req.body

  for (let peerReview in peerReviews) {
    let error = validateAnswerSheet(peerReviews[peerReview])

    if (error) {
      return res.status(400).json({ error })
    }
  }
  createTestData(req, res)
})
const createTestData = async (req, res) => {
  const { peerReviews } = req.body
  let returnLog = []
  for (let peerReview in peerReviews) {
    try {
      const sentAnswerSheet = await db.PeerReview.create(peerReviews[peerReview])
      returnLog = returnLog.concat(sentAnswerSheet)
    } catch (err) {
      return handleDatabaseError(res, err)
    }
  }
  return res.status(201).json(returnLog)
}

peerReviewRouter.get('/', checkLogin, async (req, res) => {
  try {
    const registrationManagement = await db.RegistrationManagement.findOne({
      order: [['createdAt', 'DESC']],
    })

    const entries = await db.PeerReview.findAll({
      where: {
        user_id: req.user.id,
        configuration_id: registrationManagement.peer_review_conf,
      },
    })

    return res.status(200).json(entries)
  } catch (err) {
    return handleDatabaseError(res, err)
  }
})

peerReviewRouter.get('/all', checkAdmin, async (req, res) => {
  try {
    const reviews = await db.PeerReview.findAll({
      include: ['user'],
    })
    return res.status(200).json(reviews)
  } catch (error) {
    return handleDatabaseError(res, error)
  }
})

peerReviewRouter.get('/forInstructor', checkLogin, async (req, res) => {
  try {
    const query = req.user.admin
      ? {}
      : {
          where: { instructorId: req.user.id },
        }
    const instructedGroups = await db.Group.findAll(query)

    if (instructedGroups.length === 0) {
      return res.status(401).json({ error: 'Not instructor' })
    }

    const instructedConfigurations = instructedGroups.map((group) => group.configurationId)

    const groupsOfInstructedConfigurations = await db.Group.findAll({
      where: { configurationId: instructedConfigurations },
      include: [
        {
          as: 'students',
          model: db.User,
          attributes: ['student_number', 'first_names', 'last_name'],
          through: { attributes: [] },
        },
        {
          as: 'configuration',
          model: db.Configuration,
        },
        {
          as: 'instructor',
          model: db.User,
        },
      ],
    })

    const allAnswers = await db.PeerReview.findAll({
      include: ['user'],
    })

    const filterAndFormatAnswers = (answers, group, round) => {
      return answers
        .filter(
          (answer) =>
            group.students
              .map(({ student_number }) => student_number)
              .includes(answer.user.student_number) &&
            answer.configuration_id === group.configurationId &&
            answer.review_round === round,
        )
        .map((answer) => {
          return {
            student: {
              first_names: answer.user.first_names,
              last_name: answer.user.last_name,
            },
            answer_sheet: answer.answer_sheet,
          }
        })
    }

    const answersByGroup = groupsOfInstructedConfigurations.reduce((list, group) => {
      const round1Answers = filterAndFormatAnswers(allAnswers, group, 1)
      const round2Answers = filterAndFormatAnswers(allAnswers, group, 2)

      list = list.concat({
        group: {
          id: group.id,
          name: group.name,
          studentNames: group.students.map(
            (student) => student.first_names + ' ' + student.last_name,
          ),
          configurationId: group.configurationId,
          configurationName: group.configuration.name,
          instructorName: group.instructor
            ? group.instructor.first_names + ' ' + group.instructor.last_name
            : '',
        },
        round1Answers,
        round2Answers,
      })

      return list
    }, [])

    return res.status(200).json(answersByGroup)
  } catch (error) {
    return handleDatabaseError(res, error)
  }
})

peerReviewRouter.delete('/:id', checkAdmin, async (req, res) => {
  const peerReviewId = parseInt(req.params.id, 10)
  if (isNaN(peerReviewId)) {
    return res.status(400).json({ error: 'invalid id' })
  }

  try {
    const targetSet = await db.PeerReview.findByPk(peerReviewId)
    if (!targetSet) {
      // already deleted, eh, just return ok
      return res.status(204).end()
    }

    await targetSet.destroy()
    return res.status(204).end()
  } catch (err) {
    console.error('error while deleting question set with id', req.params.id, err)
    return res.status(500).json({ error: 'internal server error' })
  }
})

module.exports = peerReviewRouter
