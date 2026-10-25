'use strict'

const up = async (query, Sequelize) => {
  await query.createTable('user_ai_usage', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    models_used: {
      type: Sequelize.JSONB,
    },
    how_used: {
      type: Sequelize.JSONB,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    student_number: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'student_number',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    sprint_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'sprints',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  })
}

const down = async (query) => {
  await query.dropTable('user_ai_usage')
}

module.exports = {
  up,
  down,
}
