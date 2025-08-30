// عناصر DOM
const navItems = document.querySelectorAll('.nav-item');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');

// التنقل بين الصفحات
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPage = item.dataset.page;
        if (targetPage) {
            window.location.href = `${targetPage}.html`;
        }
    });
});

// وضع الظلام
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
    if (!token || token.trim() === "") {
        window.location.replace('index.html');
        return;
    }

    // جلب بيانات السينسورز لو في صفحة My Home
    if (window.location.pathname.includes("my-home.html") || window.location.pathname.includes("dashboard.html")) {
        fetchSensorData();
        setInterval(fetchSensorData, 5000);
    }
});

// تسجيل الخروج
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

// جلب بيانات السينسورز
async function fetchSensorData() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:5000/dashboard/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            updateDashboard(data.sensors);
        }
    } catch (error) {
        console.error('Error fetching sensor data:', error);
    }
}

// تحديث الداشبورد
function updateDashboard(sensorData) {
    if (!sensorData) return;

    document.getElementById('temperature-value').textContent = `${sensorData.temperature}°C`;
    document.getElementById('humidity-value').textContent = `${sensorData.humidity}%`;
    document.getElementById('gas-value').textContent = `${sensorData.gas} ppm`;
    document.getElementById('current-value').textContent = `${sensorData.current}A`;

    const doorStatus = sensorData.door_status === 'open' ? 'Open' : 'Locked';
    document.getElementById('door-value').textContent = doorStatus;

    const lightStatus = sensorData.light_status === 'on' ? 'On' : 'Off';
    document.getElementById('light-value').textContent = lightStatus;

    const motionStatus = sensorData.motion ? 'Motion Detected' : 'No Motion';
    document.getElementById('motion-value').textContent = motionStatus;

    const currentTime = new Date().toLocaleTimeString();
    document.querySelectorAll('.card-time').forEach(el => {
        el.textContent = `Updated: ${currentTime}`;
    });
}
