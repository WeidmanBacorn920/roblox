const { DataTypes } = require('sequelize');
const sequelize = require('./connection');

const User = sequelize.define('User', {
  telegram_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  referrer_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'telegram_id'
    }
  },
  referral_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_key_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  key_active_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  language_code: {
    type: DataTypes.STRING(10),
    defaultValue: 'ru'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
