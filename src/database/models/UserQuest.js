const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const UserQuest = sequelize.define('UserQuest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'telegram_id'
    }
  },
  quest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'daily_quests',
      key: 'id'
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  quest_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_quests',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'quest_id', 'quest_date']
    }
  ]
});

module.exports = UserQuest;
