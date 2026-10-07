'use strict'
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    'user',
    {
      student_number: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING,
      },
      first_names: {
        type: Sequelize.STRING,
      },
      last_name: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      research_consent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      underscored: true,
    },
  )

  return User
}
