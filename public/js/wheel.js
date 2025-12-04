// Колесо фортуны

let wheelCanvas, wheelCtx;
let wheelPrizes = [];
let isSpinning = false;
let currentRotation = 0;
let spinCount = 0;

function initWheel() {
    wheelCanvas = document.getElementById('wheelCanvas');
    wheelCtx = wheelCanvas.getContext('2d');
    
    loadWheelPrizes();
    updateSpinCount();
    
    const spinButton = document.getElementById('spinButton');
    spinButton.addEventListener('click', spinWheel);
}

function loadWheelPrizes() {
    // Временные призы (в реальной версии загружаются с сервера)
    wheelPrizes = [
        { id: 1, name: 'Доп. спин', color: '#4CAF50', chance: 22 },
        { id: 2, name: '+5 Robux', color: '#FFD700', chance: 14 },
        { id: 3, name: '+10%', color: '#2196F3', chance: 12 },
        { id: 4, name: 'Промокод', color: '#9C27B0', chance: 10 },
        { id: 5, name: '+10 Robux', color: '#FFD700', chance: 10 },
        { id: 6, name: 'Лаки блок', color: '#FF9800', chance: 9 },
        { id: 7, name: 'Кейс', color: '#795548', chance: 8 },
        { id: 8, name: 'Редкий промо', color: '#E91E63', chance: 5 }
    ];
    
    drawWheel();
}

function drawWheel() {
    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = wheelCanvas.width / 2 - 10;
    
    const totalSegments = wheelPrizes.length;
    const anglePerSegment = (2 * Math.PI) / totalSegments;
    
    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
    
    // Рисуем сегменты
    wheelPrizes.forEach((prize, index) => {
        const startAngle = currentRotation + (index * anglePerSegment);
        const endAngle = startAngle + anglePerSegment;
        
        // Сегмент
        wheelCtx.beginPath();
        wheelCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        wheelCtx.lineTo(centerX, centerY);
        wheelCtx.fillStyle = prize.color;
        wheelCtx.fill();
        wheelCtx.strokeStyle = '#fff';
        wheelCtx.lineWidth = 2;
        wheelCtx.stroke();
        
        // Текст
        wheelCtx.save();
        wheelCtx.translate(centerX, centerY);
        wheelCtx.rotate(startAngle + anglePerSegment / 2);
        wheelCtx.textAlign = 'right';
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = 'bold 14px Arial';
        wheelCtx.fillText(prize.name, radius - 20, 5);
        wheelCtx.restore();
    });
    
    // Центральный круг
    wheelCtx.beginPath();
    wheelCtx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    wheelCtx.fillStyle = '#fff';
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#333';
    wheelCtx.lineWidth = 3;
    wheelCtx.stroke();
    
    // Указатель
    drawPointer(centerX, centerY);
}

function drawPointer(centerX, centerY) {
    wheelCtx.save();
    wheelCtx.translate(centerX, centerY);
    wheelCtx.rotate(-Math.PI / 2);
    
    wheelCtx.beginPath();
    wheelCtx.moveTo(wheelCanvas.width / 2 - 10, 0);
    wheelCtx.lineTo(wheelCanvas.width / 2 - 10 + 20, -15);
    wheelCtx.lineTo(wheelCanvas.width / 2 - 10 + 20, 15);
    wheelCtx.closePath();
    
    wheelCtx.fillStyle = '#ff0000';
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#fff';
    wheelCtx.lineWidth = 2;
    wheelCtx.stroke();
    
    wheelCtx.restore();
}

async function spinWheel() {
    if (isSpinning) return;
    
    if (spinCount <= 0) {
        showNotification('У вас нет спинов', 'error');
        return;
    }
    
    isSpinning = true;
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = true;
    
    try {
        const data = await api.spinWheel();
        
        // Анимация вращения
        const spins = 5 + Math.random() * 3; // 5-8 оборотов
        const targetRotation = spins * 2 * Math.PI;
        const duration = 4000; // 4 секунды
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing функция для плавного замедления
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            currentRotation = targetRotation * easeOut;
            drawWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Вращение завершено
                isSpinning = false;
                spinButton.disabled = false;
                spinCount--;
                updateSpinCount();
                
                // Показываем результат
                showNotification(
                    `Вы выиграли: ${data.prize.name}!`,
                    'success'
                );
                
                // Обновляем профиль
                loadProfile();
            }
        }
        
        animate();
        
    } catch (error) {
        console.error('Spin wheel error:', error);
        showNotification(error.message || 'Ошибка при вращении колеса', 'error');
        isSpinning = false;
        spinButton.disabled = false;
    }
}

async function updateSpinCount() {
    try {
        const data = await api.getInventory();
        const spinItem = data.inventory.find(item => item.item_type === 'wheel_spin');
        spinCount = spinItem ? spinItem.quantity : 0;
        document.getElementById('spinsCount').textContent = spinCount;
    } catch (error) {
        console.error('Update spin count error:', error);
        document.getElementById('spinsCount').textContent = '0';
    }
}
