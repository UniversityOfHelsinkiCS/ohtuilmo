const instructorReviewRouter = require('express').Router()
const db = require('../models/index')
const { checkLogin, checkAdmin } = require('../middleware')

const handleDatabaseError = (res, error) => {
  console.log(error)
  res.status(500).json({ error: 'Something is wrong... try reloading the page' })
}

const isNil = (value) => value === undefined || value === null

const validateAnswerSheet = (instructorReview) => {
  if (!instructorReview) {
    return 'No instructor review found'
  }

  const { user_id, group_id, answer_sheet } = instructorReview

  if (isNil(group_id) || isNil(user_id) || isNil(answer_sheet)) {
    return 'All attributes must be defined.'
  }

  let error = null

  for (let student of answer_sheet) {
    for (let question of student.answers) {
      if (question.type === 'text') {
        error = validateTextAnswer(question)
        if (error) {
          return error
        }
      } else if (question.type === 'number') {
        error = validateNumberAnswer(question)
        if (error) {
          return error
        }
      }
    }
  }
  return null
}

const validateTextAnswer = (question) => {
  if (question.answer.length === 0) {
    return 'You must answer all questions'
  }
  if (question.answer.length < 5) {
    return 'Text answers must be over 5 characters long.'
  }
  if (question.answer.length > 5000) {
    return 'Text answer must be less than 5000 characters.'
  }
  return null
}

const validateNumberAnswer = (question) => {
  if (isNil(question.answer) || question.answer.length === 0) {
    return 'You must answer all questions'
  }
  if (question.answer < 0) {
    return 'Number answer can not be negative'
  }
  if (question.answer > 5) {
    return 'Grade can not be over 5.'
  }
  return null
}

const create = async (req, res) => {
  const { instructorReview } = req.body

  const { answer_sheet, group_name, group_id, user_id } = instructorReview

  const newAnswerSheet = {
    answer_sheet: {
      answer_sheet,
      group_name,
      group_id,
    },
    user_id,
  }

  try {
    const sentAnswerSheet = await db.InstructorReview.create(newAnswerSheet)
    return res.status(201).json(sentAnswerSheet)
  } catch (err) {
    return handleDatabaseError(res, err)
  }
}

instructorReviewRouter.post('/', checkLogin, async (req, res) => {
  const { instructorReview } = req.body

  if (!instructorReview || !instructorReview.user_id || req.user.id !== instructorReview.user_id) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  try {
    const instructedGroups = await db.Group.findAll({
      where: { instructorId: req.user.id },
    })
    if (instructedGroups.length === 0) {
      return res.status(401).json({ error: 'unauthorized' })
    }
    if (!instructedGroups.some((group) => group.id === Number(instructorReview.group_id))) {
      return res.status(403).json({ error: 'You are not the instructor of the group' })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'Something is wrong... try reloading the page' })
  }

  const error = validateAnswerSheet(instructorReview)
  if (error) {
    return res.status(400).json({ error })
  }
  create(req, res)
})

instructorReviewRouter.get('/', checkAdmin, async (req, res) => {
  try {
    const foundInstructorReviews = await db.InstructorReview.findAll()
    return res.status(200).json({ reviews: foundInstructorReviews })
  } catch (err) {
    return handleDatabaseError(res, err)
  }
})

instructorReviewRouter.get('/getAllAnsweredGroupId', checkLogin, async (req, res) => {
  try {
    const reviews = await db.InstructorReview.findAll({
      where: {
        user_id: req.user.id,
      },
    })

    const reviewGroups = reviews.map((review) => review.answer_sheet.group_id)

    return res.status(200).json(reviewGroups)
  } catch (error) {
    return handleDatabaseError(res, error)
  }
})

instructorReviewRouter.delete('/:id', checkAdmin, async (req, res) => {
  const instructorReviewId = req.params.id
  if (isNaN(instructorReviewId)) {
    return res.status(400).json({ error: 'invalid id' })
  }

  try {
    const instructorReview = await db.InstructorReview.findOne({
      where: { id: req.params.id },
    })

    if (!instructorReview) {
      return res.status(204).send()
    }

    await instructorReview.destroy()

    return res.status(204).send()
  } catch (err) {
    console.error('error while deleting instructor review with id', req.params.id, err)
    return res.status(500).json({ error: 'internal server error' })
  }
})

module.exports = instructorReviewRouter
