// Задания

async function loadQuests() {
    const questsList = document.getElementById('questsList');
    questsList.innerHTML = '<p class="loading">Загрузка...</p>';

    try {
        const data = await api.getQuests();
        
        if (data.quests.length === 0) {
            questsList.innerHTML = '<p class="no-data">Нет доступных заданий</p>';
            return;
        }

        questsList.innerHTML = data.quests.map(quest => createQuestElement(quest)).join('');

        // Добавляем обработчики для кнопок завершения
        data.quests.forEach(quest => {
            if (!quest.completed && quest.progress >= quest.targetValue) {
                const btn = document.getElementById(`quest-btn-${quest.id}`);
                if (btn) {
                    btn.addEventListener('click', () => completeQuest(quest.id));
                }
            }
        });

    } catch (error) {
        console.error('Load quests error:', error);
        questsList.innerHTML = '<p class="no-data">Ошибка загрузки заданий</p>';
    }
}

function createQuestElement(quest) {
    const progressPercent = Math.min((quest.progress / quest.targetValue) * 100, 100);
    const isCompleted = quest.completed;
    const canComplete = quest.progress >= quest.targetValue && !isCompleted;

    return `
        <div class="quest-item ${isCompleted ? 'completed' : ''}">
            <div class="quest-header">
                <h4 class="quest-title">${quest.title}</h4>
                <div class="quest-reward">
                    <span>${quest.rewardAmount}</span>
                    <span>${getRewardIcon(quest.rewardType)}</span>
                </div>
            </div>
            <p class="quest-desc">${quest.description}</p>
            <div class="quest-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <p class="progress-text">${quest.progress} / ${quest.targetValue}</p>
            </div>
            ${isCompleted ? 
                '<button class="quest-btn" disabled>✓ Выполнено</button>' :
                canComplete ?
                    `<button class="quest-btn" id="quest-btn-${quest.id}">Забрать награду</button>` :
                    '<button class="quest-btn" disabled>В процессе</button>'
            }
        </div>
    `;
}

async function completeQuest(questId) {
    try {
        const data = await api.completeQuest(questId);
        
        showNotification(
            `Задание выполнено! Получено: ${data.rewardAmount} ${getRewardTypeName(data.rewardType)}`,
            'success'
        );

        // Обновляем список заданий
        loadQuests();
        
        // Обновляем профиль
        loadProfile();

    } catch (error) {
        console.error('Complete quest error:', error);
        showNotification(error.message || 'Ошибка завершения задания', 'error');
    }
}

function getRewardIcon(rewardType) {
    const icons = {
        'robux': '💎',
        'key': '🔑',
        'case': '🎁',
        'wheel_spin': '🎡'
    };
    return icons[rewardType] || '🎁';
}
