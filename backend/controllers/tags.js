const express = require('express')
const { checkAdmin, checkLogin } = require('../middleware')

const tagsRouter = express.Router()
const db = require('../models/index')

const validateTag = async ({ title }) => {
  if (!title) {
    return 'Title is missing.'
  }
  if (title.length < 3) {
    return 'Title must be at least 3 characters.'
  }
  const current_tags = await fetchFromDb()
  const current_titles = current_tags.map((tag) => tag.title)
  if (current_titles.includes(title)) {
    return 'Tag already exists.'
  }
  return null
}

const fetchFromDb = async () => {
  const tags = await db.Tag.findAll({
    attributes: ['id', 'title'],
    raw: true,
  })
  return tags
}

tagsRouter.get('/', checkLogin, async (req, res) => {
  try {
    const tags = await fetchFromDb()
    console.log('tags: ', tags)
    return res.status(200).json(tags)
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({ error: 'Error fetching tags' })
  }
})

tagsRouter.post('/', checkAdmin, async (req, res) => {
  const { title } = req.body
  const error = await validateTag({ title })
  if (error) {
    return res.status(400).json({ error })
  }
  if (!title) {
    return res.status(400).json({ error: 'Title is missing.' })
  }

  try {
    await db.Tag.create({ title })
    const tags = await fetchFromDb()
    return res.status(200).json(tags)
  } catch (error) {
    console.error('Error creating tag:', error)
    res.status(500).json({ error: 'Error creating tag.' })
  }
})

tagsRouter.delete('/:id', checkAdmin, async (req, res) => {
  const id = parseInt(req.params.id)
  const count = await db.TimeLogTag.count({ where: { tag_id: id } })

  if (count > 0) {
    return res.status(400).json({ error: 'Tag cannot be deleted because it is used in time logs.' })
  }

  try {
    await db.Tag.destroy({ where: { id } })
    const tags = await fetchFromDb()
    res.status(200).json(tags)
  } catch (error) {
    console.error('Error deleting tag:', error)
    res.status(500).json({ error: 'Error deleting tag.' })
  }
})

tagsRouter.get('/tagsByStudent/:id', checkLogin, async (req, res) => {
  const studentNumber = req.params.id
  // instructors see the tags of all students for now
  if (studentNumber !== req.user.id && !req.user.admin && !req.user.instructor) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  try {
    const timeLogs = await db.TimeLog.findAll({
      where: { student_number: studentNumber },
      include: [
        {
          model: db.Tag,
          as: 'tags',
          through: { attributes: [] },
        },
      ],
    })
    const tags = {}

    for (const timeLog of timeLogs) {
      const sprintId = timeLog.sprint_id
      const minutes = timeLog.minutes
      const sprintData = await db.Sprint.findOne({
        where: { id: sprintId },
      })

      for (const tag of timeLog.tags) {
        const tagTitle = tag.title

        if (!tags[tagTitle]) {
          tags[tagTitle] = []
        }

        const existingTagEntry = tags[tagTitle].find((entry) => entry.sprint_id === sprintId)

        if (existingTagEntry) {
          existingTagEntry.minutes += minutes
        } else {
          tags[tagTitle].push({
            sprint_id: sprintId,
            minutes: minutes,
            sprint_number: sprintData.sprint,
          })
        }
      }
    }

    return res.status(200).json(tags)
  } catch (error) {
    console.error('Error fetching tags by student:', error)
    return res.status(500).json({ error: 'Error fetching tags by student' })
  }
})

module.exports = tagsRouter
