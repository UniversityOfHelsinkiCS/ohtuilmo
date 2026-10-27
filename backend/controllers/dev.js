const devRouter = require('express').Router()
const { test_user, test_users } = require('../config/dev')

// This is not the best place for this, but it was the most simple
// solution, as I didn't want to share state between middlewares and index.js
// and test_user is a shared local var between router and fake_shibbo.
devRouter.post('/', (req, res) => {
  console.info('Initial user', test_user.test_user)
  const role = req.body.role
  switch (role) {
    case 'student':
      test_user.test_user = test_users.student
      break
    case 'instructor':
      test_user.test_user = test_users.instructor
      break
    case 'admin':
      test_user.test_user = test_users.admin
      break
    default:
      console.warn("Didn't match any, defaulting to student")
      test_user.test_user = test_users.student
      break
  }

  console.info('Logged in as', test_user.test_user)
  return res.status(200).json({ role })
})

module.exports = devRouter
