// Кликер

let clickCount = 0;
let earnedAmount = 0;
let isClickerActive = false;

function initClicker() {
    if (isClickerActive) return;
    
    isClickerActive = true;
    clickCount = 0;
    earnedAmount = 0;
    
    updateClickerStats();
    
    const clickButton = document.getElementById('clickButton');
    clickButton.addEventListener('click', handleClick);
}

async function handleClick() {
    if (!userData.hasActiveKey) {
        showNotification('Ключ дня неактивен', 'error');
        closeModal('clickerModal');
        return;
    }

    try {
        const data = await api.click();
        
        clickCount++;
        earnedAmount++;
        
        updateClickerStats();
        
        // Обновляем баланс в шапке
        document.getElementById('balance').textContent = data.balance;
        userData.balance = data.balance;
        userData.totalClicks = data.totalClicks;
        
        // Анимация клика
        animateClick();
        
    } catch (error) {
        console.error('Click error:', error);
        
        if (error.message.includes('Key required')) {
            showNotification('Ключ дня истёк', 'error');
            userData.hasActiveKey = false;
            updateKeyStatus();
            closeModal('clickerModal');
        } else {
            showNotification('Ошибка клика', 'error');
        }
    }
}

function updateClickerStats() {
    document.getElementById('clickCount').textContent = clickCount;
    document.getElementById('earnedAmount').textContent = earnedAmount;
}

function animateClick() {
    const button = document.getElementById('clickButton');
    button.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 100);
    
    // Создаем летящую цифру
    createFloatingNumber('+1');
}

function createFloatingNumber(text) {
    const button = document.getElementById('clickButton');
    const rect = button.getBoundingClientRect();
    
    const floater = document.createElement('div');
    floater.textContent = text;
    floater.style.position = 'fixed';
    floater.style.left = rect.left + rect.width / 2 + 'px';
    floater.style.top = rect.top + 'px';
    floater.style.color = '#fbbf24';
    floater.style.fontWeight = 'bold';
    floater.style.fontSize = '24px';
    floater.style.pointerEvents = 'none';
    floater.style.zIndex = '9999';
    floater.style.animation = 'floatUp 1s ease-out forwards';
    
    document.body.appendChild(floater);
    
    setTimeout(() => {
        floater.remove();
    }, 1000);
}

// Добавляем CSS анимацию для летящих цифр
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-100px);
        }
    }
`;
document.head.appendChild(style);
