// عناصر DOM
const navItems = document.querySelectorAll('.nav-item');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const backToDashboard = document.getElementById('backToDashboard');

// أزرار التحكم في الباب
const doorMasterSwitch = document.getElementById('doorMasterSwitch');
const doorOpenBtn = document.querySelector('.door-btn[data-action="open"]');
const doorCloseBtn = document.querySelector('.door-btn[data-action="close"]');
const doorStatusValue = document.getElementById('doorStatusValue');

// أزرار التحكم في الإضاءة
const lightMasterSwitch = document.getElementById('lightMasterSwitch');
const lightSwitches = document.querySelectorAll('.light-switch');

// أزرار Quick Actions
const homeBtn = document.getElementById('homeBtn');
const allOffBtn = document.getElementById('allOffBtn');
const securityBtn = document.getElementById('securityBtn');

// تبديل بين الصفحات
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.dataset.page;
        
        // تحديث العناصر النشطة
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // إذا كانت الصفحة ليست control، انتقل إليها
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
    
    // جلب حالة الأجهزة
    fetchDeviceStatus();
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

// التحكم في الباب
doorMasterSwitch.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    doorOpenBtn.disabled = !isEnabled;
    doorCloseBtn.disabled = !isEnabled;
    
    if (!isEnabled) {
        controlDevice('door', 'close');
    }
});

doorOpenBtn.addEventListener('click', () => {
    controlDevice('door', 'open');
});

doorCloseBtn.addEventListener('click', () => {
    controlDevice('door', 'close');
});

// التحكم في الإضاءة
lightMasterSwitch.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    lightSwitches.forEach(switchEl => {
        switchEl.checked = isEnabled;
        const lightId = switchEl.id.replace('lightSwitch', '');
        controlDevice('light', isEnabled ? 'on' : 'off', lightId);
    });
});

lightSwitches.forEach(switchEl => {
    switchEl.addEventListener('change', (e) => {
        const lightId = e.target.id.replace('lightSwitch', '');
        controlDevice('light', e.target.checked ? 'on' : 'off', lightId);
    });
});

// Quick Actions
homeBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
});

allOffBtn.addEventListener('click', () => {
    // إيقاف جميع الأجهزة
    controlDevice('door', 'close');
    lightSwitches.forEach(switchEl => {
        switchEl.checked = false;
        const lightId = switchEl.id.replace('lightSwitch', '');
        controlDevice('light', 'off', lightId);
    });
    lightMasterSwitch.checked = false;
    
    showNotification('تم إيقاف جميع الأجهزة', 'success');
});

securityBtn.addEventListener('click', () => {
    // تفعيل وضع الأمان
    controlDevice('door', 'close');
    showNotification('تم تفعيل وضع الأمان', 'success');
});

// إرسال أمر التحكم إلى API
async function controlDevice(device, action, deviceId = null) {
    try {
        const token = localStorage.getItem('access_token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        let endpoint = `/control/${device}`;
        let body = {
            action: action,
            user_id: user.id
        };
        
        if (deviceId) {
            body.device_id = deviceId;
        }
        
        const response = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            // تحديث الواجهة
            if (device === 'door') {
                doorStatusValue.textContent = action === 'open' ? 'Open' : 'Locked';
                doorStatusValue.style.color = action === 'open' ? '#4CAF50' : '#d479a0';
            }
            
            showNotification(`تم ${action} ${device} بنجاح`, 'success');
        }
    } catch (error) {
        console.error('Error controlling device:', error);
        showNotification('خطأ في التحكم بالجهاز', 'error');
    }
}

// جلب حالة الأجهزة من API
async function fetchDeviceStatus() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:5000/dashboard/data', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDeviceStatus(data.sensors);
        }
    } catch (error) {
        console.error('Error fetching device status:', error);
        // استخدام بيانات تجريبية للاختبار
        updateSampleDeviceStatus();
    }
}

// تحديث حالة الأجهزة
function updateDeviceStatus(sensorData) {
    if (sensorData) {
        // تحديث حالة الباب
        const isDoorOpen = sensorData.door_status === 'open';
        doorStatusValue.textContent = isDoorOpen ? 'Open' : 'Locked';
        doorStatusValue.style.color = isDoorOpen ? '#4CAF50' : '#d479a0';
        doorMasterSwitch.checked = isDoorOpen;
        
        // تحديث حالة الإضاءة
        const isLightOn = sensorData.light_status === 'on';
        lightMasterSwitch.checked = isLightOn;
        lightSwitches.forEach(switchEl => {
            switchEl.checked = isLightOn;
        });
    }
}

// بيانات تجريبية لحالة الأجهزة
function updateSampleDeviceStatus() {
    doorStatusValue.textContent = 'Locked';
    doorStatusValue.style.color = '#d479a0';
    doorMasterSwitch.checked = false;
    
    lightMasterSwitch.checked = false;
    lightSwitches.forEach(switchEl => {
        switchEl.checked = false;
    });
}

// عرض الإشعارات
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
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.background = '#4CAF50';
    } else {
        notification.style.background = '#f44336';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}