// Кейсы

let casesInventory = {};

async function loadCases() {
    try {
        const data = await api.getInventory();
        
        // Подсчитываем кейсы
        casesInventory = {};
        data.inventory.forEach(item => {
            if (item.item_type === 'case') {
                casesInventory[item.item_name] = item.quantity;
            }
        });

        // Обновляем UI
        updateCasesUI();

    } catch (error) {
        console.error('Load cases error:', error);
    }
}

function updateCasesUI() {
    const commonCases = casesInventory['Обычный кейс'] || 0;
    document.getElementById('commonCases').textContent = commonCases;
}

async function openCase(caseType) {
    const caseName = caseType === 'common' ? 'Обычный кейс' : 'Кейс';
    const count = casesInventory[caseName] || 0;

    if (count <= 0) {
        showNotification('У вас нет кейсов', 'error');
        return;
    }

    try {
        const data = await api.openCase(caseType);
        
        // Анимация открытия кейса
        animateCaseOpening(data.prize);

        // Уменьшаем количество кейсов
        casesInventory[caseName] = count - 1;
        updateCasesUI();

        // Обновляем профиль
        setTimeout(() => {
            loadProfile();
        }, 2000);

    } catch (error) {
        console.error('Open case error:', error);
        showNotification(error.message || 'Ошибка открытия кейса', 'error');
    }
}

function animateCaseOpening(prize) {
    // Создаем оверлей для анимации
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.animation = 'fadeIn 0.3s ease';

    const rarityColors = {
        'common': '#9E9E9E',
        'rare': '#2196F3',
        'epic': '#9C27B0',
        'legendary': '#FFD700'
    };

    overlay.innerHTML = `
        <div style="text-align: center; animation: zoomIn 0.5s ease;">
            <div style="font-size: 100px; margin-bottom: 20px; animation: bounce 1s ease infinite;">
                🎁
            </div>
            <h2 style="color: white; font-size: 32px; margin-bottom: 16px;">
                Вы получили!
            </h2>
            <div style="
                background: ${rarityColors[prize.rarity] || '#FFD700'};
                padding: 24px 48px;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            ">
                <h3 style="color: white; font-size: 28px; margin: 0;">
                    ${prize.name}
                </h3>
            </div>
            <p style="color: white; margin-top: 24px; font-size: 16px;">
                Нажмите чтобы продолжить
            </p>
        </div>
    `;

    // Добавляем CSS анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes zoomIn {
            from {
                opacity: 0;
                transform: scale(0.5);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        @keyframes bounce {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    // Закрытие по клику
    overlay.addEventListener('click', () => {
        overlay.remove();
        style.remove();
        
        // Показываем уведомление
        showNotification(`Получено: ${prize.name}`, 'success');
    });

    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
            style.remove();
        }
    }, 5000);
}
