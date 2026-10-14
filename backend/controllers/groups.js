const router = require('express').Router()
const { Op } = require('sequelize')
const db = require('../models')
const { checkAdmin, checkInstructor, checkLogin } = require('../middleware')

const formatGroup = (dbGroup) => {
  // pluck only fields we know and need, map student object to student_number
  const {
    id,
    name,
    createdAt,
    updatedAt,
    topicId,
    configurationId,
    instructorId,
    students,
    isShortProject,
  } = dbGroup
  return {
    id,
    name,
    createdAt,
    updatedAt,
    topicId,
    instructorId,
    configurationId,
    studentIds: students.map(({ student_number }) => student_number),
    isShortProject,
  }
}

router.get('/', checkInstructor, async (req, res) => {
  const groups = await db.Group.findAll({
    include: [
      {
        as: 'students',
        model: db.User,
        attributes: ['student_number'], // only select the student number
        through: { attributes: [] }, // don't ignore junction table stuff
      },
    ],
  })
  const deserialized = groups.map(formatGroup)
  res.status(200).json(deserialized)
})

const isNil = (obj) => obj === null || obj === undefined
const isNotNil = (obj) => {
  return !isNil(obj)
}

const hasDuplicates = (arr) => {
  const noDuplicates = new Set(arr)
  return arr.length !== noDuplicates.size
}

const topicDoesNotExist = async (topicId) => {
  const foundTopic = await db.Topic.findByPk(topicId)
  return !foundTopic
}

const configDoesNotExist = async (configId) => {
  const config = await db.Configuration.findByPk(configId)
  return !config
}

const instructorDoesNotExist = async (studentNumber) => {
  const user = await db.User.findByPk(studentNumber)
  return !user
}

const findNonExistingStudents = async (studentNumbers) => {
  const students = await db.User.findAll({
    where: {
      student_number: {
        [Op.in]: studentNumbers,
      },
    },
  })

  const expectedStudentNumbers = new Set(students.map((user) => user.student_number))

  return studentNumbers.filter((studentNumber) => !expectedStudentNumbers.has(studentNumber))
}

const validateGroup = async (body) => {
  if (!body) return 'POST body is missing'

  const { name, topicId, configurationId, instructorId, studentIds, isShortProject } = body

  if (isNil(name) || typeof name !== 'string') return 'name is missing'
  if (isNil(topicId) || typeof topicId !== 'number') return 'topicId is missing'
  if (isNil(configurationId) || typeof configurationId !== 'number')
    return 'configurationId is missing'
  if (isNil(studentIds) || !Array.isArray(studentIds)) return 'studentIds is missing'
  if (studentIds.some((id) => isNil(id) || typeof id !== 'string'))
    return 'students has invalid student numbers'

  if (hasDuplicates(studentIds)) {
    return 'duplicate student numbers'
  }

  if (isNotNil(instructorId) && typeof instructorId !== 'string') {
    return 'instructorId should be a string'
  }

  if (await topicDoesNotExist(topicId)) {
    return `Topic ${topicId} does not exist`
  }

  if (await configDoesNotExist(configurationId)) {
    return `Configuration ${configurationId} does not exist`
  }

  if (!!instructorId && (await instructorDoesNotExist(instructorId))) {
    return `Instructor user ${instructorId} does not exist`
  }

  if (isNil(isShortProject) || typeof isShortProject !== 'boolean') {
    return 'Project length is missing'
  }

  const nonExistingStudents = await findNonExistingStudents(studentIds)
  if (nonExistingStudents.length > 0) {
    return nonExistingStudents.length === 1
      ? `Student "${nonExistingStudents[0]}" does not exist`
      : `Students [${nonExistingStudents.join(', ')}] do not exist`
  }

  return null
}

const formatCreatedGroup = (dbGroup, dbGroupStudents) => {
  const { id, name, createdAt, updatedAt, topicId, configurationId, instructorId, isShortProject } =
    dbGroup
  return {
    id,
    name,
    createdAt,
    updatedAt,
    topicId,
    instructorId,
    configurationId,
    studentIds: dbGroupStudents.map(({ userStudentNumber }) => userStudentNumber),
    isShortProject,
  }
}

router.post('/', checkAdmin, async (req, res) => {
  const validationError = await validateGroup(req.body)

  if (validationError !== null) {
    return res.status(400).json({ error: validationError })
  }

  const { name, topicId, configurationId, instructorId, studentIds, isShortProject } = req.body

  // Wrap group creation and group_students join table setting in a transaction
  // so that the group is not created if a foreign key violation occurs
  // during setStudents.
  //
  // Group.create returns the created group, and setStudents returns the
  // group_students join table rows that were created.
  try {
    const { createdGroup, groupStudents } = await db.sequelize.transaction(async (transaction) => {
      const options = { transaction }

      const createdGroup = await db.Group.create(
        {
          name,
          topicId,
          configurationId,
          instructorId: instructorId || null,
          isShortProject,
        },
        options,
      )
      const groupStudents = await createdGroup.setStudents(studentIds, options)

      return {
        createdGroup,
        groupStudents,
      }
    })

    // setStudents returns an array of the created group_students rows, but that
    // array seems to be wrappend in another array too? if no students were
    // passed, i.e. an empty array was passed to setStudents, it just returns
    // an empty array!
    const students = groupStudents.length > 0 ? groupStudents[0] : []

    res.json(formatCreatedGroup(createdGroup, students))
  } catch (err) {
    console.error('Error while creating group', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:groupId', checkAdmin, async (req, res) => {
  const validationError = await validateGroup(req.body)

  if (validationError !== null) {
    return res.status(400).json({ error: validationError })
  }

  const { name, topicId, instructorId, studentIds, isShortProject } = req.body

  try {
    const group = await db.Group.findOne({
      where: { id: req.params.groupId },
    })

    if (!group) {
      return res.status(400).json({ error: 'group does not exist' })
    }

    const updatedGroup = await db.sequelize.transaction(async (transaction) => {
      const options = { transaction }

      const updatedGroup = await group.update(
        {
          name,
          topicId,
          instructorId: instructorId || null,
          isShortProject,
        },
        {
          ...options,
          returning: true,
          plain: true,
        },
      )

      await updatedGroup.setStudents(studentIds, options)

      return updatedGroup
    })

    // Getting updated students from inside the transaction did not work,
    // so we fetch the whole group here

    if (updatedGroup) {
      const updatedGroupWithStudents = await db.Group.findOne({
        where: { id: req.params.groupId },
        include: [
          {
            as: 'students',
            model: db.User,
            attributes: ['student_number'], // only select the student number
            through: { attributes: [] }, // don't ignore junction table stuff
          },
        ],
      })
      return res.status(200).json(formatGroup(updatedGroupWithStudents))
    } else {
      return res.status(500).json({ error: 'Internal server error' })
    }
  } catch (error) {
    console.error('Error while updating group', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:groupId', checkAdmin, async (req, res) => {
  const success = await db.Group.destroy({ where: { id: req.params.groupId } })
  if (success) {
    console.log(`Group ${req.params.groupId} destroyed.`)
  } else {
    console.log('Nothing to delete.')
  }
  return res.status(204).end()
})

router.get('/bystudent/:student', checkLogin, async (req, res) => {
  if (req.params.student !== req.user.id && !req.user.admin) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const studentId = req.params.student
    const user = await db.User.findByPk(studentId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const registrationManagement = await db.RegistrationManagement.findOne({
      order: [['createdAt', 'DESC']],
    })

    const peerReviewConf = registrationManagement.peer_review_conf
    const projectConf = registrationManagement.project_registration_conf

    // return users groups where configuration is either on current
    // peerreview or project registration configuration
    const allGroups = await user.getGroups({
      where: {
        [Op.or]: [{ configurationId: peerReviewConf }, { configurationId: projectConf }],
      },
      include: [
        {
          as: 'students',
          model: db.User,
          attributes: ['first_names', 'last_name'], // only select the student number
          through: { attributes: [] }, // don't ignore junction table stuff
        },
      ],
    })

    if (!allGroups || allGroups.length === 0) {
      return res.status(200).json(null)
    }

    const peerReviewGroup = allGroups.find((group) => group.configurationId === peerReviewConf)
    const projectGroup = allGroups.find((group) => group.configurationId === projectConf)

    const usersGroup = peerReviewGroup ? peerReviewGroup : projectGroup

    const extractCallingName = (firstNames) => {
      if (firstNames.includes('*')) {
        return firstNames.split('*')[1].split(' ')[0]
      }
      return firstNames.split(' ')[0]
    }

    const instructorName = await db.User.findByPk(usersGroup.instructorId)
    const instructorString = instructorName
      ? extractCallingName(instructorName.first_names) + ' ' + instructorName.last_name
      : ''

    return res.status(200).json({
      id: usersGroup.id,
      configurationId: usersGroup.configurationId,
      groupName: usersGroup.name,
      students: usersGroup.students,
      instructor: instructorString,
      isShortProject: usersGroup.isShortProject,
    })
  } catch (error) {
    console.error('Error while updating group', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/byinstructor/:instructor', checkLogin, async (req, res) => {
  if (req.params.instructor !== req.user.id && !req.user.admin) {
    return res.status(401).json({ error: 'Forbidden' })
  }

  try {
    const groups = await db.Group.findAll({
      where: { instructorId: req.params.instructor },
      include: [
        {
          as: 'students',
          model: db.User,
          attributes: ['first_names', 'last_name'], // only select the student number
          through: { attributes: [] }, // don't ignore junction table stuff
        },
      ],
    })
    return res.status(200).json(
      groups.map((group) => {
        return {
          id: group.id,
          configurationId: group.configurationId,
          groupName: group.name,
          students: group.students,
        }
      }),
    )
  } catch (error) {
    console.error('Error while getting group', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
