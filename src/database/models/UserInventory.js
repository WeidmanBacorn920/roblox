const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const UserInventory = sequelize.define('UserInventory', {
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
  item_type: {
    type: DataTypes.ENUM('case', 'wheel_spin', 'key', 'bonus', 'premium'),
    allowNull: false
  },
  item_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  obtained_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_inventory',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id', 'item_type', 'item_name']
    }
  ]
});

module.exports = UserInventory;
