// ===== КОНСТАНТЫ =====
const STORAGE_KEY = 'weightTracker_data';
const CHART_COLORS = {
    morning: '#11998e',
    evening: '#764ba2',
    grid: 'rgba(0,0,0,0.08)',
};

// ===== DOM ЭЛЕМЕНТЫ =====
const elements = {
    dateInput: document.getElementById('entry-date'),
    morningInput: document.getElementById('morning-weight'),
    eveningInput: document.getElementById('evening-weight'),
    saveBtn: document.getElementById('save-btn'),
    clearBtn: document.getElementById('clear-btn'),
    todayMorning: document.getElementById('today-morning'),
    todayEvening: document.getElementById('today-evening'),
    dailyChange: document.getElementById('daily-change'),
    avgMorning: document.getElementById('avg-morning'),
    avgEvening: document.getElementById('avg-evening'),
    totalDynamics: document.getElementById('total-dynamics'),
    historyList: document.getElementById('history-list'),
    chartCanvas: document.getElementById('weight-chart'),
    chartBtns: document.querySelectorAll('.chart-btn'),
};

// ===== РАБОТА С ДАННЫМИ =====
function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }
    return [];
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr) {
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatFullDate(dateStr) {
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatWeight(kg) {
    return kg !== null && kg !== undefined ? kg.toFixed(1) + ' кг' : '—';
}

function formatChange(kg) {
    if (kg === null || kg === undefined) return '0 кг';
    const sign = kg > 0 ? '+' : '';
    return sign + kg.toFixed(1) + ' кг';
}

function getDateFromKey(key) {
    const parts = key.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

// ===== СОХРАНЕНИЕ НОВОЙ ЗАПИСИ (с выбранной датой) =====
function saveEntry() {
    const date = elements.dateInput.value;
    if (!date) {
        alert('⚠️ Выберите дату!');
        return;
    }

    const morning = parseFloat(elements.morningInput.value);
    const evening = parseFloat(elements.eveningInput.value);

    if (isNaN(morning) && isNaN(evening)) {
        alert('⚠️ Введи хотя бы одно значение веса!');
        return;
    }

    let data = loadData();
    const existingIndex = data.findIndex(entry => entry.date === date);

    const entry = {
        date: date,
        morning: isNaN(morning) ? null : morning,
        evening: isNaN(evening) ? null : evening,
    };

    if (existingIndex !== -1) {
        // Обновляем существующую запись
        if (entry.morning !== null) data[existingIndex].morning = entry.morning;
        if (entry.evening !== null) data[existingIndex].evening = entry.evening;
    } else {
        data.push(entry);
        data.sort((a, b) => a.date.localeCompare(b.date));
    }

    saveData(data);
    elements.morningInput.value = '';
    elements.eveningInput.value = '';
    updateUI();
    showNotification('✅ Запись сохранена!');
}

// ===== РАСЧЁТ СТАТИСТИКИ =====
function calculateStats(data) {
    if (data.length === 0) {
        return {
            todayMorning: null,
            todayEvening: null,
            dailyChange: null,
            avgMorning: null,
            avgEvening: null,
            totalDynamics: null,
            hasData: false,
        };
    }

    const today = getTodayKey();
    const todayEntry = data.find(entry => entry.date === today);

    const morningWeights = data
        .filter(entry => entry.morning !== null)
        .map(entry => entry.morning);

    const eveningWeights = data
        .filter(entry => entry.evening !== null)
        .map(entry => entry.evening);

    const avgMorning = morningWeights.length > 0
        ? morningWeights.reduce((a, b) => a + b, 0) / morningWeights.length
        : null;

    const avgEvening = eveningWeights.length > 0
        ? eveningWeights.reduce((a, b) => a + b, 0) / eveningWeights.length
        : null;

    let dailyChange = null;
    if (todayEntry && todayEntry.morning !== null && todayEntry.evening !== null) {
        dailyChange = todayEntry.evening - todayEntry.morning;
    }

    let totalDynamics = null;
    const firstMorning = data.find(entry => entry.morning !== null);
    const lastMorning = [...data].reverse().find(entry => entry.morning !== null);
    if (firstMorning && lastMorning && firstMorning.date !== lastMorning.date) {
        totalDynamics = lastMorning.morning - firstMorning.morning;
    }

    return {
        todayMorning: todayEntry ? todayEntry.morning : null,
        todayEvening: todayEntry ? todayEntry.evening : null,
        dailyChange,
        avgMorning,
        avgEvening,
        totalDynamics,
        hasData: true,
    };
}

// ===== ОБНОВЛЕНИЕ UI =====
function updateUI() {
    const data = loadData();
    const stats = calculateStats(data);

    elements.todayMorning.textContent = formatWeight(stats.todayMorning);
    elements.todayEvening.textContent = formatWeight(stats.todayEvening);

    if (stats.dailyChange !== null) {
        const change = stats.dailyChange;
        elements.dailyChange.textContent = formatChange(change);
        elements.dailyChange.className = 'stat-value ' + (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral');
    } else {
        elements.dailyChange.textContent = '—';
        elements.dailyChange.className = 'stat-value';
    }

    elements.avgMorning.textContent = formatWeight(stats.avgMorning);
    elements.avgEvening.textContent = formatWeight(stats.avgEvening);

    if (stats.totalDynamics !== null) {
        const change = stats.totalDynamics;
        elements.totalDynamics.textContent = formatChange(change);
        elements.totalDynamics.className = 'stat-value ' + (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral');
    } else {
        elements.totalDynamics.textContent = '—';
        elements.totalDynamics.className = 'stat-value';
    }

    renderHistory(data);
    renderChart(data);

    // Устанавливаем дату по умолчанию – сегодня
    if (!elements.dateInput.value) {
        elements.dateInput.value = getTodayKey();
    }
}

// ===== ИСТОРИЯ =====
function renderHistory(data) {
    const container = elements.historyList;
    if (data.length === 0) {
        container.innerHTML = '<p class="empty-message">Пока нет записей. Добавь свой первый вес!</p>';
        return;
    }

    const reversed = [...data].reverse().slice(0, 30);
    let html = '';
    for (const entry of reversed) {
        const morning = entry.morning !== null ? entry.morning.toFixed(1) : '—';
        const evening = entry.evening !== null ? entry.evening.toFixed(1) : '—';
        let changeText = '';
        let changeClass = '';
        if (entry.morning !== null && entry.evening !== null) {
            const diff = entry.evening - entry.morning;
            changeText = formatChange(diff);
            changeClass = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
        }
        html += `
            <div class="history-item">
                <span class="date">${formatFullDate(entry.date)}</span>
                <div class="weights">
                    <span class="morning">🌅 ${morning}</span>
                    <span class="evening">🌆 ${evening}</span>
                    ${changeText ? `<span class="change ${changeClass}">${changeText}</span>` : ''}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// ===== ГРАФИК =====
let chartInstance = null;
let currentPeriod = 'all';

function getFilteredData(data, period) {
    if (period === 'all') return data;
    const now = new Date();
    let cutoff = new Date(now);
    if (period === 'week') {
        cutoff.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        cutoff.setMonth(now.getMonth() - 1);
    }
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return data.filter(entry => entry.date >= cutoffStr);
}

function renderChart(data) {
    const filtered = getFilteredData(data, currentPeriod);
    if (filtered.length === 0) {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        const ctx = elements.chartCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.chartCanvas.width, elements.chartCanvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Нет данных для графика', elements.chartCanvas.width / 2, elements.chartCanvas.height / 2);
        return;
    }

    const labels = filtered.map(entry => formatDate(entry.date));
    const morningData = filtered.map(entry => entry.morning);
    const eveningData = filtered.map(entry => entry.evening);
    const ctx = elements.chartCanvas.getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '🌅 Утро',
                data: morningData,
                borderColor: CHART_COLORS.morning,
                backgroundColor: CHART_COLORS.morning + '20',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: CHART_COLORS.morning,
                spanGaps: true,
            }, {
                label: '🌆 Вечер',
                data: eveningData,
                borderColor: CHART_COLORS.evening,
                backgroundColor: CHART_COLORS.evening + '20',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: CHART_COLORS.evening,
                spanGaps: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20,
                        font: { size: 12 },
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.parsed.y === null || context.parsed.y === undefined) return 'Нет данных';
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + ' кг';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: CHART_COLORS.grid },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + ' кг';
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            }
        }
    });
}

// ===== ПЕРИОДЫ =====
function setPeriod(period) {
    currentPeriod = period;
    elements.chartBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    renderChart(loadData());
}

// ===== ОЧИСТКА =====
function clearAll() {
    if (confirm('⚠️ Ты уверен, что хочешь удалить ВСЮ историю веса? Это нельзя отменить!')) {
        saveData([]);
        updateUI();
        showNotification('🗑️ История очищена');
    }
}

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(text) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = text;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '10px',
        fontSize: '1rem',
        fontFamily: 'inherit',
        zIndex: '1000',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '90%',
        textAlign: 'center',
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function init() {
    // Устанавливаем сегодняшнюю дату в поле ввода
    elements.dateInput.value = getTodayKey();

    updateUI();

    elements.saveBtn.addEventListener('click', saveEntry);
    elements.clearBtn.addEventListener('click', clearAll);

    elements.chartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            setPeriod(this.dataset.period);
        });
    });

    elements.morningInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEntry();
    });
    elements.eveningInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEntry();
    });

    document.querySelector('.chart-btn[data-period="all"]')?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', init);
