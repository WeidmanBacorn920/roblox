const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const UserCalendar = sequelize.define('UserCalendar', {
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
  season: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  day: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  claimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  claimed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'user_calendar',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'season', 'day']
    }
  ]
});

module.exports = UserCalendar;
