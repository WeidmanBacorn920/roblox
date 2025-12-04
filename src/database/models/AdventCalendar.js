const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const AdventCalendar = sequelize.define('AdventCalendar', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  season: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  day: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  required_referrals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reward_type: {
    type: DataTypes.ENUM('robux', 'case', 'promocode', 'wheel_spin', 'premium'),
    allowNull: false
  },
  reward_amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reward_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'advent_calendar',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['season', 'day']
    }
  ]
});

module.exports = AdventCalendar;
