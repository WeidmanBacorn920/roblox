// Адвент-календарь

let currentSeason = 1;

async function loadCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '<p class="loading">Загрузка...</p>';

    try {
        const data = await api.getCalendar(currentSeason);
        
        if (data.calendar.length === 0) {
            calendarGrid.innerHTML = '<p class="no-data">Календарь недоступен</p>';
            return;
        }

        calendarGrid.innerHTML = data.calendar.map(day => createCalendarDay(day)).join('');

        // Добавляем обработчики для кликабельных дней
        data.calendar.forEach(day => {
            if (day.canClaim) {
                const dayElement = document.getElementById(`day-${day.day}`);
                if (dayElement) {
                    dayElement.addEventListener('click', () => claimCalendarDay(day.day));
                }
            }
        });

    } catch (error) {
        console.error('Load calendar error:', error);
        calendarGrid.innerHTML = '<p class="no-data">Ошибка загрузки календаря</p>';
    }
}

function createCalendarDay(day) {
    let className = 'calendar-day';
    let clickable = false;

    if (day.claimed) {
        className += ' claimed';
    } else if (day.canClaim) {
        className += ' available';
        clickable = true;
    } else {
        className += ' locked';
    }

    const rewardEmoji = getRewardEmoji(day.rewardType);

    return `
        <div class="calendar-day ${className}" 
             id="day-${day.day}"
             ${clickable ? '' : 'style="cursor: default;"'}>
            <div class="day-number">${day.day}</div>
            <div class="day-reward">${rewardEmoji}</div>
            ${day.requiredReferrals > 0 ? 
                `<div style="font-size: 10px; color: #6b7280;">👥 ${day.requiredReferrals}</div>` : 
                ''
            }
            ${day.claimed ? '<div style="font-size: 16px;">✓</div>' : ''}
        </div>
    `;
}

async function claimCalendarDay(day) {
    try {
        const data = await api.claimCalendarDay(day, currentSeason);
        
        showNotification(
            `День ${day} получен! Награда: ${data.rewardAmount} ${getRewardTypeName(data.rewardType)}`,
            'success'
        );

        // Обновляем календарь
        loadCalendar();
        
        // Обновляем профиль
        loadProfile();

    } catch (error) {
        console.error('Claim calendar day error:', error);
        showNotification(error.message || 'Ошибка получения награды', 'error');
    }
}

function getRewardEmoji(rewardType) {
    const emojis = {
        'robux': '💎',
        'case': '🎁',
        'promocode': '🎟️',
        'wheel_spin': '🎡',
        'premium': '⭐'
    };
    return emojis[rewardType] || '🎁';
}
