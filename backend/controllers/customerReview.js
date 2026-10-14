const customerReviewRouter = require('express').Router()
const db = require('../models/index')
const { checkAdmin, optionalLogin } = require('../middleware')

const handleDatabaseError = (res, error) => {
  console.log(error)
  res.status(500).json({ error: 'Something is wrong... try reloading the page' })
}

const isNil = (value) => value === undefined || value === null

const validateAnswerSheet = (customerReview) => {
  if (!customerReview) {
    return 'No customer review found'
  }

  const { group_id, answer_sheet } = customerReview

  if (isNil(group_id) || isNil(answer_sheet)) {
    return 'All attributes must be defined.'
  }
  let error = null
  for (let question of answer_sheet) {
    if (question.type === 'text') {
      error = validateTextAnswer(question)
      if (error) {
        return error
      }
    } else if (question.type === 'oneliner') {
      error = validateOnelinerAnswer(question)
      if (error) {
        return error
      }
    } else if (question.type === 'number') {
      error = validateNumberAnswer(question)
      if (error) {
        return error
      }
    } else if (question.type === 'range') {
      error = validateRangeAnswer(question)
      if (error) {
        return error
      }
    } else if (question.type !== 'info') {
      return 'Invalid question type in answer sheet'
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

const validateOnelinerAnswer = (question) => {
  if (question.answer.length === 0) {
    return 'You must answer all questions'
  }
  if (question.answer.length < 5) {
    return 'Short text answers must be over 5 characters long.'
  }
  if (question.answer.length > 100) {
    return 'Short text answer must be less than 100 characters.'
  }
  return null
}

const validateNumberAnswer = (question) => {
  if (isNil(question.answer)) {
    return 'You must answer all questions'
  }
  return null
}

const validateRangeAnswer = (question) => {
  if (isNil(question.answer)) {
    return 'You must answer all questions'
  }
  return null
}

const create = async (req, res, customerReview) => {
  try {
    const sentAnswerSheet = await db.CustomerReview.create(customerReview)
    return res.status(201).json(sentAnswerSheet)
  } catch (err) {
    return handleDatabaseError(res, err)
  }
}

// customers send the review with the secret id of their topic, the group is
// resolved from it so that a review can not be sent for some other group
customerReviewRouter.post('/', optionalLogin, async (req, res) => {
  const { customerReview } = req.body

  const error = validateAnswerSheet(customerReview)

  if (error) {
    return res.status(400).json({ error })
  }

  if (req.user && req.user.admin) {
    return create(req, res, customerReview)
  }

  try {
    const topic = customerReview.secret_id
      ? await db.Topic.findOne({ where: { secret_id: customerReview.secret_id } })
      : null
    if (!topic) {
      return res.status(401).json({ error: 'Invalid review link' })
    }

    const group = await db.Group.findOne({ where: { topicId: topic.id } })
    if (!group) {
      return res.status(400).json({ error: 'No group for this topic' })
    }

    if (await hasCustomerAlreadyAnswered(group.id)) {
      return res.status(400).json({ error: 'This group has already been reviewed' })
    }

    return create(req, res, {
      answer_sheet: customerReview.answer_sheet,
      group_id: group.id,
      topic_id: topic.id,
      configuration_id: group.configurationId,
    })
  } catch (err) {
    return handleDatabaseError(res, err)
  }
})

customerReviewRouter.get('/', checkAdmin, async (req, res) => {
  try {
    const foundReviews = await db.CustomerReview.findAll({
      include: ['group'],
    })
    return res.status(200).json({ reviews: foundReviews })
  } catch (error) {
    return handleDatabaseError(res, error)
  }
})

customerReviewRouter.get('/all', checkAdmin, async (req, res) => {
  try {
    const groups = await db.Group.findAll()

    const reviews = await db.CustomerReview.findAll({
      include: ['group'],
    })

    const connectAnswerToGroup = (answers, group) => {
      // reviews of deleted groups have no group
      const connectedAnswers = answers.filter(
        (answer) => answer.group && answer.group.id === group.id,
      )
      if (connectedAnswers.length < 1) {
        return null
      }
      return connectedAnswers[0].answer_sheet
    }

    const answerByGroup = groups.reduce((list, group) => {
      const groupAnswer = connectAnswerToGroup(reviews, group)

      list = list.concat({
        group: {
          id: group.id,
          name: group.name,
          answerSheet: groupAnswer,
        },
      })
      return list
    }, [])

    return res.status(200).json(answerByGroup)
  } catch (error) {
    return handleDatabaseError(res, error)
  }
})

customerReviewRouter.get('/all/forconfiguration/:id', checkAdmin, async (req, res) => {
  const id = req.params.id
  try {
    const groups = await db.Group.findAll({
      where: {
        configurationId: id,
      },
    })

    const reviews = await db.CustomerReview.findAll({
      where: {
        configuration_id: id,
      },
      include: ['group'],
    })

    const connectAnswerToGroup = (answers, group) => {
      // reviews of deleted groups have no group
      const connectedAnswers = answers.filter(
        (answer) => answer.group && answer.group.id === group.id,
      )
      if (connectedAnswers.length < 1) {
        return null
      }
      return connectedAnswers[0].answer_sheet
    }

    const answerByGroup = groups.reduce((list, group) => {
      const groupAnswer = connectAnswerToGroup(reviews, group)

      list = list.concat({
        group: {
          id: group.id,
          name: group.name,
          answerSheet: groupAnswer,
        },
      })
      return list
    }, [])

    return res.status(200).json(answerByGroup)
  } catch (error) {
    return handleDatabaseError(res, error)
  }
})

const hasCustomerAlreadyAnswered = async (groupId) => {
  const foundAnswer = await db.CustomerReview.findOne({
    where: { group_id: groupId },
  })
  return !!foundAnswer
}

//Haetaan topicin secret idllä data sisään customer review sivulle (groupid, groupname ja config)
customerReviewRouter.get('/:id', async (req, res) => {
  //Sisään tulee topicin secret_id hae sillä topic -> group, groupista id nimi ja config
  const id = req.params.id
  try {
    const topic = await db.Topic.findOne({
      where: {
        secret_id: id,
      },
    })

    if (!topic) {
      return res.status(400).json({ error: 'no topic with that id' })
    }

    //Tänne pääsee ja topic löytyy

    const group = await db.Group.findOne({
      where: {
        topicId: topic.id,
      },
    })

    if (!group) {
      return res.status(200).json(null)
    }

    //data tulee läpi

    const hasAnswered = await hasCustomerAlreadyAnswered(group.id)

    res.status(200).json({
      groupId: group.id,
      groupName: group.name,
      topicId: topic.id,
      configuration: group.configurationId,
      hasAnswered: hasAnswered,
    })
  } catch (error) {
    console.error('Error while updating group', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

customerReviewRouter.delete('/:id', checkAdmin, async (req, res) => {
  const customerReviewId = req.params.id
  if (isNaN(customerReviewId)) {
    return res.status(400).json({ error: 'invalid id' })
  }

  try {
    const customerReview = await db.CustomerReview.findOne({
      where: { id: req.params.id },
    })

    if (!customerReview) {
      return res.status(204).send()
    }

    await customerReview.destroy()

    return res.status(204).send()
  } catch (err) {
    console.error('error while deleting customer review with id', req.params.id, err)
    return res.status(500).json({ error: 'internal server error' })
  }
})

module.exports = customerReviewRouter
