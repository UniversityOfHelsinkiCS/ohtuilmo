const express = require('express')
const { checkAdmin, checkLogin } = require('../middleware')
const db = require('../models/index')
const { Op } = require('sequelize')
const { groupBy } = require('lodash')
const userAIUsageRouter = express.Router()

const modelKeys = ['codex', 'other', 'claude', 'cursor', 'copilot', 'curreChat', 'otherExamples']
const modelHow = [
  'infra',
  'tests',
  'features',
  'planning',
  'databases',
  'debugging',
  'codeReview',
  'uiPlanning',
  'refactoring',
  'documentation',
  'understandCode',
]
const options = ['none', 'consult', 'generate']
const validateInput = (modelsUsed, howUsed, sprint, groupId) => {
  const correctModels = Object.keys(modelsUsed).every(
    (key) =>
      modelKeys.includes(key) &&
      ((key !== 'otherExamples' && typeof modelsUsed[key] === 'boolean') ||
        (key === 'otherExamples' && typeof modelsUsed[key] === 'string')),
  )
  const correctHows = Object.keys(howUsed).every(
    (key) => modelHow.includes(key) && options.includes(howUsed[key]),
  )
  return typeof sprint === 'number' && typeof groupId === 'number' && correctModels && correctHows
}

const computeSprintStatistics = (sprintAIUSageData, sprintId) => {
  const stats = {
    sprintId: sprintId,
    howUsedNumbers: {
      understandCode: { consult: 0, generate: 0 },
      debugging: { consult: 0, generate: 0 },
      features: { consult: 0, generate: 0 },
      refactoring: { consult: 0, generate: 0 },
      codeReview: { consult: 0, generate: 0 },
      planning: { consult: 0, generate: 0 },
      uiPlanning: { consult: 0, generate: 0 },
      documentation: { consult: 0, generate: 0 },
      tests: { consult: 0, generate: 0 },
      databases: { consult: 0, generate: 0 },
      infra: { consult: 0, generate: 0 },
    },
    totalHowUsed: 0,
    modelsUsedNumbers: {
      claude: 0,
      curreChat: 0,
      cursor: 0,
      copilot: 0,
      codex: 0,
      other: 0,
    },
    totalModelsUsed: 0,
  }

  for (const usage of sprintAIUSageData) {
    Object.keys(usage.howUsed).forEach((key) => {
      stats.howUsedNumbers[key]['consult'] += usage.howUsed[key] === 'consult' ? 1 : 0
      stats.howUsedNumbers[key]['generate'] += usage.howUsed[key] === 'generate' ? 1 : 0
      stats.totalHowUsed +=
        usage.howUsed[key] === 'consult' || usage.howUsed[key] === 'generate' ? 1 : 0
    })
    Object.keys(usage.modelsUsed).forEach((key) => {
      if (key !== 'otherExamples') {
        stats.modelsUsedNumbers[key] += usage.modelsUsed[key] ? 1 : 0
        stats.totalModelsUsed += usage.modelsUsed[key] ? 1 : 0
      }
    })
  }
  return stats
}

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
    return res.status('403').json({ error: 'Forbidden access' })
  }
  if (user.instructor) {
    const groups = await db.Group.findAll({
      attributes: ['id'],
      where: { instructorId: user.id },
      include: [
        {
          as: 'students',
          model: db.User,
          attributes: ['student_number'],
          through: { attributes: [] },
        },
      ],
    })
    if (!groups) {
      return res.status('404').json({ error: 'No groups found for the instructor.' })
    }
    const studentNumberList = groups
      .flatMap((group) => group.students)
      .map((user) => user.dataValues.student_number)

    configurations = {
      student_number: {
        [Op.in]: studentNumberList,
      },
    }
  }

  try {
    const usersAIUsage = await db.UserAIUsage.findAll({
      attributes: [
        'id',
        ['models_used', 'modelsUsed'],
        ['student_number', 'studentNumber'],
        ['how_used', 'howUsed'],
        ['sprint_id', 'sprintId'],
      ],
      where: configurations,
      raw: true,
    })
    if (!usersAIUsage) {
      return res.status(404).json({ error: 'AI usage not found' })
    }

    const groupedBySprint = groupBy(usersAIUsage, 'sprintId')
    let dataArray = []
    for (const sprint of Object.keys(groupedBySprint)) {
      const statistics = computeSprintStatistics(groupedBySprint[sprint], sprint)
      dataArray.push(statistics)
    }
    return res.status(200).json(dataArray)
  } catch (error) {
    console.error('Error fetching user`s AI usage:', error)
    return res.status(500).json({ error: `Error fetching user's AI usage: ${error}` })
  }
})

userAIUsageRouter.get('/answers', checkAdmin, async (_req, res) => {
  // bring all answers of students
  return res.status(404).json({ error: 'Not found' })
})

userAIUsageRouter.post('/', checkLogin, async (req, res) => {
  const user = req.user
  const { sprint, modelsUsed, howUsed, groupId } = req.body
  const validated = validateInput(modelsUsed, howUsed, sprint, groupId)
  if (!validated) {
    return res.status(400).json({ error: 'Data malformatted' })
  }
  try {
    const studentOfGroup = await db.Group.findOne({
      where: { id: groupId },
      include: [
        {
          as: 'students',
          model: db.User,
          attributes: ['student_number'],
          through: { attributes: [] },
          where: {
            student_number: user.id,
          },
        },
      ],
    })

    if (!studentOfGroup) {
      return res.status(403).json({ error: 'Forbidden, not a member of the group' })
    }

    const sprintRecord = await db.Sprint.findOne({
      attributes: ['id', ['start_date', 'startDate'], ['end_date', 'endDate']],
      where: {
        id: sprint,
        group_id: groupId,
      },
    })

    if (!sprintRecord) {
      return res.status(404).json({ error: 'Sprint not found.' })
    }

    const todaysDate = new Date()
    if (todaysDate < sprintRecord.startDate && todaysDate > sprintRecord.endDate) {
      return res.status(403).json({ error: 'Forbidden, sprint is already closed.' })
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
  const { sprint, modelsUsed, howUsed, groupId } = req.body
  const validated = validateInput(modelsUsed, howUsed, sprint, groupId)

  if (!validated) {
    return res.status(400).json({ error: 'Data malformatted' })
  }
  // type of id is string
  if (sprint.toString() !== id) {
    return res.status(400).json({ error: 'Sprint id mismatch.' })
  }
  try {
    const studentOfGroup = await db.Group.findOne({
      where: { id: groupId },
      include: [
        {
          as: 'students',
          model: db.User,
          attributes: ['student_number'],
          through: { attributes: [] },
          where: {
            student_number: user.id,
          },
        },
      ],
    })

    if (!studentOfGroup) {
      return res.status(403).json({ error: 'Forbidden, not a member of the group' })
    }

    const sprintRecord = await db.Sprint.findOne({
      attributes: ['id', ['start_date', 'startDate'], ['end_date', 'endDate']],
      where: {
        id: sprint,
        group_id: groupId,
      },
    })
    if (!sprintRecord) {
      return res.status(404).json({ error: 'Sprint not found.' })
    }
    const todaysDate = new Date()
    if (todaysDate < sprintRecord.startDate && todaysDate > sprintRecord.endDate) {
      return res.status(403).json({ error: 'Forbidden, sprint is already closed.' })
    }

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
