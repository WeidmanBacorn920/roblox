const express = require('express');
const router = express.Router();
const { User, Transaction } = require('../../database/models');
const { authMiddleware } = require('../../utils/helpers');

// Получить данные пользователя
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Проверка доступа
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверка активности ключа
    const hasActiveKey = user.key_active_until && new Date(user.key_active_until) > new Date();
    
    res.json({
      id: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      balance: user.balance,
      referralCount: user.referral_count,
      totalClicks: user.total_clicks,
      hasActiveKey,
      keyActiveUntil: user.key_active_until,
      createdAt: user.created_at
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Получить историю транзакций
router.get('/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({ transactions });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Получить список рефералов
router.get('/:id/referrals', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const referrals = await User.findAll({
      where: { referrer_id: userId },
      attributes: ['telegram_id', 'username', 'first_name', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ referrals });
    
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

module.exports = router;
