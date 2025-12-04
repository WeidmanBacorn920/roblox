const { Telegraf, Markup } = require('telegraf');
const { User } = require('../database/models');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware для логирования
bot.use(async (ctx, next) => {
  console.log(`Update from ${ctx.from?.username || ctx.from?.id}:`, ctx.message?.text || ctx.updateType);
  return next();
});

// Обработка команды /start
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'Пользователь';
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';
    
    // Извлечение реферального ID из команды start
    const startParam = ctx.message.text.split(' ')[1];
    let referrerId = null;
    
    if (startParam && startParam.startsWith('ref')) {
      referrerId = parseInt(startParam.substring(3));
    }

    // Поиск или создание пользователя
    let [user, created] = await User.findOrCreate({
      where: { telegram_id: userId },
      defaults: {
        telegram_id: userId,
        username: username,
        first_name: firstName,
        last_name: lastName,
        referrer_id: referrerId,
        language_code: ctx.from.language_code || 'ru'
      }
    });

    // Если пользователь новый и пришел по реферальной ссылке
    if (created && referrerId && referrerId !== userId) {
      const referrer = await User.findByPk(referrerId);
      if (referrer) {
        // Увеличиваем счетчик рефералов
        await referrer.increment('referral_count');
        
        // Проверяем, нужно ли выдать ключ дня
        const refsForKey = parseInt(process.env.REFS_FOR_KEY) || 2;
        const updatedReferrer = await User.findByPk(referrerId);
        
        // Если набрано достаточно рефералов, выдаем ключ
        if (updatedReferrer.referral_count % refsForKey === 0) {
          const keyUntil = new Date();
          keyUntil.setHours(23, 59, 59, 999);
          
          await updatedReferrer.update({
            last_key_date: new Date(),
            key_active_until: keyUntil
          });

          // Уведомляем реферера о получении ключа
          try {
            await ctx.telegram.sendMessage(
              referrerId,
              `🎉 Отлично! Ты пригласил достаточно друзей и получил Ключ Дня!\n\n🔑 Ключ действует до 23:59 сегодня.\nТеперь ты можешь пользоваться кликером!`
            );
          } catch (error) {
            console.error('Failed to notify referrer:', error);
          }
        }
      }
    }

    // Получаем актуальные данные пользователя
    user = await User.findByPk(userId);
    
    // Проверка активности ключа
    const hasActiveKey = user.key_active_until && new Date(user.key_active_until) > new Date();
    const keyStatus = hasActiveKey ? '🔓 Активен' : '🔒 Неактивен';

    // Формируем сообщение
    const message = `🎉 Добро пожаловать, ${username}!

Зарабатывай Robux, выполняя задания и приглашая друзей!

💰 Твоя реферальная ссылка:
https://t.me/${process.env.BOT_USERNAME}?start=ref${userId}

👥 Приглашено друзей: ${user.referral_count}
💎 Баланс: ${user.balance} Robux
🔑 Ключ дня: ${keyStatus}

📱 Нажми кнопку ниже, чтобы открыть приложение!`;

    // Кнопка для открытия веб-приложения
    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🎮 Открыть приложение', process.env.WEB_APP_URL)]
      ])
    );

  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
});

// Запуск бота
async function startBot() {
  try {
    console.log('🤖 Starting bot...');
    await bot.launch();
    console.log('✅ Bot started successfully!');
    
    // Graceful shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startBot();
}

module.exports = { bot, startBot };
