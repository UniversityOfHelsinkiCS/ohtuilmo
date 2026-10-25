module.exports = (sequelize, Sequelize) => {
  const UserAIUsage = sequelize.define(
    'user_ai_usage',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
    },
    {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  )

  return UserAIUsage
}
