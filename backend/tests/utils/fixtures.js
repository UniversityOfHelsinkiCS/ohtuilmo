// Users and a group created directly through the models, for the access control tests
const { testContent } = require('./topic')

const student = {
  username: 'opiskelija',
  student_number: '111111111',
  first_names: 'Olli',
  last_name: 'Opiskelija',
  email: 'olli@opiskelija.fi',
  admin: false,
}

const otherStudent = {
  username: 'toinen',
  student_number: '222222222',
  first_names: 'Tiina',
  last_name: 'Toinen',
  email: 'tiina@toinen.fi',
  admin: false,
}

const instructor = {
  username: 'ohjaaja',
  student_number: '333333333',
  first_names: 'Irma',
  last_name: 'Ohjaaja',
  email: 'irma@ohjaaja.fi',
  admin: false,
}

const admin = {
  username: 'admin',
  student_number: '444444444',
  first_names: 'Aino',
  last_name: 'Admin',
  email: 'aino@admin.fi',
  admin: true,
}

const createUsers = async (db, users = [student, otherStudent, instructor, admin]) => {
  for (const user of users) {
    await db.User.create(user)
  }
}

let groupCount = 0

// a group of an active configuration, its instructor gets the instructor role at login
const createGroup = async (db, studentNumbers, instructorId = null) => {
  groupCount++
  const configuration = await db.Configuration.create({
    name: `Konfiguraatio ${groupCount}`,
    active: true,
  })
  const topic = await db.Topic.create({
    active: true,
    configuration_id: configuration.id,
    content: testContent,
    secret_id: `asalainen${groupCount}`,
  })
  const group = await db.Group.create({
    name: `Ryhmä ${groupCount}`,
    topicId: topic.id,
    configurationId: configuration.id,
    instructorId,
  })
  await group.setStudents(studentNumbers)
  return group
}

module.exports = {
  student,
  otherStudent,
  instructor,
  admin,
  createUsers,
  createGroup,
}
