const util = require('util')
const emailRouter = require('express').Router()
const nodemailer = require('nodemailer')
const db = require('../models/index')
const { email: emailConfig, urls } = require('../config/')
const { checkAdmin } = require('../middleware')
const { emailTypeToTemplateName } = require('../utils')

const sendSecretLink = (secretId, address) => {
  const url = urls.forSecretTopicLink(secretId)
  const html = `Thank you for the project proposal. You can use the below link to view or edit your proposal. <br /> <a href="${url}">Edit your submission</a>`
  // the topic is saved even if the email fails, send has already logged the error
  return send(address, emailConfig.subjects.secretLink, html).catch(() => {})
}

const send = async (to, subject, html, text) => {
  const transporter = nodemailer.createTransport({
    host: emailConfig.general.host,
    port: emailConfig.general.port,
    secure: emailConfig.general.secure,
  })

  const mailOptions = {
    from: emailConfig.general.sender,
    to: to,
    replyTo: emailConfig.general.replyTo,
    cc: emailConfig.general.cc,
    subject: subject,
    text: text,
    html: html,
  }

  if (!emailConfig.isEnabled) {
    console.log('Email not enabled with EMAIL_ENABLED=true, skipping mail')
    return
  }

  const sendMailAsync = util.promisify(transporter.sendMail.bind(transporter))

  try {
    const info = await sendMailAsync(mailOptions)

    if (info.rejected.length > 0) {
      const rejectedEmails = info.rejected.join(', ')
      const error = new Error(`SMTP server rejected the following recipients: ${rejectedEmails}`)
      console.error(info)
      throw error
    }

    console.log('email sent', info)
  } catch (error) {
    console.error('Mailing send failed')
    console.error(error)
    throw error
  }
}

const bodyValidator = (validator) => (req, res, next) => {
  const error = validator(req.body)
  if (error) {
    return res.status(400).json({ error })
  }

  next()
}

const validateSendBody = (body) => {
  if (!body) {
    return 'All attributes must be defined'
  }

  if (
    body.messageType !== 'topicAccepted' &&
    body.messageType !== 'topicRejected' &&
    body.messageType !== 'customerReviewLink'
  ) {
    return 'invalid messageType'
  }

  if (body.messageLanguage !== 'finnish' && body.messageLanguage !== 'english') {
    return 'invalid messageLanguage'
  }

  if (!body.topicId) {
    return 'topicId required'
  }

  return null
}

const validatePreviewBody = validateSendBody

emailRouter.post('/preview', checkAdmin, bodyValidator(validatePreviewBody), async (req, res) => {
  const { topicId, messageType, messageLanguage } = req.body

  try {
    const topic = await db.Topic.findByPk(topicId)
    if (!topic) {
      return res.status(400).json({ error: `topic "${topicId}" not found` })
    }
    if (!topic.content || !topic.content.email) {
      return res.status(400).json({ error: 'topic has no content or email!' })
    }

    const templates = await db.EmailTemplate.findOne({
      order: [['created_at', 'DESC']],
    })

    if (!templates) {
      return res.status(400).json({ error: 'email templates have not been configured' })
    }

    const dbTemplateName = emailTypeToTemplateName(messageType, messageLanguage)

    const renderedEmail = templates.render(dbTemplateName, { topic })
    const subject = emailConfig.subjects[messageType][messageLanguage]
    const to = topic.content && topic.content.email

    return res.status(200).json({ subject, to, email: renderedEmail })
  } catch (e) {
    res.status(500).json({ error: e.message, details: e })
  }
})

emailRouter.post('/send', checkAdmin, bodyValidator(validateSendBody), async (req, res) => {
  const { topicId, messageType, messageLanguage } = req.body

  try {
    const topic = await db.Topic.findByPk(topicId)
    if (!topic) {
      return res.status(400).json({ error: `topic "${topicId}" not found` })
    }
    if (!topic.content || !topic.content.email) {
      return res.status(400).json({ error: 'topic has no content or email!' })
    }

    const templates = await db.EmailTemplate.findOne({
      order: [['created_at', 'DESC']],
    })

    if (!templates) {
      return res.status(400).json({ error: 'email templates have not been configured' })
    }

    const dbTemplateName = emailTypeToTemplateName(messageType, messageLanguage)

    const renderedEmail = templates.render(dbTemplateName, { topic })
    const subject = emailConfig.subjects[messageType][messageLanguage]

    await send(topic.content.email, subject, null, renderedEmail)
    const createdModel = await db.SentTopicEmail.create({
      topic_id: topic.id,
      email_template_name: dbTemplateName,
    })
    res.status(200).json(db.SentTopicEmail.format(createdModel))
  } catch (e) {
    console.error('Mailing failed')
    console.error(e)
    res.status(500).json({ error: e.message, details: e })
  }
})

emailRouter.delete('/sent-emails', checkAdmin, async (req, res) => {
  await db.SentTopicEmail.destroy({ where: {} })
  res.status(204).end()
})

const defaultEmailTemplates = {
  topic_accepted_fin: '',
  topic_rejected_fin: '',
  topic_accepted_eng: '',
  topic_rejected_eng: '',
  customer_review_link_fin: '',
  customer_review_link_eng: '',
}

const serializeTemplatesByLanguage = ({
  topic_accepted_fin,
  topic_rejected_fin,
  topic_accepted_eng,
  topic_rejected_eng,
  customer_review_link_fin,
  customer_review_link_eng,
}) => ({
  topicAccepted: {
    finnish: topic_accepted_fin,
    english: topic_accepted_eng,
  },
  topicRejected: {
    finnish: topic_rejected_fin,
    english: topic_rejected_eng,
  },
  customerReviewLink: {
    finnish: customer_review_link_fin,
    english: customer_review_link_eng,
  },
})

const deserializeTemplatesByLanguage = ({ topicAccepted, topicRejected, customerReviewLink }) => ({
  topic_accepted_fin: topicAccepted.finnish,
  topic_rejected_fin: topicRejected.finnish,
  topic_accepted_eng: topicAccepted.english,
  topic_rejected_eng: topicRejected.english,
  customer_review_link_fin: customerReviewLink.finnish,
  customer_review_link_eng: customerReviewLink.english,
})

emailRouter.get('/templates', checkAdmin, async (req, res) => {
  try {
    const templates = await db.EmailTemplate.findAll({
      limit: 1,
      order: [['created_at', 'DESC']],
    })

    const payload = templates.length > 0 ? templates[0] : defaultEmailTemplates
    return res.json(serializeTemplatesByLanguage(payload))
  } catch {
    res.status(500).json({ error: 'Something is wrong... try reloading the page' })
  }
})

const isNil = (value) => value === undefined || value === null

const validateTemplates = (body) => {
  if (!body) {
    return 'All attributes must be defined'
  }

  const { topicAccepted, topicRejected, customerReviewLink } = body
  // allow empty strings!
  if (
    isNil(topicAccepted) ||
    isNil(topicRejected) ||
    isNil(customerReviewLink) ||
    isNil(topicAccepted.finnish) ||
    isNil(topicAccepted.english) ||
    isNil(topicRejected.finnish) ||
    isNil(topicRejected.english) ||
    isNil(customerReviewLink.finnish) ||
    isNil(customerReviewLink.english)
  ) {
    return 'All attributes must be defined'
  }

  return null
}

const parseTemplates = (req, res, next) => {
  try {
    const deserialized = deserializeTemplatesByLanguage(req.body)
    req.locals = {
      ...req.locals,
      templates: deserialized,
    }
    next()
  } catch {
    res.status(500).json({ error: 'internal server error' })
  }
}

emailRouter.post(
  '/templates',
  checkAdmin,
  bodyValidator(validateTemplates),
  parseTemplates,
  async (req, res) => {
    const {
      topic_accepted_fin,
      topic_rejected_fin,
      customer_review_link_fin,
      topic_accepted_eng,
      topic_rejected_eng,
      customer_review_link_eng,
    } = req.locals.templates

    try {
      const createdTemplates = await db.EmailTemplate.create({
        topic_accepted_fin,
        topic_rejected_fin,
        customer_review_link_fin,
        topic_accepted_eng,
        topic_rejected_eng,
        customer_review_link_eng,
      })
      res.status(200).json(serializeTemplatesByLanguage(createdTemplates))
    } catch {
      res.status(500).json({ error: 'Something is wrong... try reloading the page' })
    }
  },
)

emailRouter.delete('/templates', checkAdmin, async (req, res) => {
  await db.EmailTemplate.destroy({ where: {} })
  res.status(204).end()
})

module.exports = {
  emailRouter,
  sendSecretLink,
}
