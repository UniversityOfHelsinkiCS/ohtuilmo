const groupSprintSummaryRouter = require('express').Router()
const { checkLogin } = require('../middleware')
const db = require('../models/index')

const validateAccess = async (groupId, userId) => {
  const group = await db.Group.findByPk(groupId)
  if (!group) {
    console.log('Group not found')
    return false
  }
  const isMember = await group.hasStudent(userId)
  const isInstructor = group.instructorId === userId

  return isMember || isInstructor
}

const getGroupSprintSummary = async (groupId) => {
  const sprints = await db.Sprint.findAll({
    where: { group_id: groupId },
    attributes: ['id', 'sprint', 'start_date', 'end_date'],
  })

  const sprintIds = sprints.map((sprint) => sprint.id)

  const rawLogs = await db.TimeLog.findAll({
    where: { sprint_id: { [db.Sequelize.Op.in]: sprintIds } },
    attributes: [
      'sprint_id',
      'student_number',
      [db.Sequelize.fn('sum', db.Sequelize.col('minutes')), 'total_minutes'],
    ],
    group: ['sprint_id', 'student_number'],
  })

  const studentNumbers = rawLogs.map((log) => log.student_number)
  const users = await db.User.findAll({
    where: { student_number: { [db.Sequelize.Op.in]: studentNumbers } },
    attributes: ['student_number', 'first_names', 'last_name'],
  })

  const nameMap = users.reduce((map, user) => {
    const firstName = user.first_names.split(' ')[0]
    map[user.student_number] = `${firstName} ${user.last_name}`
    return map
  }, {})

  const totalMap = {}

  const logsMap = rawLogs.reduce((map, log) => {
    if (!map[log.sprint_id]) {
      map[log.sprint_id] = {}
    }
    const name = nameMap[log.student_number]
    map[log.sprint_id][name] = log.dataValues.total_minutes

    if (!totalMap[name]) {
      totalMap[name] = 0
    }
    totalMap[name] += parseInt(log.dataValues.total_minutes, 10)

    return map
  }, {})

  const result = sprints.map((sprint) => ({
    [sprint.sprint]: Object.entries(logsMap[sprint.id] || {})
      .map(([name, total_minutes]) => ({
        [name]: parseInt(total_minutes, 10) || 0,
      }))
      .concat({
        start_date: sprint.start_date,
        end_date: sprint.end_date,
      }),
  }))

  result.push({
    Total: Object.entries(totalMap).map(([name, total_minutes]) => ({
      [name]: total_minutes,
    })),
  })

  return JSON.stringify(result, null, 2)
}

groupSprintSummaryRouter.get('/:id', checkLogin, async (req, res) => {
  const groupId = req.params.id
  const userId = req.user.id
  const isAdmin = req.user.admin

  const access = (await validateAccess(groupId, userId)) || isAdmin

  if (!access) {
    console.error('Group not found or user not authorized.')
    return res.status(403).json({ error: 'Group not found or user not authorized.' })
  }

  const result = await getGroupSprintSummary(groupId)
  if (result === undefined) {
    console.error('Error in fetching group sprint summary.')
    return res.status(500).json({ error: 'Error in fetching group sprint summary' })
  }

  return res.status(200).json(result)
})

module.exports = groupSprintSummaryRouter
