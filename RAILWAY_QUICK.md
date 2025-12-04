# 🚀 Быстрый гайд: Railway за 5 минут

## 1. GitHub
```bash
git init
git add .
git commit -m "Init"
git push origin main
```

## 2. Railway.app
- Войдите на railway.app
- "New Project" → "Deploy from GitHub"
- Выберите репо

## 3. Переменные
В Railway добавьте:
```
BOT_TOKEN=YOUR_TOKEN_FROM_BOTFATHER
DB_HOST=localhost (если своя БД) или используйте Railway PostgreSQL
DB_PORT=5432
DB_NAME=roblox_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=secret_key_12345
ADMIN_IDS=123456789
WEB_APP_URL=https://knyaz1.ru/public/index.html
```

## 4. PostgreSQL
- Добавьте PostgreSQL плагин в Railway
- Railway создаст переменные автоматически

## 5. Инициализация БД
```bash
railway run npm run init:db
```

## 6. Получите URL
```
https://your-project.up.railway.app
```

## 7. Обновите config.js
```javascript
API_URL: 'https://your-project.up.railway.app/api'
```

## 8. Загрузите на sweb.ru
Все файлы из `public/` на sweb.ru

## ✅ Готово!
