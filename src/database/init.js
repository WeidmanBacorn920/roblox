const sequelize = require('./connection');
const {
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
} = require('./models');

async function initDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    console.log('🔄 Creating tables...');
    await sequelize.sync({ force: false }); // Set to true to drop existing tables
    console.log('✅ All tables created successfully.');

    // Инициализация базовых данных
    await initializeDefaultData();

    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function initializeDefaultData() {
  console.log('🔄 Initializing default data...');

  // Создание базовых ежедневных заданий
  const questsExist = await DailyQuest.count();
  if (questsExist === 0) {
    await DailyQuest.bulkCreate([
      {
        title: 'Кликер-мастер',
        description: 'Сделай 500 кликов',
        quest_type: 'clicks',
        target_value: 500,
        reward_type: 'robux',
        reward_amount: 10
      },
      {
        title: 'Пригласи друзей',
        description: 'Пригласи 2 новых друзей',
        quest_type: 'referrals',
        target_value: 2,
        reward_type: 'key',
        reward_amount: 1
      },
      {
        title: 'Удачливый игрок',
        description: 'Открой 3 кейса',
        quest_type: 'case_open',
        target_value: 3,
        reward_type: 'robux',
        reward_amount: 15
      }
    ]);
    console.log('✅ Default quests created.');
  }

  // Создание призов для колеса фортуны
  const wheelPrizesExist = await WheelPrize.count();
  if (wheelPrizesExist === 0) {
    await WheelPrize.bulkCreate([
      { name: 'Доп. спин', prize_type: 'spin', prize_value: 1, chance: 22, color: '#4CAF50' },
      { name: '+5 Robux', prize_type: 'robux', prize_value: 5, chance: 14, color: '#FFD700' },
      { name: '+10% к заданиям', prize_type: 'bonus', prize_value: 10, chance: 12, color: '#2196F3' },
      { name: 'Промокод мини', prize_type: 'promocode', prize_value: 1, chance: 10, color: '#9C27B0' },
      { name: '+10 Robux', prize_type: 'robux', prize_value: 10, chance: 10, color: '#FFD700' },
      { name: 'Лаки блок', prize_type: 'case', prize_value: 1, chance: 9, color: '#FF9800' },
      { name: 'Обычный кейс', prize_type: 'case', prize_value: 1, chance: 8, color: '#795548' },
      { name: 'Промокод редкий', prize_type: 'promocode', prize_value: 2, chance: 5, color: '#E91E63' },
      { name: 'Telegram Premium', prize_type: 'premium', prize_value: 1, chance: 3, color: '#00BCD4' },
      { name: 'Премиум кейс', prize_type: 'case', prize_value: 1, chance: 1.5, color: '#673AB7' },
      { name: 'Админ панель (на день)', prize_type: 'admin_access', prize_value: 1, chance: 0.1, color: '#F44336' }
    ]);
    console.log('✅ Wheel prizes created.');
  }

  // Создание призов для кейсов
  const casePrizesExist = await CasePrize.count();
  if (casePrizesExist === 0) {
    await CasePrize.bulkCreate([
      { case_type: 'common', name: '+5 Robux', prize_type: 'robux', prize_value: 5, chance: 23, rarity: 'common' },
      { case_type: 'common', name: '+10 Robux', prize_type: 'robux', prize_value: 10, chance: 18, rarity: 'common' },
      { case_type: 'common', name: 'Промокод мини', prize_type: 'promocode', prize_value: 1, chance: 14, rarity: 'common' },
      { case_type: 'common', name: '+10% к заданиям', prize_type: 'bonus', prize_value: 10, chance: 10, rarity: 'rare' },
      { case_type: 'common', name: 'Лаки блок', prize_type: 'case', prize_value: 1, chance: 9, rarity: 'rare' },
      { case_type: 'common', name: 'Подарок в TG', prize_type: 'special', prize_value: 1, chance: 6, rarity: 'rare' },
      { case_type: 'common', name: 'Обычный кейс', prize_type: 'case', prize_value: 1, chance: 5, rarity: 'rare' },
      { case_type: 'common', name: '+20 Robux', prize_type: 'robux', prize_value: 20, chance: 5, rarity: 'epic' },
      { case_type: 'common', name: 'Промокод редкий', prize_type: 'promocode', prize_value: 2, chance: 3, rarity: 'epic' },
      { case_type: 'common', name: 'Большой бонус 300-500', prize_type: 'robux', prize_value: 400, chance: 1.5, rarity: 'epic' },
      { case_type: 'common', name: 'VIP сервер', prize_type: 'vip_server', prize_value: 1, chance: 1, rarity: 'legendary' },
      { case_type: 'common', name: 'OG Brainrot', prize_type: 'special', prize_value: 1, chance: 0.4, rarity: 'legendary' },
      { case_type: 'common', name: 'Telegram Premium', prize_type: 'premium', prize_value: 1, chance: 0.3, rarity: 'legendary' }
    ]);
    console.log('✅ Case prizes created.');
  }

  // Создание адвент-календаря (30 дней, сезон 1)
  const calendarExists = await AdventCalendar.count();
  if (calendarExists === 0) {
    const calendarDays = [];
    for (let day = 1; day <= 30; day++) {
      calendarDays.push({
        season: 1,
        day: day,
        required_referrals: day === 1 ? 0 : Math.floor(day / 3),
        reward_type: day % 5 === 0 ? 'case' : 'robux',
        reward_amount: day % 5 === 0 ? 1 : day * 5
      });
    }
    await AdventCalendar.bulkCreate(calendarDays);
    console.log('✅ Advent calendar created (30 days).');
  }

  console.log('✅ Default data initialized.');
}

// Запуск инициализации
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, initializeDefaultData };
