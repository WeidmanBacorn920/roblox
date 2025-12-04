// API функции для взаимодействия с бэкендом

class API {
    constructor() {
        this.baseURL = CONFIG.API_URL;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Авторизация
    async authenticate(initData) {
        const data = await this.request('/auth', {
            method: 'POST',
            body: JSON.stringify({ initData })
        });
        
        if (data.token) {
            this.setToken(data.token);
        }
        
        return data;
    }

    // Пользователь
    async getUser(userId) {
        return await this.request(`/user/${userId}`);
    }

    async getUserTransactions(userId, limit = 50, offset = 0) {
        return await this.request(`/user/${userId}/transactions?limit=${limit}&offset=${offset}`);
    }

    async getUserReferrals(userId) {
        return await this.request(`/user/${userId}/referrals`);
    }

    // Игровые механики
    async click() {
        return await this.request('/game/click', {
            method: 'POST'
        });
    }

    async getQuests() {
        return await this.request('/game/quests');
    }

    async completeQuest(questId) {
        return await this.request('/game/quest/complete', {
            method: 'POST',
            body: JSON.stringify({ questId })
        });
    }

    async getCalendar(season = 1) {
        return await this.request(`/game/calendar?season=${season}`);
    }

    async claimCalendarDay(day, season = 1) {
        return await this.request('/game/calendar/claim', {
            method: 'POST',
            body: JSON.stringify({ day, season })
        });
    }

    async spinWheel() {
        return await this.request('/game/wheel/spin', {
            method: 'POST'
        });
    }

    async openCase(caseType = 'common') {
        return await this.request('/game/case/open', {
            method: 'POST',
            body: JSON.stringify({ caseType })
        });
    }

    async activatePromocode(code) {
        return await this.request('/game/promocode/activate', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    }

    async getInventory() {
        return await this.request('/game/inventory');
    }
}

// Создаем глобальный экземпляр API
const api = new API();
