// عناصر DOM
const navItems = document.querySelectorAll('.nav-item');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const backToDashboard = document.getElementById('backToDashboard');
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');
const alertType = document.getElementById('alertType');
const alertStatus = document.getElementById('alertStatus');
const alertItems = document.getElementById('alertItems');

// تبديل بين الصفحات
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.dataset.page;
        
        // تحديث العناصر النشطة
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // إذا كانت الصفحة ليست alerts، انتقل إليها
        if (targetPage !== 'alerts') {
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
    
    // جلب الإنذارات
    fetchAlerts();
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
    const type = alertType.value;
    const status = alertStatus.value;
    filterAlerts(type, status);
});

// مسح الفلتر
clearFilters.addEventListener('click', () => {
    alertType.value = 'all';
    alertStatus.value = 'all';
    fetchAlerts();
});

// جلب الإنذارات من API
async function fetchAlerts() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:5000/alerts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const alerts = await response.json();
            displayAlerts(alerts);
            updateStats(alerts);
        }
    } catch (error) {
        console.error('Error fetching alerts:', error);
        // بيانات تجريبية للاختبار
        displaySampleAlerts();
    }
}

// عرض الإنذارات
function displayAlerts(alerts) {
    alertItems.innerHTML = '';
    
    if (alerts.length === 0) {
        alertItems.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-bell-slash"></i>
                <p>No alerts found</p>
            </div>
        `;
        return;
    }
    
    alerts.forEach(alert => {
        const alertElement = createAlertElement(alert);
        alertItems.appendChild(alertElement);
    });
    
    document.getElementById('totalAlerts').textContent = `${alerts.length} alerts found`;
    document.getElementById('alertsCount').textContent = alerts.length;
}

// إنشاء عنصر إنذار
function createAlertElement(alert) {
    const alertClass = getAlertClass(alert.alert_type);
    const icon = getAlertIcon(alert.alert_type);
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert-item ${alertClass}`;
    alertElement.innerHTML = `
        <div class="alert-icon">
            <i class="${icon}"></i>
        </div>
        <div class="alert-content">
            <div class="alert-title">${alert.alert_type}</div>
            <div class="alert-desc">${alert.message}</div>
            <div class="alert-time">${formatTime(alert.timestamp)}</div>
        </div>
        <div class="alert-actions">
            <button class="action-btn resolve-btn" onclick="resolveAlert('${alert.id}')">
                <i class="fas fa-check"></i> Resolve
            </button>
            <button class="action-btn ignore-btn" onclick="ignoreAlert('${alert.id}')">
                <i class="fas fa-times"></i> Ignore
            </button>
        </div>
    `;
    
    return alertElement;
}

// تصنيف الإنذارات
function getAlertClass(alertType) {
    const types = {
        'Gas Leak': 'critical',
        'High Temperature': 'critical',
        'High Current': 'critical',
        'Motion Detected': 'warning',
        'Door Opened': 'info',
        'System Alert': 'info'
    };
    return types[alertType] || 'info';
}

// أيقونات الإنذارات
function getAlertIcon(alertType) {
    const icons = {
        'Gas Leak': 'fas fa-wind',
        'High Temperature': 'fas fa-temperature-high',
        'High Current': 'fas fa-bolt',
        'Motion Detected': 'fas fa-running',
        'Door Opened': 'fas fa-door-open',
        'System Alert': 'fas fa-exclamation-circle'
    };
    return icons[alertType] || 'fas fa-bell';
}

// تنسيق الوقت
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ar-EG');
}

// تحديث الإحصائيات
function updateStats(alerts) {
    const critical = alerts.filter(a => getAlertClass(a.alert_type) === 'critical').length;
    const warning = alerts.filter(a => getAlertClass(a.alert_type) === 'warning').length;
    const info = alerts.filter(a => getAlertClass(a.alert_type) === 'info').length;
    const resolved = alerts.filter(a => a.resolved).length;
    
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('warningCount').textContent = warning;
    document.getElementById('infoCount').textContent = info;
    document.getElementById('resolvedCount').textContent = resolved;
}

// فلترة الإنذارات
function filterAlerts(type, status) {
    // هنا هتتم الفلترة حسب النوع والحالة
    // حالياً بنعرض بيانات sample للاختبار
    displaySampleAlerts();
}

// حل الإنذار
async function resolveAlert(alertId) {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:5000/alerts/${alertId}/resolve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showNotification('Alert resolved successfully', 'success');
            fetchAlerts();
        }
    } catch (error) {
        console.error('Error resolving alert:', error);
        showNotification('Error resolving alert', 'error');
    }
}

// تجاهل الإنذار
async function ignoreAlert(alertId) {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://localhost:5000/alerts/${alertId}/ignore`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showNotification('Alert ignored', 'info');
            fetchAlerts();
        }
    } catch (error) {
        console.error('Error ignoring alert:', error);
        showNotification('Error ignoring alert', 'error');
    }
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
function displaySampleAlerts() {
    const sampleAlerts = [
        {
            id: 1,
            alert_type: 'Gas Leak',
            message: 'Gas level detected at 400 ppm in Kitchen',
            timestamp: new Date().toISOString(),
            resolved: false
        },
        {
            id: 2,
            alert_type: 'High Temperature',
            message: 'Temperature reached 35°C in Living Room',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            resolved: false
        },
        {
            id: 3,
            alert_type: 'Motion Detected',
            message: 'Motion detected at Entrance',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            resolved: true
        },
        {
            id: 4,
            alert_type: 'Door Opened',
            message: 'Main door opened while system is armed',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            resolved: false
        }
    ];
    
    displayAlerts(sampleAlerts);
    updateStats(sampleAlerts);
}