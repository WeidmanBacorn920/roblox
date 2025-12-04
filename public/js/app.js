// Основной скрипт приложения

let tg = window.Telegram.WebApp;
let userData = null;

// Инициализация приложения
async function initApp() {
    try {
        // Расширяем веб-приложение на весь экран
        tg.expand();
        
        // Получаем данные пользователя из Telegram
        const initData = tg.initData;
        const user = tg.initDataUnsafe.user;
        
        if (!user) {
            showNotification('Ошибка авторизации', 'error');
            return;
        }

        // Авторизация через API
        const authData = await api.authenticate(initData);
        userData = authData.user;

        // Обновляем UI
        updateUserInfo();
        
        // Загружаем данные профиля
        loadProfile();

        console.log('App initialized successfully');
    } catch (error) {
        console.error('Init error:', error);
        showNotification('Ошибка инициализации', 'error');
    }
}

// Обновление информации о пользователе в шапке
function updateUserInfo() {
    if (!userData) return;

    document.getElementById('username').textContent = userData.username || userData.firstName;
    document.getElementById('balance').textContent = userData.balance;

    // Аватар (если есть)
    const user = tg.initDataUnsafe.user;
    if (user.photo_url) {
        document.getElementById('userAvatar').src = user.photo_url;
        document.getElementById('profileAvatar').src = user.photo_url;
    }

    // Статус ключа
    updateKeyStatus();
}

// Обновление статуса ключа дня
function updateKeyStatus() {
    const keyStatus = document.getElementById('keyStatus');
    const clickerBtn = document.getElementById('clickerBtn');
    
    if (userData.hasActiveKey) {
        keyStatus.innerHTML = '<span class="key-icon">🔓</span><span>Ключ активен</span>';
        keyStatus.classList.add('active');
        clickerBtn.disabled = false;
    } else {
        keyStatus.innerHTML = '<span class="key-icon">🔒</span><span>Требуется ключ дня</span>';
        keyStatus.classList.remove('active');
        clickerBtn.disabled = true;
    }
}

// Загрузка профиля
async function loadProfile() {
    try {
        const data = await api.getUser(userData.id);
        
        // Обновляем данные
        userData = data;
        
        // Обновляем UI профиля
        document.getElementById('profileUsername').textContent = data.username || data.firstName;
        document.getElementById('profileId').textContent = data.id;
        document.getElementById('profileBalance').textContent = `${data.balance} Robux`;
        document.getElementById('profileReferrals').textContent = data.referralCount;
        document.getElementById('profileClicks').textContent = data.totalClicks;
        document.getElementById('profileKey').textContent = data.hasActiveKey ? 'Активен' : 'Неактивен';

        // Реферальная ссылка
        const botUsername = 'YourBotUsername'; // Замените на имя вашего бота
        const referralLink = `https://t.me/${botUsername}?start=ref${data.id}`;
        document.getElementById('referralLink').value = referralLink;

        // Загружаем транзакции
        loadTransactions();

        // Обновляем баланс в шапке
        document.getElementById('balance').textContent = data.balance;
        updateKeyStatus();

    } catch (error) {
        console.error('Load profile error:', error);
    }
}

// Загрузка транзакций
async function loadTransactions() {
    try {
        const data = await api.getUserTransactions(userData.id, 10);
        const transactionsList = document.getElementById('transactionsList');
        
        if (data.transactions.length === 0) {
            transactionsList.innerHTML = '<p class="no-data">Нет транзакций</p>';
            return;
        }

        transactionsList.innerHTML = data.transactions.map(t => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <p class="transaction-type">${getTransactionTypeName(t.transaction_type)}</p>
                    <p class="transaction-date">${formatDate(t.created_at)}</p>
                </div>
                <p class="transaction-amount ${t.amount > 0 ? 'positive' : 'negative'}">
                    ${t.amount > 0 ? '+' : ''}${t.amount} Robux
                </p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Load transactions error:', error);
    }
}

// Переключение секций
function showSection(sectionName) {
    // Убираем активный класс со всех секций
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Убираем активный класс со всех кнопок навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Активируем нужную секцию
    document.getElementById(sectionName).classList.add('active');
    
    // Активируем соответствующую кнопку
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Если открыли профиль, обновляем данные
    if (sectionName === 'profile') {
        loadProfile();
    }
}

// Модальные окна
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Показать задания
function showQuests() {
    openModal('questsModal');
    loadQuests();
}

// Показать колесо
function showWheel() {
    openModal('wheelModal');
    initWheel();
}

// Показать календарь
function showCalendar() {
    openModal('calendarModal');
    loadCalendar();
}

// Показать кейсы
function showCases() {
    openModal('casesModal');
    loadCases();
}

// Показать промокод
function showPromocode() {
    openModal('promocodeModal');
    document.getElementById('promocodeInput').value = '';
    document.getElementById('promocodeMessage').textContent = '';
}

// Активация промокода
async function activatePromocode() {
    const input = document.getElementById('promocodeInput');
    const message = document.getElementById('promocodeMessage');
    const code = input.value.trim();

    if (!code) {
        message.textContent = 'Введите промокод';
        message.className = 'promo-message error';
        return;
    }

    try {
        const data = await api.activatePromocode(code);
        
        message.textContent = `Промокод активирован! Получено: ${data.rewardAmount} ${getRewardTypeName(data.rewardType)}`;
        message.className = 'promo-message success';
        
        input.value = '';
        
        // Обновляем профиль
        setTimeout(() => {
            loadProfile();
        }, 1000);

        showNotification('Промокод успешно активирован!', 'success');

    } catch (error) {
        message.textContent = error.message || 'Ошибка активации промокода';
        message.className = 'promo-message error';
    }
}

// Копирование реферальной ссылки
function copyReferralLink() {
    const input = document.getElementById('referralLink');
    input.select();
    document.execCommand('copy');
    
    showNotification('Ссылка скопирована!', 'success');
}

// Показать уведомление
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Утилиты
function getTransactionTypeName(type) {
    const types = {
        'click': 'Клик в кликере',
        'quest': 'Выполнено задание',
        'referral': 'Реферал',
        'wheel': 'Колесо фортуны',
        'case': 'Открытие кейса',
        'promocode': 'Промокод',
        'admin': 'Начисление администратором',
        'calendar': 'Адвент-календарь'
    };
    return types[type] || type;
}

function getRewardTypeName(type) {
    const types = {
        'robux': 'Robux',
        'key': 'Ключ дня',
        'case': 'Кейс',
        'wheel_spin': 'Спин колеса'
    };
    return types[type] || type;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
    
    return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация приложения
    initApp();

    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showSection(btn.dataset.section);
        });
    });

    // Кнопка кликера
    document.getElementById('clickerBtn').addEventListener('click', () => {
        if (userData.hasActiveKey) {
            openModal('clickerModal');
            initClicker();
        } else {
            showNotification('Требуется активный ключ дня', 'error');
        }
    });

    // Закрытие модальных окон по клику на фон
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});
