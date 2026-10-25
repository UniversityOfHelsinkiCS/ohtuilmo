const express = require('express')
const { checkAdmin, checkLogin } = require('../middleware')
const db = require('../models/index')
const { Op } = require('sequelize')
const userAIUsageRouter = express.Router()

const fetchUserAIUsage = async (configurations) => {
  try {
    const usersAIUsage = await db.UserAIUsage.findAll({
      attributes: [
        'id',
        ['student_number', 'studentNumber'],
        ['models_used', 'modelsUsed'],
        ['how_used', 'howUsed'],
        ['sprint_id', 'sprintId'],
      ],
      where: configurations,
      raw: true,
    })
    return usersAIUsage
  } catch (error) {
    console.error('Error fetching user`s AI usage:', error)
    throw new Error('Error fetching user`s AI usage.')
  }
}

userAIUsageRouter.get('/student', checkLogin, async (req, res) => {
  const user = req.user
  const configurations = {
    student_number: user.id,
  }
  const usersAIUsage = await fetchUserAIUsage(configurations)
  if (!usersAIUsage) {
    return res.status(200).json([])
  }
  res.status(200).json(usersAIUsage)
})

userAIUsageRouter.get('/teacher', checkLogin, async (req, res) => {
  const user = req.user
  let configurations = {}
  if (!user.instructor && !user.admin) {
    return res.status('403').json({ error: 'Forbidden' })
  }
  if (user.instructor) {
    const groups = await db.Group.findAll({
      where: { instructorId: req.params.instructor },
      include: [
        {
          as: 'students',
          model: db.User,
          attributes: ['student_number'], // only select the student number
          through: { attributes: [] }, // don't ignore junction table stuff
        },
      ],
    })

    const instructorGroups = groups.map((group) => {
      return {
        id: group.id,
        students: group.students,
      }
    })

    const studentNumberList = instructorGroups.flatMap((group) => group.students)

    configurations = {
      student_number: {
        [Op.in]: studentNumberList,
      },
    }
  }

  const usersAIUsage = await fetchUserAIUsage(configurations)
  if (!usersAIUsage) {
    return res.status(400).json({ error: 'aiUsage does not exist' })
  }
  // here computations for each sprint by id usage, how used
})

userAIUsageRouter.get('/answers', checkAdmin, async (_req, _res) => {
  // bring all answers for students
  return res.status(200).json({})
})

userAIUsageRouter.post('/', checkLogin, async (req, res) => {
  const user = req.user
  const { sprint, modelsUsed, howUsed, groupId } = req.body
  // add validation
  try {
    const sprintRecord = await db.Sprint.findOne({
      where: {
        sprint: sprint,
        group_id: groupId,
      },
    })
    if (!sprintRecord) {
      console.error('Sprint not found.')
      return res.status(404).json({ error: 'Sprint not found.' })
    }
    await db.UserAIUsage.create({
      student_number: user.id,
      sprint_id: sprint,
      models_used: modelsUsed,
      how_used: howUsed,
    })
    const userAIUsageEntries = await fetchUserAIUsage({ student_number: user.id })
    return res.status(201).json(userAIUsageEntries)
  } catch (error) {
    console.error('error:', error)
    return res.status(500).json({ error: 'Error creating user AI usage report.' })
  }
})

userAIUsageRouter.put('/:id', checkLogin, async (req, res) => {
  const id = req.params.id
  const user = req.user
  const { sprint, modelsUsed, howUsed } = req.body
  // add validation
  // type of id is string
  if (sprint.toString() !== id) {
    return res.status(400).json({ error: 'Sprint id mismatch.' })
  }
  try {
    await db.UserAIUsage.update(
      {
        models_used: modelsUsed,
        how_used: howUsed,
      },
      { where: [{ sprint_id: sprint }, { student_number: user.id }] },
    )

    const userAIUsageEntries = await fetchUserAIUsage({ student_number: user.id })
    return res.status(200).json(userAIUsageEntries)
  } catch (error) {
    console.error('error:', error)
    return res.status(500).json({ error: 'Error updating user AI usage report.' })
  }
})

module.exports = userAIUsageRouter
