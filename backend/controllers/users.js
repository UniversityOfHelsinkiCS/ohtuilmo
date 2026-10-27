const usersRouter = require('express').Router()
const db = require('../models/index')
const { Op } = require('sequelize')
const { checkLogin, checkInstructor } = require('../middleware')

usersRouter.put('/consent/:studentNumber', checkLogin, async (req, res) => {
  const { research_consent } = req.body
  const { studentNumber } = req.params

  if (req.user.id !== studentNumber) {
    return res.status(403).json({ error: 'student numbers not matching' })
  }

  try {
    const user = await db.User.findOne({
      where: { student_number: studentNumber },
    })
    if (!user) {
      return res.status(400).json({ error: 'user does not exist' })
    }
    const updatedUser = await user.update({ research_consent })
    const refreshedUser = await updatedUser.reload()
    res.status(200).json({ user: refreshedUser })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Something is wrong... try reloading the page' })
  }
})

usersRouter.put('/:studentNumber', checkLogin, async (req, res) => {
  const { email } = req.body
  const { studentNumber } = req.params

  if (req.user.id !== studentNumber) {
    return res.status(403).json({ error: 'student numbers not matching' })
  }

  if (!email) {
    return res.status(400).json({ error: 'missing email' })
  }

  try {
    const user = await db.User.findOne({
      where: { student_number: studentNumber },
    })
    if (!user) {
      return res.status(400).json({ error: 'user does not exist' })
    }

    const updatedUser = await user.update({ email })
    const refreshedUser = await updatedUser.reload()
    res.status(200).json({ user: refreshedUser })
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Something is wrong... try reloading the page' })
  }
})

usersRouter.get('/', checkInstructor, async (req, res) => {
  if (req.user.admin || req.user.instructor) {
    let configurations = {}
    try {
      // For instructor, get just students they have access to.
      if (req.user.instructor) {
        const groups = await db.Group.findAll({
          where: { instructorId: req.user.id },
          include: [
            {
              as: 'students',
              model: db.User,
              attributes: ['student_number'],
              through: { attributes: [] },
            },
          ],
        })

        const studentNumberList = groups
          .flatMap((group) => group.students)
          .map((user) => user.dataValues.student_number)

        configurations = {
          student_number: {
            [Op.in]: studentNumberList,
          },
        }
      }
      const users = await db.User.findAll({
        where: configurations,
      })
      res.status(200).json(users)
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Something is wrong... try reloading the page' })
    }
  }
})

usersRouter.get('/isInstructor', checkLogin, async (req, res) => {
  try {
    const instructedGroups = await db.Group.findAll({
      where: { instructorId: req.user.id },
    })
    if (instructedGroups.length > 0) {
      res.status(200).json({ isInstructor: true })
    } else {
      res.status(200).json({ isInstructor: false })
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Something is wrong... try reloading the page' })
  }
})

module.exports = usersRouter
