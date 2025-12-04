const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const CasePrize = sequelize.define('CasePrize', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  case_type: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
    defaultValue: 'common'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prize_type: {
    type: DataTypes.ENUM('robux', 'promocode', 'bonus', 'case', 'premium', 'vip_server', 'special'),
    allowNull: false
  },
  prize_value: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  prize_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  chance: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  rarity: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
    defaultValue: 'common'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'case_prizes',
  timestamps: false
});

module.exports = CasePrize;
