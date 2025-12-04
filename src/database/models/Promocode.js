const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Promocode = sequelize.define('Promocode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  reward_type: {
    type: DataTypes.ENUM('robux', 'wheel_spin', 'case', 'key'),
    allowNull: false
  },
  reward_amount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  max_uses: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  current_uses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'promocodes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Promocode;
