const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const WheelPrize = sequelize.define('WheelPrize', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prize_type: {
    type: DataTypes.ENUM('spin', 'robux', 'bonus', 'promocode', 'case', 'premium', 'admin_access'),
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
    allowNull: false,
    comment: 'Chance in percentage (0-100)'
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#FFD700'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'wheel_prizes',
  timestamps: false
});

module.exports = WheelPrize;
