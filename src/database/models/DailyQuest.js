const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const DailyQuest = sequelize.define('DailyQuest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  quest_type: {
    type: DataTypes.ENUM('clicks', 'referrals', 'login', 'wheel_spin', 'case_open'),
    allowNull: false
  },
  target_value: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reward_type: {
    type: DataTypes.ENUM('robux', 'key', 'case', 'wheel_spin'),
    defaultValue: 'robux'
  },
  reward_amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'daily_quests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = DailyQuest;
