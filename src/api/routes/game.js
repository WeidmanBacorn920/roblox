const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
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
} = require('../../database/models');
const { authMiddleware, selectRandomPrize } = require('../../utils/helpers');

// Кликер - обработка клика
router.post('/click', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверка активности ключа дня
    const hasActiveKey = user.key_active_until && new Date(user.key_active_until) > new Date();
    
    if (!hasActiveKey) {
      return res.status(403).json({ error: 'Key required', message: 'Необходим активный ключ дня' });
    }
    
    // Награда за клик
    const reward = parseInt(process.env.CLICK_REWARD) || 1;
    
    await user.increment({
      balance: reward,
      total_clicks: 1
    });
    
    // Создание транзакции
    await Transaction.create({
      user_id: userId,
      transaction_type: 'click',
      amount: reward,
      description: 'Клик в кликере'
    });
    
    // Обновление прогресса квеста "клики"
    const today = new Date().toISOString().split('T')[0];
    const clickQuests = await DailyQuest.findAll({
      where: { quest_type: 'clicks', is_active: true }
    });
    
    for (const quest of clickQuests) {
      const [userQuest] = await UserQuest.findOrCreate({
        where: {
          user_id: userId,
          quest_id: quest.id,
          quest_date: today
        },
        defaults: { progress: 0, completed: false }
      });
      
      if (!userQuest.completed) {
        await userQuest.increment('progress');
      }
    }
    
    const updatedUser = await User.findByPk(userId);
    
    res.json({
      success: true,
      balance: updatedUser.balance,
      totalClicks: updatedUser.total_clicks
    });
    
  } catch (error) {
    console.error('Click error:', error);
    res.status(500).json({ error: 'Failed to process click' });
  }
});

// Получить список заданий
router.get('/quests', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0];
    
    const quests = await DailyQuest.findAll({
      where: { is_active: true }
    });
    
    const questsWithProgress = await Promise.all(
      quests.map(async (quest) => {
        const userQuest = await UserQuest.findOne({
          where: {
            user_id: userId,
            quest_id: quest.id,
            quest_date: today
          }
        });
        
        return {
          id: quest.id,
          title: quest.title,
          description: quest.description,
          questType: quest.quest_type,
          targetValue: quest.target_value,
          rewardType: quest.reward_type,
          rewardAmount: quest.reward_amount,
          progress: userQuest ? userQuest.progress : 0,
          completed: userQuest ? userQuest.completed : false
        };
      })
    );
    
    res.json({ quests: questsWithProgress });
    
  } catch (error) {
    console.error('Get quests error:', error);
    res.status(500).json({ error: 'Failed to get quests' });
  }
});

// Завершить задание
router.post('/quest/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { questId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    
    const quest = await DailyQuest.findByPk(questId);
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }
    
    const userQuest = await UserQuest.findOne({
      where: {
        user_id: userId,
        quest_id: questId,
        quest_date: today
      }
    });
    
    if (!userQuest) {
      return res.status(404).json({ error: 'Quest progress not found' });
    }
    
    if (userQuest.completed) {
      return res.status(400).json({ error: 'Quest already completed' });
    }
    
    if (userQuest.progress < quest.target_value) {
      return res.status(400).json({ error: 'Quest not finished yet' });
    }
    
    const user = await User.findByPk(userId);
    
    // Выдача награды
    if (quest.reward_type === 'robux') {
      await user.increment('balance', { by: quest.reward_amount });
      
      await Transaction.create({
        user_id: userId,
        transaction_type: 'quest',
        amount: quest.reward_amount,
        description: `Выполнено задание: ${quest.title}`
      });
    } else if (quest.reward_type === 'key') {
      const keyUntil = new Date();
      keyUntil.setHours(23, 59, 59, 999);
      
      await user.update({
        last_key_date: new Date(),
        key_active_until: keyUntil
      });
    }
    
    await userQuest.update({
      completed: true,
      completed_at: new Date()
    });
    
    res.json({
      success: true,
      rewardType: quest.reward_type,
      rewardAmount: quest.reward_amount
    });
    
  } catch (error) {
    console.error('Complete quest error:', error);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

// Получить адвент-календарь
router.get('/calendar', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const season = parseInt(req.query.season) || 1;
    
    const user = await User.findByPk(userId);
    
    const calendar = await AdventCalendar.findAll({
      where: { season, is_active: true },
      order: [['day', 'ASC']]
    });
    
    const calendarWithStatus = await Promise.all(
      calendar.map(async (day) => {
        const userDay = await UserCalendar.findOne({
          where: {
            user_id: userId,
            season,
            day: day.day
          }
        });
        
        const canClaim = user.referral_count >= day.required_referrals;
        
        return {
          day: day.day,
          requiredReferrals: day.required_referrals,
          rewardType: day.reward_type,
          rewardAmount: day.reward_amount,
          rewardData: day.reward_data,
          claimed: userDay ? userDay.claimed : false,
          canClaim: canClaim && (!userDay || !userDay.claimed)
        };
      })
    );
    
    res.json({ calendar: calendarWithStatus });
    
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: 'Failed to get calendar' });
  }
});

// Забрать награду из календаря
router.post('/calendar/claim', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { day, season } = req.body;
    
    const user = await User.findByPk(userId);
    const calendarDay = await AdventCalendar.findOne({
      where: { season, day }
    });
    
    if (!calendarDay) {
      return res.status(404).json({ error: 'Calendar day not found' });
    }
    
    // Проверка условий
    if (user.referral_count < calendarDay.required_referrals) {
      return res.status(403).json({ error: 'Not enough referrals' });
    }
    
    const [userDay, created] = await UserCalendar.findOrCreate({
      where: { user_id: userId, season, day },
      defaults: { claimed: false }
    });
    
    if (userDay.claimed && !created) {
      return res.status(400).json({ error: 'Already claimed' });
    }
    
    // Выдача награды
    if (calendarDay.reward_type === 'robux') {
      await user.increment('balance', { by: calendarDay.reward_amount });
      
      await Transaction.create({
        user_id: userId,
        transaction_type: 'calendar',
        amount: calendarDay.reward_amount,
        description: `День ${day} календаря`
      });
    } else if (calendarDay.reward_type === 'case') {
      await UserInventory.create({
        user_id: userId,
        item_type: 'case',
        item_name: 'Обычный кейс',
        quantity: calendarDay.reward_amount
      });
    }
    
    await userDay.update({
      claimed: true,
      claimed_at: new Date()
    });
    
    res.json({
      success: true,
      rewardType: calendarDay.reward_type,
      rewardAmount: calendarDay.reward_amount
    });
    
  } catch (error) {
    console.error('Claim calendar error:', error);
    res.status(500).json({ error: 'Failed to claim reward' });
  }
});

// Крутить колесо фортуны
router.post('/wheel/spin', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findByPk(userId);
    
    // Проверка наличия спинов в инвентаре
    const spinItem = await UserInventory.findOne({
      where: {
        user_id: userId,
        item_type: 'wheel_spin'
      }
    });
    
    if (!spinItem || spinItem.quantity < 1) {
      return res.status(403).json({ error: 'No spins available' });
    }
    
    // Получение всех призов колеса
    const prizes = await WheelPrize.findAll({
      where: { is_active: true }
    });
    
    // Выбор случайного приза
    const selectedPrize = selectRandomPrize(prizes);
    
    // Уменьшение количества спинов
    await spinItem.decrement('quantity');
    if (spinItem.quantity <= 1) {
      await spinItem.destroy();
    }
    
    // Выдача приза
    if (selectedPrize.prize_type === 'robux') {
      await user.increment('balance', { by: selectedPrize.prize_value });
      
      await Transaction.create({
        user_id: userId,
        transaction_type: 'wheel',
        amount: selectedPrize.prize_value,
        description: `Колесо фортуны: ${selectedPrize.name}`
      });
    } else if (selectedPrize.prize_type === 'spin') {
      await UserInventory.create({
        user_id: userId,
        item_type: 'wheel_spin',
        item_name: 'Спин колеса',
        quantity: selectedPrize.prize_value
      });
    } else if (selectedPrize.prize_type === 'case') {
      await UserInventory.create({
        user_id: userId,
        item_type: 'case',
        item_name: selectedPrize.name,
        quantity: selectedPrize.prize_value
      });
    }
    
    res.json({
      success: true,
      prize: {
        id: selectedPrize.id,
        name: selectedPrize.name,
        type: selectedPrize.prize_type,
        value: selectedPrize.prize_value,
        color: selectedPrize.color
      }
    });
    
  } catch (error) {
    console.error('Wheel spin error:', error);
    res.status(500).json({ error: 'Failed to spin wheel' });
  }
});

// Открыть кейс
router.post('/case/open', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { caseType } = req.body;
    
    const user = await User.findByPk(userId);
    
    // Проверка наличия кейса
    const caseItem = await UserInventory.findOne({
      where: {
        user_id: userId,
        item_type: 'case'
      }
    });
    
    if (!caseItem || caseItem.quantity < 1) {
      return res.status(403).json({ error: 'No cases available' });
    }
    
    // Получение всех призов кейса
    const prizes = await CasePrize.findAll({
      where: { 
        case_type: caseType || 'common',
        is_active: true 
      }
    });
    
    // Выбор случайного приза
    const selectedPrize = selectRandomPrize(prizes);
    
    // Уменьшение количества кейсов
    await caseItem.decrement('quantity');
    if (caseItem.quantity <= 1) {
      await caseItem.destroy();
    }
    
    // Выдача приза
    if (selectedPrize.prize_type === 'robux') {
      const amount = selectedPrize.name.includes('300-500') 
        ? Math.floor(Math.random() * 201) + 300
        : selectedPrize.prize_value;
        
      await user.increment('balance', { by: amount });
      
      await Transaction.create({
        user_id: userId,
        transaction_type: 'case',
        amount: amount,
        description: `Кейс: ${selectedPrize.name}`
      });
    } else if (selectedPrize.prize_type === 'case') {
      await UserInventory.create({
        user_id: userId,
        item_type: 'case',
        item_name: selectedPrize.name,
        quantity: selectedPrize.prize_value
      });
    }
    
    res.json({
      success: true,
      prize: {
        id: selectedPrize.id,
        name: selectedPrize.name,
        type: selectedPrize.prize_type,
        value: selectedPrize.prize_value,
        rarity: selectedPrize.rarity
      }
    });
    
  } catch (error) {
    console.error('Case open error:', error);
    res.status(500).json({ error: 'Failed to open case' });
  }
});

// Активировать промокод
router.post('/promocode/activate', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { code } = req.body;
    
    const promocode = await Promocode.findOne({
      where: { code: code.toUpperCase(), is_active: true }
    });
    
    if (!promocode) {
      return res.status(404).json({ error: 'Invalid promocode' });
    }
    
    // Проверка срока действия
    if (promocode.expires_at && new Date(promocode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Promocode expired' });
    }
    
    // Проверка лимита использований
    if (promocode.max_uses && promocode.current_uses >= promocode.max_uses) {
      return res.status(400).json({ error: 'Promocode limit reached' });
    }
    
    // Проверка, использовал ли пользователь этот промокод ранее
    const alreadyUsed = await UserPromocode.findOne({
      where: {
        user_id: userId,
        promocode_id: promocode.id
      }
    });
    
    if (alreadyUsed) {
      return res.status(400).json({ error: 'Promocode already used' });
    }
    
    const user = await User.findByPk(userId);
    
    // Выдача награды
    if (promocode.reward_type === 'robux') {
      await user.increment('balance', { by: promocode.reward_amount });
      
      await Transaction.create({
        user_id: userId,
        transaction_type: 'promocode',
        amount: promocode.reward_amount,
        description: `Промокод: ${code}`
      });
    } else if (promocode.reward_type === 'wheel_spin') {
      await UserInventory.create({
        user_id: userId,
        item_type: 'wheel_spin',
        item_name: 'Спин колеса',
        quantity: promocode.reward_amount
      });
    } else if (promocode.reward_type === 'case') {
      await UserInventory.create({
        user_id: userId,
        item_type: 'case',
        item_name: 'Обычный кейс',
        quantity: promocode.reward_amount
      });
    } else if (promocode.reward_type === 'key') {
      const keyUntil = new Date();
      keyUntil.setHours(23, 59, 59, 999);
      
      await user.update({
        last_key_date: new Date(),
        key_active_until: keyUntil
      });
    }
    
    // Отметка использования
    await UserPromocode.create({
      user_id: userId,
      promocode_id: promocode.id
    });
    
    await promocode.increment('current_uses');
    
    res.json({
      success: true,
      rewardType: promocode.reward_type,
      rewardAmount: promocode.reward_amount
    });
    
  } catch (error) {
    console.error('Activate promocode error:', error);
    res.status(500).json({ error: 'Failed to activate promocode' });
  }
});

// Получить инвентарь пользователя
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const inventory = await UserInventory.findAll({
      where: { user_id: userId },
      order: [['obtained_at', 'DESC']]
    });
    
    res.json({ inventory });
    
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

module.exports = router;
