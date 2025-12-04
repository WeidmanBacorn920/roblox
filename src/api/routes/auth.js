const express = require('express');
const router = express.Router();
const { User } = require('../../database/models');
const { validateTelegramWebAppData, createToken } = require('../../utils/helpers');

// Авторизация через Telegram Web App
router.post('/', async (req, res) => {
  try {
    const { initData } = req.body;
    
    // Валидация данных от Telegram
    if (!validateTelegramWebAppData(initData)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }
    
    // Парсинг данных пользователя
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    const userData = JSON.parse(userJson);
    
    const userId = userData.id;
    
    // Поиск пользователя в базе
    let user = await User.findByPk(userId);
    
    if (!user) {
      // Если пользователь не найден, создаем нового
      user = await User.create({
        telegram_id: userId,
        username: userData.username || userData.first_name,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        language_code: userData.language_code || 'ru'
      });
    }
    
    // Создание JWT токена
    const token = createToken(userId);
    
    // Возврат данных пользователя
    res.json({
      token,
      user: {
        id: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        balance: user.balance,
        referralCount: user.referral_count,
        totalClicks: user.total_clicks,
        hasActiveKey: user.key_active_until && new Date(user.key_active_until) > new Date()
      }
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;
