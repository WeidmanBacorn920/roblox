// Скрипты админ-панели

let currentPage = 1;
const usersPerPage = 50;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации (в реальной версии нужна полноценная проверка)
    if (!api.getToken()) {
        // Можно добавить форму входа
        console.log('Not authenticated');
    }

    // Загружаем дашборд
    loadDashboard();

    // Навигация
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });

    // Форма редактирования пользователя
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateUser();
    });

    // Форма создания промокода
    document.getElementById('createPromocodeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createPromocode();
    });
});

// Переключение секций
function showSection(sectionName) {
    // Убираем активный класс
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Активируем нужную секцию
    document.getElementById(sectionName).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Обновляем заголовок
    const titles = {
        'dashboard': 'Дашборд',
        'users': 'Пользователи',
        'quests': 'Задания',
        'calendar': 'Календарь',
        'wheel': 'Колесо фортуны',
        'cases': 'Кейсы',
        'promocodes': 'Промокоды'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName];

    // Загружаем данные для секции
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'quests':
            loadQuests();
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'wheel':
            loadWheelPrizes();
            break;
        case 'cases':
            loadCasePrizes();
            break;
        case 'promocodes':
            loadPromocodes();
            break;
    }
}

// Загрузка дашборда
async function loadDashboard() {
    try {
        const data = await api.request('/admin/stats');
        
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('activeUsers').textContent = data.activeUsers;
        document.getElementById('totalBalance').textContent = data.totalBalance;
        document.getElementById('totalReferrals').textContent = data.totalReferrals;
    } catch (error) {
        console.error('Load dashboard error:', error);
        showNotification('Ошибка загрузки статистики', 'error');
    }
}

// Загрузка пользователей
async function loadUsers(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Загрузка...</td></tr>';

    try {
        const data = await api.request(`/admin/users?page=${page}&limit=${usersPerPage}`);
        
        if (data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Нет пользователей</td></tr>';
            return;
        }

        tbody.innerHTML = data.users.map(user => `
            <tr>
                <td>${user.telegram_id}</td>
                <td>${user.username || user.first_name}</td>
                <td>${user.balance} 💎</td>
                <td>${user.referral_count}</td>
                <td>${user.total_clicks}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-edit" onclick="editUser(${user.telegram_id})">Изменить</button>
                </td>
            </tr>
        `).join('');

        // Пагинация
        renderPagination('usersPagination', data.currentPage, data.totalPages, loadUsers);

    } catch (error) {
        console.error('Load users error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Ошибка загрузки</td></tr>';
    }
}

// Поиск пользователей
async function searchUsers() {
    const search = document.getElementById('userSearch').value;
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Поиск...</td></tr>';

    try {
        const data = await api.request(`/admin/users?search=${search}`);
        
        if (data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Пользователи не найдены</td></tr>';
            return;
        }

        tbody.innerHTML = data.users.map(user => `
            <tr>
                <td>${user.telegram_id}</td>
                <td>${user.username || user.first_name}</td>
                <td>${user.balance} 💎</td>
                <td>${user.referral_count}</td>
                <td>${user.total_clicks}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-edit" onclick="editUser(${user.telegram_id})">Изменить</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Search users error:', error);
    }
}

// Редактирование пользователя
async function editUser(userId) {
    try {
        const data = await api.request(`/admin/users/${userId}`);
        const user = data.user;

        document.getElementById('editUserId').value = user.telegram_id;
        document.getElementById('editUserIdDisplay').value = user.telegram_id;
        document.getElementById('editUserName').value = user.username || user.first_name;
        document.getElementById('editUserBalance').value = user.balance;
        document.getElementById('editUserBanned').checked = user.is_banned;

        openModal('editUserModal');
    } catch (error) {
        console.error('Edit user error:', error);
        showNotification('Ошибка загрузки данных пользователя', 'error');
    }
}

// Обновление пользователя
async function updateUser() {
    const userId = document.getElementById('editUserId').value;
    const balance = document.getElementById('editUserBalance').value;
    const banned = document.getElementById('editUserBanned').checked;

    try {
        await api.request(`/admin/users/${userId}/balance`, {
            method: 'PUT',
            body: JSON.stringify({ amount: parseInt(balance), action: 'set' })
        });

        await api.request(`/admin/users/${userId}/ban`, {
            method: 'PUT',
            body: JSON.stringify({ banned })
        });

        showNotification('Пользователь обновлен', 'success');
        closeModal('editUserModal');
        loadUsers(currentPage);
    } catch (error) {
        console.error('Update user error:', error);
        showNotification('Ошибка обновления пользователя', 'error');
    }
}

// Загрузка заданий
async function loadQuests() {
    const tbody = document.getElementById('questsTable');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Загрузка...</td></tr>';

    try {
        const data = await api.request('/admin/quests');
        
        tbody.innerHTML = data.quests.map(quest => `
            <tr>
                <td>${quest.id}</td>
                <td>${quest.title}</td>
                <td>${quest.quest_type}</td>
                <td>${quest.target_value}</td>
                <td>${quest.reward_amount} ${quest.reward_type}</td>
                <td>${quest.is_active ? '✅' : '❌'}</td>
                <td>
                    <button class="btn-edit" onclick="toggleQuestActive(${quest.id}, ${!quest.is_active})">
                        ${quest.is_active ? 'Деактивировать' : 'Активировать'}
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Load quests error:', error);
    }
}

// Загрузка промокодов
async function loadPromocodes() {
    const tbody = document.getElementById('promocodesTable');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Загрузка...</td></tr>';

    try {
        const data = await api.request('/admin/promocodes');
        
        tbody.innerHTML = data.promocodes.map(promo => `
            <tr>
                <td><strong>${promo.code}</strong></td>
                <td>${promo.reward_amount} ${promo.reward_type}</td>
                <td>${promo.current_uses}</td>
                <td>${promo.max_uses || '∞'}</td>
                <td>${promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : '—'}</td>
                <td>${promo.is_active ? '✅' : '❌'}</td>
                <td>
                    <button class="btn-danger" onclick="deletePromocode(${promo.id})">Удалить</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Load promocodes error:', error);
    }
}

// Показать модальное окно создания промокода
function showCreatePromocodeModal() {
    document.getElementById('createPromocodeForm').reset();
    openModal('createPromocodeModal');
}

// Создание промокода
async function createPromocode() {
    const code = document.getElementById('promocodeCode').value;
    const rewardType = document.getElementById('promocodeRewardType').value;
    const rewardAmount = parseInt(document.getElementById('promocodeRewardAmount').value);
    const maxUses = document.getElementById('promocodeMaxUses').value;
    const expiresAt = document.getElementById('promocodeExpires').value;

    try {
        await api.request('/admin/promocodes', {
            method: 'POST',
            body: JSON.stringify({
                code: code || undefined,
                rewardType,
                rewardAmount,
                maxUses: maxUses ? parseInt(maxUses) : null,
                expiresAt: expiresAt || null
            })
        });

        showNotification('Промокод создан', 'success');
        closeModal('createPromocodeModal');
        loadPromocodes();
    } catch (error) {
        console.error('Create promocode error:', error);
        showNotification('Ошибка создания промокода', 'error');
    }
}

// Удаление промокода
async function deletePromocode(id) {
    if (!confirm('Удалить этот промокод?')) return;

    try {
        await api.request(`/admin/promocodes/${id}`, {
            method: 'DELETE'
        });

        showNotification('Промокод удален', 'success');
        loadPromocodes();
    } catch (error) {
        console.error('Delete promocode error:', error);
        showNotification('Ошибка удаления промокода', 'error');
    }
}

// Модальные окна
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Пагинация
function renderPagination(containerId, currentPage, totalPages, callback) {
    const container = document.getElementById(containerId);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    
    if (currentPage > 1) {
        html += `<button onclick="${callback.name}(${currentPage - 1})">‹ Назад</button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            html += `<button onclick="${callback.name}(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span>...</span>`;
        }
    }

    if (currentPage < totalPages) {
        html += `<button onclick="${callback.name}(${currentPage + 1})">Вперед ›</button>`;
    }

    container.innerHTML = html;
}

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Выход
function logout() {
    localStorage.removeItem('token');
    location.reload();
}
