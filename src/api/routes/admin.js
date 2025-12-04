const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const {
  User,
  DailyQuest,
  AdventCalendar,
  WheelPrize,
  CasePrize,
  Promocode,
  Transaction
} = require('../../database/models');
const { authMiddleware, adminMiddleware, generatePromocode } = require('../../utils/helpers');

// Применяем middleware авторизации и проверки прав администратора
router.use(authMiddleware);
router.use(adminMiddleware);

// Получить статистику
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({
      where: {
        updated_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // за последние 24 часа
        }
      }
    });
    
    const totalBalance = await User.sum('balance');
    const totalReferrals = await User.sum('referral_count');
    const totalClicks = await User.sum('total_clicks');
    
    const recentTransactions = await Transaction.count({
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    res.json({
      totalUsers,
      activeUsers,
      totalBalance,
      totalReferrals,
      totalClicks,
      recentTransactions
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Получить список пользователей
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    
    const whereClause = search ? {
      [Op.or]: [
        { telegram_id: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } }
      ]
    } : {};
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      users,
      totalUsers: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Получить данные конкретного пользователя
router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const referrals = await User.findAll({
      where: { referrer_id: userId },
      attributes: ['telegram_id', 'username', 'first_name', 'created_at']
    });
    
    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 20
    });
    
    res.json({
      user,
      referrals,
      transactions
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Изменить баланс пользователя
router.put('/users/:id/balance', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { amount, action } = req.body; // action: 'add' или 'set'
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (action === 'add') {
      await user.increment('balance', { by: amount });
      
      await Transaction.create({
        user_id: userId,
        transaction_type: 'admin',
        amount: amount,
        description: 'Начисление администратором'
      });
    } else if (action === 'set') {
      await user.update({ balance: amount });
      
      await Transaction.create({
        user_id: userId,
        transaction_type: 'admin',
        amount: amount - user.balance,
        description: 'Установка баланса администратором'
      });
    }
    
    const updatedUser = await User.findByPk(userId);
    res.json({ success: true, balance: updatedUser.balance });
    
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Забанить/разбанить пользователя
router.put('/users/:id/ban', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { banned } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.update({ is_banned: banned });
    
    res.json({ success: true, banned: user.is_banned });
    
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Управление заданиями
router.get('/quests', async (req, res) => {
  try {
    const quests = await DailyQuest.findAll({
      order: [['id', 'ASC']]
    });
    
    res.json({ quests });
    
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Failed to get quests' });
  }
});

router.post('/quests', async (req, res) => {
  try {
    const { title, description, questType, targetValue, rewardType, rewardAmount } = req.body;
    
    const quest = await DailyQuest.create({
      title,
      description,
      quest_type: questType,
      target_value: targetValue,
      reward_type: rewardType,
      reward_amount: rewardAmount
    });
    
    res.json({ success: true, quest });
    
  } catch (error) {
    console.error('Create quest error:', error);
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

router.put('/quests/:id', async (req, res) => {
  try {
    const questId = parseInt(req.params.id);
    const { title, description, questType, targetValue, rewardType, rewardAmount, isActive } = req.body;
    
    const quest = await DailyQuest.findByPk(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    await quest.update({
      title,
      description,
      quest_type: questType,
      target_value: targetValue,
      reward_type: rewardType,
      reward_amount: rewardAmount,
      is_active: isActive
    });
    
    res.json({ success: true, quest });
    
  } catch (error) {
    console.error('Update quest error:', error);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

router.delete('/quests/:id', async (req, res) => {
  try {
    const questId = parseInt(req.params.id);
    
    const quest = await DailyQuest.findByPk(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    await quest.destroy();
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Delete quest error:', error);
    res.status(500).json({ error: 'Failed to delete quest' });
  }
});

// Управление календарем
router.get('/calendar', async (req, res) => {
  try {
    const season = parseInt(req.query.season) || 1;
    
    const calendar = await AdventCalendar.findAll({
      where: { season },
      order: [['day', 'ASC']]
    });
    
    res.json({ calendar });
    
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: 'Failed to get calendar' });
  }
});

router.put('/calendar/:id', async (req, res) => {
  try {
    const calendarId = parseInt(req.params.id);
    const { requiredReferrals, rewardType, rewardAmount, rewardData } = req.body;
    
    const day = await AdventCalendar.findByPk(calendarId);
    if (!day) {
      return res.status(404).json({ error: 'Calendar day not found' });
    }
    
    await day.update({
      required_referrals: requiredReferrals,
      reward_type: rewardType,
      reward_amount: rewardAmount,
      reward_data: rewardData
    });
    
    res.json({ success: true, day });
    
  } catch (error) {
    console.error('Update calendar error:', error);
    res.status(500).json({ error: 'Failed to update calendar' });
  }
});

// Управление призами колеса
router.get('/wheel-prizes', async (req, res) => {
  try {
    const prizes = await WheelPrize.findAll({
      order: [['id', 'ASC']]
    });
    
    res.json({ prizes });
    
  } catch (error) {
    console.error('Get wheel prizes error:', error);
    res.status(500).json({ error: 'Failed to get wheel prizes' });
  }
});

router.put('/wheel-prizes/:id', async (req, res) => {
  try {
    const prizeId = parseInt(req.params.id);
    const { name, prizeType, prizeValue, chance, color, isActive } = req.body;
    
    const prize = await WheelPrize.findByPk(prizeId);
    if (!prize) {
      return res.status(404).json({ error: 'Prize not found' });
    }
    
    await prize.update({
      name,
      prize_type: prizeType,
      prize_value: prizeValue,
      chance,
      color,
      is_active: isActive
    });
    
    res.json({ success: true, prize });
    
  } catch (error) {
    console.error('Update wheel prize error:', error);
    res.status(500).json({ error: 'Failed to update wheel prize' });
  }
});

// Управление призами кейсов
router.get('/case-prizes', async (req, res) => {
  try {
    const prizes = await CasePrize.findAll({
      order: [['id', 'ASC']]
    });
    
    res.json({ prizes });
    
  } catch (error) {
    console.error('Get case prizes error:', error);
    res.status(500).json({ error: 'Failed to get case prizes' });
  }
});

router.put('/case-prizes/:id', async (req, res) => {
  try {
    const prizeId = parseInt(req.params.id);
    const { name, prizeType, prizeValue, chance, rarity, isActive } = req.body;
    
    const prize = await CasePrize.findByPk(prizeId);
    if (!prize) {
      return res.status(404).json({ error: 'Prize not found' });
    }
    
    await prize.update({
      name,
      prize_type: prizeType,
      prize_value: prizeValue,
      chance,
      rarity,
      is_active: isActive
    });
    
    res.json({ success: true, prize });
    
  } catch (error) {
    console.error('Update case prize error:', error);
    res.status(500).json({ error: 'Failed to update case prize' });
  }
});

// Управление промокодами
router.get('/promocodes', async (req, res) => {
  try {
    const promocodes = await Promocode.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({ promocodes });
    
  } catch (error) {
    console.error('Get promocodes error:', error);
    res.status(500).json({ error: 'Failed to get promocodes' });
  }
});

router.post('/promocodes', async (req, res) => {
  try {
    const { code, rewardType, rewardAmount, maxUses, expiresAt } = req.body;
    
    const generatedCode = code || generatePromocode();
    
    const promocode = await Promocode.create({
      code: generatedCode.toUpperCase(),
      reward_type: rewardType,
      reward_amount: rewardAmount,
      max_uses: maxUses || null,
      expires_at: expiresAt || null
    });
    
    res.json({ success: true, promocode });
    
  } catch (error) {
    console.error('Create promocode error:', error);
    res.status(500).json({ error: 'Failed to create promocode' });
  }
});

router.put('/promocodes/:id', async (req, res) => {
  try {
    const promocodeId = parseInt(req.params.id);
    const { isActive } = req.body;
    
    const promocode = await Promocode.findByPk(promocodeId);
    if (!promocode) {
      return res.status(404).json({ error: 'Promocode not found' });
    }
    
    await promocode.update({ is_active: isActive });
    
    res.json({ success: true, promocode });
    
  } catch (error) {
    console.error('Update promocode error:', error);
    res.status(500).json({ error: 'Failed to update promocode' });
  }
});

router.delete('/promocodes/:id', async (req, res) => {
  try {
    const promocodeId = parseInt(req.params.id);
    
    const promocode = await Promocode.findByPk(promocodeId);
    if (!promocode) {
      return res.status(404).json({ error: 'Promocode not found' });
    }
    
    await promocode.destroy();
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Delete promocode error:', error);
    res.status(500).json({ error: 'Failed to delete promocode' });
  }
});

module.exports = router;
