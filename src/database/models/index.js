const User = require('./User');
const DailyQuest = require('./DailyQuest');
const UserQuest = require('./UserQuest');
const AdventCalendar = require('./AdventCalendar');
const UserCalendar = require('./UserCalendar');
const WheelPrize = require('./WheelPrize');
const CasePrize = require('./CasePrize');
const Promocode = require('./Promocode');
const UserPromocode = require('./UserPromocode');
const UserInventory = require('./UserInventory');
const Transaction = require('./Transaction');

// Установка связей между таблицами
User.hasMany(UserQuest, { foreignKey: 'user_id', as: 'quests' });
UserQuest.belongsTo(User, { foreignKey: 'user_id' });
UserQuest.belongsTo(DailyQuest, { foreignKey: 'quest_id' });

User.hasMany(UserCalendar, { foreignKey: 'user_id', as: 'calendar' });
UserCalendar.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(UserPromocode, { foreignKey: 'user_id', as: 'promocodes' });
UserPromocode.belongsTo(User, { foreignKey: 'user_id' });
UserPromocode.belongsTo(Promocode, { foreignKey: 'promocode_id' });

User.hasMany(UserInventory, { foreignKey: 'user_id', as: 'inventory' });
UserInventory.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

// Реферальные связи
User.hasMany(User, { foreignKey: 'referrer_id', as: 'referrals' });
User.belongsTo(User, { foreignKey: 'referrer_id', as: 'referrer' });

module.exports = {
  User,
  DailyQuest,
  UserQuest,
  AdventCalendar,
  UserCalendar,
  WheelPrize,
  CasePrize,
  Promocode,
  UserPromocode,
  UserInventory,
  Transaction
};
