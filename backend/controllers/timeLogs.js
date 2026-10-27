const timeLogsRouter = require('express').Router()
const { checkLogin } = require('../middleware')
const db = require('../models/index')
const { Sequelize } = require('sequelize')

const validateTimeEntry = ({ sprint, date, minutes, description }) => {
  if (isNaN(sprint) || !date || isNaN(parseFloat(minutes)) || !description) {
    return 'All fields must be filled.'
  }
  if (parseFloat(minutes) <= 0) {
    return 'Minutes must be a positive number.'
  }
  if (description.length < 5) {
    return 'Description must be over 5 characters.'
  }
  return null
}

const validateDateRange = (date, start, end) => {
  const logDate = new Date(date)
  logDate.setHours(0, 0, 0, 0)

  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  if (logDate < startDate || logDate > endDate) {
    return 'The log date is not within sprint start and end date.'
  }
  return null
}

const fetchFromDb = async (studentNumber) => {
  try {
    const rawLogs = await db.TimeLog.findAll({
      where: { student_number: studentNumber },
      attributes: [
        ['id', 'id'],
        ['date', 'date'],
        ['minutes', 'minutes'],
        ['student_number', 'studentNumber'],
        'description',
        [Sequelize.literal('sprint.sprint'), 'sprint'],
        [Sequelize.literal('group_id'), 'groupId'],
      ],
      include: [
        {
          model: db.Sprint,
          as: 'sprint',
          attributes: [],
        },
        {
          model: db.Tag,
          as: 'tags',
          attributes: ['title'],
          through: { attributes: [] },
        },
      ],
      raw: true,
      order: [
        ['date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    })

    const timeLogMap = new Map()
    rawLogs.forEach((log) => {
      const { id, studentNumber, sprint, date, minutes, description, groupId, ...rest } = log
      const formattedDate = new Date(date).toISOString().slice(0, 10)
      const timeLog = timeLogMap.get(id) || {
        id,
        studentNumber,
        sprint,
        date: formattedDate,
        minutes,
        description,
        groupId,
        tags: [],
      }
      const tag = rest['tags.title']
      if (tag) {
        timeLog.tags.push(tag)
      }
      timeLogMap.set(id, timeLog)
    })
    return Array.from(timeLogMap.values())
  } catch (error) {
    console.error('Error fetching time logs:', error)
    throw new Error('Error fetching time logs.')
  }
}

timeLogsRouter.get('/', checkLogin, async (req, res) => {
  try {
    const user_id = req.user.id
    const timeLogs = user_id ? await fetchFromDb(user_id) : []
    return res.status(200).json(timeLogs)
  } catch {
    return res.status(500).json({ error: 'Error fetching time logs.' })
  }
})

timeLogsRouter.post('/', checkLogin, async (req, res) => {
  const { sprint, date, minutes, description, tags, groupId } = req.body
  const studentNumber = req.user.id
  const newLog = {
    studentNumber,
    sprint,
    date,
    minutes,
    description,
    tags,
    groupId,
  }

  const error = validateTimeEntry(newLog)
  if (error) {
    console.error('error:', error)
    return res.status(400).json({ error })
  }

  try {
    const group = await db.Group.findByPk(groupId)
    if (!group || !(await group.hasStudent(studentNumber))) {
      return res.status(403).json({ error: 'You are not a member of the group.' })
    }

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

    const err = validateDateRange(date, sprintRecord.start_date, sprintRecord.end_date)
    if (err) {
      console.error('error:', err)
      return res.status(400).json({ error: err })
    }
    const sprintId = sprintRecord.id

    const timeLog = await db.TimeLog.create({
      student_number: studentNumber,
      sprint_id: sprintId,
      date: date,
      minutes: minutes,
      description: description,
    })

    if (tags && tags.length > 0) {
      const tagObjects = await db.Tag.findAll({
        where: {
          title: tags,
        },
      })

      const tagIds = tagObjects.map((tag) => tag.id)
      await timeLog.addTags(tagIds)
    }

    const timeLogs = await fetchFromDb(studentNumber)
    return res.status(201).json(timeLogs)
  } catch (error) {
    console.error('error:', error)
    return res.status(500).json({ error: 'Error creating time log.' })
  }
})

timeLogsRouter.delete('/:id', checkLogin, async (req, res) => {
  const id = parseInt(req.params.id)
  const userId = req.user.id

  try {
    const timeLog = await db.TimeLog.findOne({
      where: { id: id, student_number: userId },
    })

    if (!timeLog) {
      return res.status(404).json({ error: 'Time log not found or unauthorized to delete' })
    }

    await db.TimeLog.destroy({ where: { id: id } })
    const timeLogs = await fetchFromDb(userId)
    return res.status(200).json(timeLogs)
  } catch (error) {
    console.error('Error deleting time log:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

timeLogsRouter.get('/projectHoursByStudent', checkLogin, async (req, res) => {
  const studentNumber = req.user.id
  try {
    const student = await db.User.findByPk(studentNumber, {
      include: {
        model: db.Group,
        as: 'groups',
      },
    })

    if (!student || !student.groups || student.groups.length === 0) {
      return res.status(404).json({ error: 'Student is not in any group' })
    }

    const latestGroup = student.groups.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )[0]

    const sprints = await db.Sprint.findAll({
      where: {
        group_id: latestGroup.id,
      },
    })

    const sprintIds = sprints.map((sprint) => sprint.id)

    if (sprintIds.length === 0) {
      return res.status(200).json(0)
    }

    const timeLogs = await db.TimeLog.findAll({
      where: {
        student_number: studentNumber,
        sprint_id: sprintIds,
      },
    })

    const totalHours = timeLogs.reduce((sum, timelog) => sum + timelog.minutes / 60, 0)

    return res.status(200).json(totalHours)
  } catch (error) {
    console.error('Error fetching project hours:', error)
    return res.status(500).json({ error: 'Error fetching project hours' })
  }
})

module.exports = timeLogsRouter
