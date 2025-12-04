// Конфигурация призов для колеса фортуны и кейсов

module.exports = {
  // Призы колеса фортуны с шансами (в процентах)
  wheelPrizes: [
    { id: 1, name: 'Доп. спин', type: 'spin', value: 1, chance: 22, color: '#4CAF50' },
    { id: 2, name: '+5 Robux', type: 'robux', value: 5, chance: 14, color: '#FFD700' },
    { id: 3, name: '+10% к заданиям', type: 'bonus', value: 10, chance: 12, color: '#2196F3' },
    { id: 4, name: 'Промокод мини', type: 'promocode', value: 1, chance: 10, color: '#9C27B0' },
    { id: 5, name: '+10 Robux', type: 'robux', value: 10, chance: 10, color: '#FFD700' },
    { id: 6, name: 'Лаки блок', type: 'case', value: 1, chance: 9, color: '#FF9800' },
    { id: 7, name: 'Обычный кейс', type: 'case', value: 1, chance: 8, color: '#795548' },
    { id: 8, name: 'Промокод редкий', type: 'promocode', value: 2, chance: 5, color: '#E91E63' },
    { id: 9, name: 'Telegram Premium', type: 'premium', value: 1, chance: 3, color: '#00BCD4' },
    { id: 10, name: 'Премиум кейс', type: 'case', value: 1, chance: 1.5, color: '#673AB7' },
    { id: 11, name: 'Админ панель (на день)', type: 'admin_access', value: 1, chance: 0.1, color: '#F44336' }
  ],

  // Призы кейсов с шансами (в процентах)
  casePrizes: [
    { id: 1, name: '+5 Robux', type: 'robux', value: 5, chance: 23, rarity: 'common' },
    { id: 2, name: '+10 Robux', type: 'robux', value: 10, chance: 18, rarity: 'common' },
    { id: 3, name: 'Промокод мини', type: 'promocode', value: 1, chance: 14, rarity: 'common' },
    { id: 4, name: '+10% к заданиям', type: 'bonus', value: 10, chance: 10, rarity: 'rare' },
    { id: 5, name: 'Лаки блок', type: 'case', value: 1, chance: 9, rarity: 'rare' },
    { id: 6, name: 'Подарок в TG', type: 'special', value: 1, chance: 6, rarity: 'rare' },
    { id: 7, name: 'Обычный кейс', type: 'case', value: 1, chance: 5, rarity: 'rare' },
    { id: 8, name: '+20 Robux', type: 'robux', value: 20, chance: 5, rarity: 'epic' },
    { id: 9, name: 'Промокод редкий', type: 'promocode', value: 2, chance: 3, rarity: 'epic' },
    { id: 10, name: 'Большой бонус 300-500', type: 'robux', value: 400, chance: 1.5, rarity: 'epic' },
    { id: 11, name: 'VIP сервер', type: 'vip_server', value: 1, chance: 1, rarity: 'legendary' },
    { id: 12, name: 'OG Brainrot', type: 'special', value: 1, chance: 0.4, rarity: 'legendary' },
    { id: 13, name: 'Telegram Premium', type: 'premium', value: 1, chance: 0.3, rarity: 'legendary' }
  ],

  // Цвета редкости
  rarityColors: {
    common: '#9E9E9E',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FFD700'
  }
};
