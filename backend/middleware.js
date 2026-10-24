// @ts-check
const jwt = require('jsonwebtoken')
const config = require('./config')
const { test_user } = require('./config/dev')
const { isDevelopmentEnvironment } = require('./utils')

/**
 * @typedef {import("express").Request} Request
 * @typedef {import("express").RequestHandler} RequestHandler
 */

/**
 * @param {Request} req
 * @returns {string | null}
 */
const getTokenFrom = (req) => {
  const authorization = req.headers.authorization || req.query.token
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring('bearer '.length)
  }

  return null
}

/** @param {Request} req */
const authenticateToken = (req) => {
  const token = getTokenFrom(req)
  if (token === null) {
    return {
      error: 'token missing or invalid',
      status: 401,
    }
  }

  try {
    const decodedToken = jwt.verify(token, config.secret)
    if (!decodedToken || !decodedToken.id) {
      return {
        error: 'token missing or invalid',
        status: 401,
      }
    }

    return {
      token: decodedToken,
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return {
        error: error.message,
        status: 401,
      }
    } else {
      return {
        error,
        status: 401,
      }
    }
  }
}

/** @type {RequestHandler} */
const checkLogin = (req, res, next) => {
  const { error, status, token } = authenticateToken(req)
  if (!token) {
    return res.status(status).json({ error })
  }

  req.user = token
  next()
}

/** @type {RequestHandler} */
const checkInstructor = (req, res, next) => {
  const { error, status, token } = authenticateToken(req)
  if (!token) {
    return res.status(status).json({ error })
  }

  if (!token.instructor && !token.admin) {
    return res.status(401).json({ error: 'not instructor' })
  }

  req.user = token
  next()
}

/** @type {RequestHandler} */
const checkAdmin = (req, res, next) => {
  const { error, status, token } = authenticateToken(req)
  if (!token) {
    return res.status(status).json({ error })
  }

  if (!token.admin) {
    return res.status(401).json({ error: 'not admin' })
  }

  req.user = token
  next()
}

// STOP AND THINK BEFORE USING THIS! For PUBLIC endpoints, if there is a
// need to partially omit something, if not logged in or user is not admin.
/** @type {RequestHandler} */
const optionalLogin = (req, res, next) => {
  const { token } = authenticateToken(req)

  if (token) {
    req.user = token
  }
  next()
}

/** @type {RequestHandler} */
const fakeshibbo = (req, res, next) => {
  const user = test_user.test_user

  req.headers.employeenumber = user.employeenumber
  req.headers.mail = user.mail
  req.headers.hypersonstudentid = user.hypersonstudentid
  req.headers.uid = user.uid
  req.headers.givenname = user.givenname
  req.headers.sn = user.sn
  next()
}

/** @type {RequestHandler} */
const logger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  // bodies contain personal data, e.g. reviews and registrations
  if (isDevelopmentEnvironment()) console.log('Body:  ', request.body)
  console.log('---')
  next()
}

module.exports = {
  checkLogin,
  checkInstructor,
  checkAdmin,
  optionalLogin,
  logger,
  fakeshibbo,
}
