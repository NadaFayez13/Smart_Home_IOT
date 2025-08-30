// عناصر DOM
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const messageEl = document.getElementById('message');
const tabs = document.querySelectorAll('.tab');
const forms = document.querySelectorAll('.form-container');

// 🔹 تبديل بين تسجيل الدخول والتسجيل
if (tabs && tabs.length > 0) {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;

            // تحديث التبويبات النشطة
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // إظهار النموذج المحدد وإخفاء الآخر
            forms.forEach(form => form.classList.remove('active'));
            document.getElementById(`${target}Form`).classList.add('active');
        });
    });
}

// 🔹 معالجة تسجيل الدخول
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log("📩 Login Response:", data);

            if (response.ok && data.access_token) {
                showMessage('✅ تم تسجيل الدخول بنجاح! يتم التوجيه إلى لوحة التحكم...', 'success');

                // حفظ البيانات
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user || {}));

                // التوجيه مباشرة بدون Back loop
                setTimeout(() => {
                    window.location.replace('dashboard.html');
                }, 1500);
            } else {
                showMessage(data.error || '⚠️ فشل تسجيل الدخول، تأكد من البيانات', 'error');
            }
        } catch (error) {
            console.error("❌ Login Error:", error);
            showMessage('خطأ في الاتصال بالخادم', 'error');
        }
    });
}

// 🔹 معالجة إنشاء الحساب
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            showMessage('⚠️ كلمات المرور غير متطابقة', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            console.log("📩 Signup Response:", data);

            if (response.ok) {
                showMessage('✅ تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.', 'success');

                // الانتقال إلى تبويب تسجيل الدخول
                if (tabs.length > 0) tabs[0].click();
            } else {
                showMessage(data.error || '⚠️ فشل إنشاء الحساب', 'error');
            }
        } catch (error) {
            console.error("❌ Signup Error:", error);
            showMessage('خطأ في الاتصال بالخادم', 'error');
        }
    });
}

// 🔹 عرض الرسائل
function showMessage(message, type) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.className = type;
    messageEl.style.display = 'block';

    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

// 🔹 تسجيل الدخول بـ Google (غير مفعل حالياً)
const googleLoginBtn = document.getElementById('googleLogin');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        showMessage('⚠️ تسجيل الدخول بـ Google غير متاح حالياً', 'error');
    });
}

// ✅ التحقق من وجود token عند تحميل index.html
window.addEventListener('load', async () => {
    const token = localStorage.getItem('access_token');

    if (token && token.trim() !== "" && window.location.pathname.includes("index.html")) {
        try {
            // تحقق سريع من صلاحية التوكن
            const res = await fetch("http://localhost:5000/auth/verify", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                console.log("✅ Token valid → redirecting to dashboard");
                window.location.replace("dashboard.html");
            } else {
                console.warn("❌ Token invalid → خليك في index");
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
            }
        } catch (err) {
            console.error("❌ Error verifying token:", err);
        }
    }
});
