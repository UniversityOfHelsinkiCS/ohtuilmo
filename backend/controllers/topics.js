/* eslint-disable quotes */
const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
const topicsRouter = require('express').Router()
const db = require('../models/index')
const { checkAdmin, optionalLogin } = require('../middleware')
const email = require('./email')
const { getRandomId, pipe } = require('../utils')

const censorSecretId = (topic) => {
  let formatted = topic
  formatted.secret_id = ''
  return formatted
}

const isSecretId = (id) => {
  return id.slice(0, 1) === 'a'
}

const registrationCheck = async (req, res, next) => {
  try {
    const latestConfig = await db.RegistrationManagement.findOne({
      order: [['createdAt', 'DESC']],
    })

    if (!latestConfig || !latestConfig.topic_registration_open) {
      // registration config was not found or the topic registration was closed
      return res.status(400).json({ error: 'topic registration is not currently open' })
    }

    // pass request on to the next handler
    next()
  } catch (err) {
    console.error('Error in registrationCheck', err)
    return res.status(500).json({ error: 'Something is wrong... try reloading the page' })
  }
}

topicsRouter.post('/:id/copy', checkAdmin, async (req, res) => {
  const conf = await db.RegistrationManagement.findOne({
    order: [['createdAt', 'DESC']],
  })

  const from = await db.Topic.findByPk(req.params.id)

  const secret_id = getRandomId()

  db.Topic.create({
    active: true,
    configuration_id: conf.topic_registration_conf,
    content: from.content,
    acronym: from.acronym,
    secret_id,
  })
    .then((topic) => {
      res.status(200).json({ topic })
    })
    .catch((error) => {
      console.log(error)
      res.status(500).json({ error: 'Something is wrong... try reloading the page' })
    })
})

topicsRouter.post('/', registrationCheck, (req, res) => {
  if (!req.body.content) return res.status(400).json({ error: 'content undefined' })

  if (!req.body.configuration_id) {
    return res.status(400).json({ error: 'Topic must be associated with configuration' })
  }

  const secret_id = getRandomId()

  db.Topic.create({
    active: true,
    configuration_id: req.body.configuration_id,
    content: req.body.content,
    acronym: req.body.acronym,
    secret_id,
  })
    .then((topic) => {
      email.sendSecretLink(topic.secret_id, topic.content.email)
      res.status(200).json({ topic })
    })
    .catch((error) => {
      console.log(error)
      res.status(500).json({ error: 'Something is wrong... try reloading the page' })
    })
})

topicsRouter.put(
  '/:id',
  (req, res, next) => {
    //skip admin check if id is secret_id
    if (isSecretId(req.params.id)) res.locals.isSecret = true
    next()
  },
  (req, res, next) => {
    if (!res.locals.isSecret) checkAdmin(req, res, next)
    else next()
  },
  (req, res) => {
    //don't try to compare id (integer) to secret_id (string) in db
    if (res.locals.isSecret) {
      db.Topic.findOne({
        where: {
          secret_id: req.params.id,
        },
      })
        .then((topic) => {
          if (!topic) return res.status(400).json({ error: 'no topic with that id' })
          // only admins may activate topics
          topic
            .update({
              content: req.body.content,
              acronym: req.body.acronym,
            })
            .then((topic) => {
              return topic.reload().then((topic) => {
                topic = censorSecretId(topic)
                res.status(200).json({ topic })
              })
            })
            .catch((error) => {
              console.log(error)
              res.status(500).json({ error: 'Something is wrong... try reloading the page' })
            })
        })
        .catch((error) => {
          console.log(error)
          res.status(500).json({ error: 'Something is wrong... try reloading the page' })
        })
    } else {
      db.Topic.findByPk(req.params.id)
        .then((topic) => {
          if (!topic) return res.status(400).json({ error: 'no topic with that id' })
          topic
            .update({
              active: req.body.active,
              content: req.body.content,
              acronym: req.body.acronym,
            })
            .then((topic) => {
              return topic.reload().then((topic) => {
                topic = censorSecretId(topic)
                res.status(200).json({ topic })
              })
            })
            .catch((error) => {
              console.log(error)
              res.status(500).json({ error: 'Something is wrong... try reloading the page' })
            })
        })
        .catch((error) => {
          console.log(error)
          res.status(500).json({ error: 'Something is wrong... try reloading the page' })
        })
    }
  },
)

const serializeHasReviewed = (plainTopic) => {
  // remove customer_review from returned object
  const { customer_review, ...topic } = plainTopic
  const hasReviewed = customer_review && customer_review.length > 0

  return {
    ...topic,
    hasReviewed,
  }
}

const serializeSentEmails = (plainTopic) => {
  const { sent_emails, ...topicWithoutSentEmails } = plainTopic
  const sentEmails = sent_emails.map(db.SentTopicEmail.format)

  return {
    ...topicWithoutSentEmails,
    sentEmails,
  }
}

topicsRouter.get('/', checkAdmin, async (req, res) => {
  try {
    const topics = await db.Topic.findAll({
      where: {},
      include: [
        {
          model: db.CustomerReview,
          as: 'customer_review',
        },
        {
          model: db.SentTopicEmail,
          as: 'sent_emails',
        },
      ],
    })

    const serializer = pipe(
      // convert Sequelize model instance to plain JS object to avoid
      // JSON.stringify exploding due to circular references
      (topicModel) => topicModel.get({ plain: true }),
      serializeHasReviewed,
      serializeSentEmails,
    )

    return res.status(200).json({ topics: topics.map(serializer) })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Something is wrong... try reloading the page' })
  }
})

/**
 * Active topics for project registration
 */
topicsRouter.get('/active', async (req, res) => {
  try {
    const registrationManagement = await db.RegistrationManagement.findOne({
      order: [['createdAt', 'DESC']],
    })

    if (!registrationManagement) {
      return res.status(400).json({ error: 'no active configuration for project registration' })
    }

    const activeTopics = await db.Topic.findAll({
      attributes: {
        exclude: ['content'],
        include: [
          [db.sequelize.literal(`COALESCE("content", '{}'::jsonb) - 'phoneNumber'`), 'content'],
        ],
      },
      where: {
        active: true,
        configuration_id: registrationManagement.project_registration_conf,
      },
    })

    return res.status(200).json({
      topics: shuffle(activeTopics.map((topic) => censorSecretId(topic))),
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Something is wrong... try reloading the page' })
  }
})

// optionalLogin is needed to check admin status: phoneNumber should be omitted for users without
// the edit link and admin rights
topicsRouter.get('/:id', optionalLogin, async (req, res) => {
  const id = req.params.id
  if (isSecretId(id)) {
    db.Topic.findOne({
      where: {
        secret_id: id,
      },
    })
      .then((topic) => {
        if (!topic) return res.status(400).json({ error: 'no topic with that id' })
        topic = censorSecretId(topic)
        res.status(200).json({ topic })
      })
      .catch((error) => {
        console.log(error)
        res.status(500).json({ error: 'Something is wrong... try reloading the page' })
      })
  } else if (req.user && req.user.admin) {
    db.Topic.findOne({
      where: {
        id: id,
      },
    })
      .then((topic) => {
        if (!topic) return res.status(400).json({ error: 'no topic with that id' })
        topic = censorSecretId(topic)
        res.status(200).json({ topic })
      })
      .catch((error) => {
        console.log(error)
        res.status(500).json({ error: 'Something is wrong... try reloading the page' })
      })
  } else {
    db.Topic.findOne({
      attributes: {
        exclude: ['content'],
        include: [
          [db.sequelize.literal(`COALESCE("content", '{}'::jsonb) - 'phoneNumber'`), 'content'],
        ],
      },
      where: {
        id: id,
      },
    })
      .then((topic) => {
        if (!topic) return res.status(400).json({ error: 'no topic with that id' })
        topic = censorSecretId(topic)
        res.status(200).json({ topic })
      })
      .catch((error) => {
        console.log(error)
        res.status(500).json({ error: 'Something is wrong... try reloading the page' })
      })
  }
})

module.exports = topicsRouter
