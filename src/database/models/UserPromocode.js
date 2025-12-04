const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const UserPromocode = sequelize.define('UserPromocode', {
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
  promocode_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'promocodes',
      key: 'id'
    }
  },
  used_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_promocodes',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'promocode_id']
    }
  ]
});

module.exports = UserPromocode;
