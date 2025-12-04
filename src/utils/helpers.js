const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Валидация данных Telegram Web App
function validateTelegramWebAppData(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();
    
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    return hash === calculatedHash;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

// Создание JWT токена
function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Проверка JWT токена
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware для проверки авторизации
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.userId = decoded.userId;
  next();
}

// Middleware для проверки прав администратора
function adminMiddleware(req, res, next) {
  const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id)) || [];
  
  if (!adminIds.includes(req.userId)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}

// Функция для выбора случайного приза на основе шансов
function selectRandomPrize(prizes) {
  const totalChance = prizes.reduce((sum, prize) => sum + prize.chance, 0);
  const random = Math.random() * totalChance;
  
  let cumulativeChance = 0;
  for (const prize of prizes) {
    cumulativeChance += prize.chance;
    if (random <= cumulativeChance) {
      return prize;
    }
  }
  
  return prizes[0];
}

// Генерация промокода
function generatePromocode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = {
  validateTelegramWebAppData,
  createToken,
  verifyToken,
  authMiddleware,
  adminMiddleware,
  selectRandomPrize,
  generatePromocode
};
