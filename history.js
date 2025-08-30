// عناصر DOM
const navItems = document.querySelectorAll('.nav-item');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const backToDashboard = document.getElementById('backToDashboard');
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');
const exportBtn = document.getElementById('exportBtn');
const historyType = document.getElementById('historyType');
const dateRange = document.getElementById('dateRange');
const customDateRange = document.getElementById('customDateRange');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const historyItems = document.getElementById('historyItems');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// حالة التطبيق
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;
let currentHistory = [];

// تبديل بين الصفحات
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.dataset.page;
        
        // تحديث العناصر النشطة
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // إذا كانت الصفحة ليست history، انتقل إليها
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        if (targetPage !== currentPage) {
            window.location.href = `${targetPage}.html`;
        }
    });
});

// تبديل وضع الظلام
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', themeToggle.checked);
    localStorage.setItem('darkMode', themeToggle.checked);
});

// تحميل وضع الظلام المحفوظ
window.addEventListener('load', () => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    themeToggle.checked = savedDarkMode;
    document.body.classList.toggle('dark-mode', savedDarkMode);
    
    // التحقق من التوكن
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    // جلب التاريخ
    fetchHistory();
    
    // تعيين تواريخ افتراضية
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    
    startDate.value = oneWeekAgo.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
});

// إظهار/إخفاء نطاق التاريخ المخصص
dateRange.addEventListener('change', () => {
    customDateRange.style.display = dateRange.value === 'custom' ? 'flex' : 'none';
});

// العودة إلى الداشبورد
backToDashboard.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
});

// تسجيل الخروج
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

// تطبيق الفلتر
applyFilters.addEventListener('click', () => {
    const type = historyType.value;
    const range = dateRange.value;
    filterHistory(type, range);
});

// مسح الفلتر
clearFilters.addEventListener('click', () => {
    historyType.value = 'all';
    dateRange.value = 'today';
    customDateRange.style.display = 'none';
    fetchHistory();
});

// تصدير البيانات
exportBtn.addEventListener('click', () => {
    exportToCSV();
});

// التنقل بين الصفحات
prevPage.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        displayHistory(currentHistory);
    }
});

nextPage.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        displayHistory(currentHistory);
    }
});

// جلب التاريخ من API
async function fetchHistory() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:5000/history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const history = await response.json();
            currentHistory = history;
            displayHistory(history);
            updateStats(history);
        }
    } catch (error) {
        console.error('Error fetching history:', error);
        // بيانات تجريبية للاختبار
        displaySampleHistory();
    }
}

// عرض التاريخ
function displayHistory(history) {
    historyItems.innerHTML = '';
    
    if (history.length === 0) {
        historyItems.innerHTML = `
            <div class="no-history">
                <i class="fas fa-history"></i>
                <p>No history found</p>
            </div>
        `;
        return;
    }
    
    // حساب Pagination
    totalPages = Math.ceil(history.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, history.length);
    const paginatedHistory = history.slice(startIndex, endIndex);
    
    paginatedHistory.forEach(event => {
        const eventElement = createHistoryElement(event);
        historyItems.appendChild(eventElement);
    });
    
    // تحديث Pagination
    updatePagination(history.length);
}

// إنشاء عنصر تاريخ
function createHistoryElement(event) {
    const eventType = getEventType(event.type || event.action);
    const icon = getHistoryIcon(event.type || event.action);
    
    const eventElement = document.createElement('div');
    eventElement.className = 'history-item';
    eventElement.innerHTML = `
        <div class="history-icon">
            <i class="${icon}"></i>
        </div>
        <div class="history-content">
            <div class="history-title">${event.action || event.type}</div>
            <div class="history-desc">${event.message || event.description}</div>
            <div class="history-time">${formatTime(event.timestamp)}</div>
        </div>
        <span class="history-type ${eventType}">${eventType}</span>
    `;
    
    return eventElement;
}

// تصنيف الأحداث
function getEventType(action) {
    const types = {
        'door': 'door',
        'light': 'light',
        'sensor': 'sensor',
        'alert': 'alert',
        'system': 'system',
        'login': 'system',
        'logout': 'system'
    };
    
    for (const [key, value] of Object.entries(types)) {
        if (action.toLowerCase().includes(key)) {
            return value;
        }
    }
    return 'system';
}

// أيقونات التاريخ
function getHistoryIcon(action) {
    const icons = {
        'door': 'fas fa-door-open',
        'light': 'fas fa-lightbulb',
        'sensor': 'fas fa-chart-line',
        'alert': 'fas fa-bell',
        'temperature': 'fas fa-temperature-high',
        'humidity': 'fas fa-tint',
        'gas': 'fas fa-wind',
        'motion': 'fas fa-running',
        'current': 'fas fa-bolt',
        'login': 'fas fa-sign-in-alt',
        'logout': 'fas fa-sign-out-alt'
    };
    
    for (const [key, value] of Object.entries(icons)) {
        if (action.toLowerCase().includes(key)) {
            return value;
        }
    }
    return 'fas fa-history';
}

// تنسيق الوقت
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ar-EG');
}

// تحديث الإحصائيات
function updateStats(history) {
    const totalEvents = history.length;
    const doorEvents = history.filter(e => getEventType(e.action) === 'door').length;
    const alertEvents = history.filter(e => getEventType(e.action) === 'alert').length;
    const lightEvents = history.filter(e => getEventType(e.action) === 'light').length;
    
    document.getElementById('totalEvents').textContent = totalEvents.toLocaleString();
    document.getElementById('doorEvents').textContent = doorEvents.toLocaleString();
    document.getElementById('alertEvents').textContent = alertEvents.toLocaleString();
    document.getElementById('lightEvents').textContent = lightEvents.toLocaleString();
    document.getElementById('totalHistory').textContent = `${totalEvents} events found`;
}

// تحديث Pagination
function updatePagination(totalItems) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
}

// فلترة التاريخ
function filterHistory(type, range) {
    // هنا هتتم الفلترة حسب النوع والنطاق الزمني
    // حالياً بنعرض بيانات sample للاختبار
    displaySampleHistory();
}

// تصدير إلى CSV
function exportToCSV() {
    showNotification('Export feature coming soon!', 'info');
}

// عرض إشعار
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
    `;
    
    if (type === 'success') notification.style.background = '#28a745';
    else if (type === 'error') notification.style.background = '#dc3545';
    else notification.style.background = '#17a2b8';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// بيانات تجريبية للاختبار
function displaySampleHistory() {
    const sampleHistory = [
        {
            id: 1,
            action: 'Door Opened',
            message: 'Main door opened by user',
            type: 'door',
            timestamp: new Date().toISOString()
        },
        {
            id: 2,
            action: 'Light Turned On',
            message: 'Living room light turned on',
            type: 'light',
            timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 3,
            action: 'Temperature Alert',
            message: 'High temperature detected: 35°C',
            type: 'alert',
            timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
            id: 4,
            action: 'User Login',
            message: 'User logged in successfully',
            type: 'system',
            timestamp: new Date(Date.now() - 10800000).toISOString()
        },
        {
            id: 5,
            action: 'Gas Sensor Reading',
            message: 'Gas level: 250 ppm',
            type: 'sensor',
            timestamp: new Date(Date.now() - 14400000).toISOString()
        }
    ];
    
    currentHistory = sampleHistory;
    displayHistory(sampleHistory);
    updateStats(sampleHistory);
}