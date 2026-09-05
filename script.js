function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag]));
}

// ============ NEW FEATURES JS ============

// 1. Show/Hide Password — Magnifying Glass Spin
window.togglePw = function(id, btn) {
    const inp = document.getElementById(id);
    if (!inp) return;

    // Remove old animation classes first
    btn.classList.remove('spinning-show', 'spinning-hide');
    void btn.offsetWidth; // force reflow to restart animation

    if (inp.type === 'password') {
        inp.type = 'text';
        btn.innerHTML = '<i class="fas fa-search-plus"></i>';
        btn.classList.add('spinning-show');
        btn.title = 'Hide password';
    } else {
        inp.type = 'password';
        btn.innerHTML = '<i class="fas fa-search"></i>';
        btn.classList.add('spinning-hide');
        btn.title = 'Show password';
    }
};

// 2. Password Strength Meter
function checkStrength(val) {
    const fill = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    if (!fill || !label) return;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
        { pct: '0%',   color: 'transparent', text: '' },
        { pct: '25%',  color: '#ef4444',      text: 'Weak' },
        { pct: '50%',  color: '#f59e0b',      text: 'Fair' },
        { pct: '75%',  color: '#3b82f6',      text: 'Good' },
        { pct: '100%', color: '#10b981',      text: 'Strong' }
    ];
    const lvl = levels[score];
    fill.style.width = lvl.pct;
    fill.style.background = lvl.color;
    label.textContent = lvl.text;
    label.style.color = lvl.color;
}

// 3. Dark/Light Mode Toggle
window.toggleTheme = function() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = document.body.classList.contains('light-mode')
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
};
// Restore saved theme
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}

// 4. Export CSV
window.exportCSV = function() {
    const users = JSON.parse(localStorage.getItem('nscc_users')) || [];
    if (!users.length) return alert('No users to export!');
    const header = 'Rank,Username,Email,Joined\n';
    const rows = users.map((u, i) => `${i+1},${u.username},${u.email},${u.id || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nscc_users.csv';
    a.click();
};

// 5. Particle Stars Background
(function() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 1.5 + 0.3,
            speed: Math.random() * 0.3 + 0.1,
            opacity: Math.random()
        });
    }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(167,139,250,${s.opacity})`;
            ctx.fill();
            s.y -= s.speed;
            s.opacity = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() / 1000 + s.x));
            if (s.y < 0) s.y = window.innerHeight;
        });
        requestAnimationFrame(draw);
    }
    draw();
})();

// 6. Typing Animation on overlay text
let typewriterTimer = null;
function initTypewriter() {
    const el = document.getElementById('typing-text');
    if (!el) return;
    if (typewriterTimer) clearTimeout(typewriterTimer);
    const texts = ['Hello, Friend!', 'Join Us Today!', 'Start Your Journey!'];
    let ti = 0, ci = 0, deleting = false;
    
    function type() {
        const current = texts[ti];
        if (deleting) {
            el.innerHTML = escapeHTML(current.substring(0, ci--)) + '<span class="type-cursor">|</span>';
            if (ci < 0) {
                deleting = false;
                ti = (ti + 1) % texts.length;
                ci = 0;
                typewriterTimer = setTimeout(type, 300);
                return;
            }
            typewriterTimer = setTimeout(type, 40);
        } else {
            el.innerHTML = escapeHTML(current.substring(0, ci++)) + '<span class="type-cursor">|</span>';
            if (ci > current.length) {
                deleting = true;
                typewriterTimer = setTimeout(type, 1500);
                return;
            }
            typewriterTimer = setTimeout(type, 80);
        }
    }
    type();
}

// 7. Time-based greeting
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

// 8. Confetti on successful signup
function fireConfetti() {
    if (typeof confetti === 'undefined') return;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#6366f1','#8b5cf6','#a78bfa','#fff'] });
}

// =========================================
// --- Auth0 Integration ---
let auth0Client = null;
let auth0Promise = null;

if (typeof auth0 !== 'undefined') {
    auth0Promise = auth0.createAuth0Client({
        domain: 'dev-85qmobpjhtmnp5o4.us.auth0.com',
        clientId: 'E9rgWOICuCfjAOCHkaroMSIDCd832aNX',
        authorizationParams: { redirect_uri: location.origin }
    }).then(async (client) => {
        auth0Client = client;
        console.log("Auth0 Initialized successfully");
        
        if (location.search.includes('error=')) {
            console.error('Auth0 error', location.search);
            history.replaceState({}, document.title, location.pathname);
        }

        if (location.search.includes('code=') && location.search.includes('state=')) {
            await auth0Client.handleRedirectCallback();
            history.replaceState({}, document.title, location.pathname);
        }

        if (await auth0Client.isAuthenticated()) {
            const user = await auth0Client.getUser();
            const nsccUser = {
                username: user.name || user.nickname || 'Social User',
                email: user.email,
                auth0: true
            };
            
            localStorage.setItem('currentUser', JSON.stringify(nsccUser));
            
            let users = JSON.parse(localStorage.getItem('nscc_users')) || [];
            if (!users.some(u => u.email === user.email)) {
                users.push(nsccUser);
                localStorage.setItem('nscc_users', JSON.stringify(users));
            }
            
            if (document.getElementById('auth-container')) {
                document.getElementById('auth-container').style.display = 'none';
                document.querySelector('.dashboard-container').style.display = 'block';
                
                const currentUserName = nsccUser.username || 'Member';
                const welcomeMsg = document.getElementById('welcome-message');
                const welcomeSub = document.getElementById('welcome-subtext');
                const welcomeAvatar = document.getElementById('welcome-avatar');
                const greeting = typeof getGreeting === 'function' ? getGreeting() : 'Welcome';
                
                if (welcomeMsg) welcomeMsg.textContent = `${greeting}, ${currentUserName}!`;
                if (welcomeSub) welcomeSub.textContent = nsccUser.email || 'Logged in successfully';
                if (welcomeAvatar) welcomeAvatar.textContent = currentUserName.charAt(0).toUpperCase();
                
                if (typeof renderDashboard === 'function') renderDashboard();
            }
        }
    }).catch(err => {
        console.error("Failed to initialize Auth0", err);
    });
}

window.loginWithAuth0 = async function(e) {
    if (e) e.preventDefault();
    if (auth0Promise) await auth0Promise;
    if (auth0Client) {
        auth0Client.loginWithRedirect();
    } else {
        alert("Auth0 failed to load. Check your internet connection or console for errors.");
    }
};
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
    initTypewriter();
    const authContainer = document.getElementById('auth-container');
    
    // Desktop Sliding Panel Logic
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');

    if (signUpButton) {
        signUpButton.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            if (authContainer) authContainer.classList.add("right-panel-active");
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            if (authContainer) authContainer.classList.remove("right-panel-active");
        });
    }

    // Mobile Toggle Logic
    const mobileGoLoginBtns = document.querySelectorAll('#mobile-go-login, #mobile-top-signin, #mobile-back-to-login');
    const mobileGoSignupBtns = document.querySelectorAll('#mobile-go-signup, #mobile-top-signup');
    
    mobileGoLoginBtns.forEach(btn => {
        if(btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            authContainer.classList.remove("right-panel-active");
        });
    });
    
    mobileGoSignupBtns.forEach(btn => {
        if(btn) btn.addEventListener('click', (e) => {
            e.preventDefault();
            authContainer.classList.add("right-panel-active");
        });
    });

    // Form Logic
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Check if logged in
    let currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showDashboard();
    }

    document.getElementById('password')?.addEventListener('input', e => checkStrength(e.target.value));

    // Real-time email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', e => {
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
            e.target.classList.toggle('valid', valid);
            e.target.classList.remove('invalid');
        });
        emailInput.addEventListener('blur', e => {
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
            if (e.target.value.length > 0) {
                e.target.classList.toggle('valid', valid);
                e.target.classList.toggle('invalid', !valid);
            }
        });
    }

    // Time-based greeting update
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg && welcomeMsg.textContent === 'Welcome!') {
        welcomeMsg.textContent = getGreeting() + '!';
    }

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let isValid = validateSignupForm();
        if (isValid) {
            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            const hashedPassword = await hashPassword(passwordInput.value);
            
            const newUser = {
                id: Date.now().toString(),
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                password: hashedPassword
            };
            
            saveUser(newUser);
            signupForm.reset();
            
            // Auto login after signup
            localStorage.setItem('currentUser', newUser.email);
            showDashboard();
            fireConfetti();
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginEmail = document.getElementById('login-email').value.trim();
        
        let users = JSON.parse(localStorage.getItem('nscc_users')) || [];
        const user = users.find(u => u.email === loginEmail);
        
        if (user) {
            localStorage.setItem('currentUser', user.email);
            localStorage.setItem('lastLogin', new Date().toLocaleString());
            showDashboard();
            loginForm.reset();
        } else {
            alert('User not found! Please check your email or Sign Up.');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (auth0Client) auth0Client.logout({ logoutParams: { returnTo: location.origin } });
            localStorage.removeItem('currentUser');
            dashboardScreen.style.display = 'none';
            authContainer.style.display = 'block';
        });
    }

    function validateSignupForm() {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        let isValid = true;

        if (usernameInput.value.trim().length < 3) {
            showError(usernameInput, 'Min 3 chars');
            isValid = false;
        } else { clearError(usernameInput); }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            showError(emailInput, 'Invalid email');
            isValid = false;
        } else { clearError(emailInput); }

        if (passwordInput.value.length < 6) {
            showError(passwordInput, 'Min 6 chars');
            isValid = false;
        } else { clearError(passwordInput); }

        const cvEl = document.getElementById('captcha-verified');
        const ceEl = document.getElementById('captcha-error');
        if (cvEl && cvEl.value !== 'true') {
            if (ceEl) {
                ceEl.textContent = 'Please complete the puzzle.';
                ceEl.style.visibility = 'visible';
            }
            isValid = false;
        } else if (ceEl) {
            ceEl.style.visibility = 'hidden';
        }

        return isValid;
    }

    function showError(inputElement, message) {
        const errorElement = document.getElementById(`${inputElement.id}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
        }
    }

    function clearError(inputElement) {
        const errorElement = document.getElementById(`${inputElement.id}-error`);
        if (errorElement) {
            errorElement.classList.remove('visible');
        }
    }

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function saveUser(user) {
        let users = JSON.parse(localStorage.getItem('nscc_users')) || [];
        users.push(user);
        localStorage.setItem('nscc_users', JSON.stringify(users));
    }

    function showDashboard() {
        if (authContainer) authContainer.style.display = 'none';
        if (dashboardScreen) dashboardScreen.style.display = 'block';
        
        let users = JSON.parse(localStorage.getItem('nscc_users')) || [];
        let currentUserRaw = localStorage.getItem('currentUser');
        
        let currentUserEmail = '';
        let currentUserName = '';
        
        if (currentUserRaw) {
            if (currentUserRaw.startsWith('{')) {
                try {
                    let parsed = JSON.parse(currentUserRaw);
                    currentUserEmail = parsed.email || '';
                    currentUserName = parsed.username || parsed.name || '';
                } catch(e) {
                    currentUserEmail = currentUserRaw;
                }
            } else {
                currentUserEmail = currentUserRaw;
            }
        }
        
        // Find user in users array
        let userIndex = users.findIndex(u => u.email && currentUserEmail && u.email.toLowerCase() === currentUserEmail.toLowerCase());
        let userObj = userIndex !== -1 ? users[userIndex] : null;
        
        if (!currentUserName && userObj) {
            currentUserName = userObj.username;
        }
        if (!currentUserName && currentUserEmail) {
            currentUserName = currentUserEmail.split('@')[0];
        }
        if (!currentUserName) {
            currentUserName = 'Member';
        }
        
        const welcomeMsg = document.getElementById('welcome-message');
        const welcomeSub = document.getElementById('welcome-subtext');
        const welcomeAvatar = document.getElementById('welcome-avatar');
        const rankMsg = document.getElementById('rank-message');
        
        const greeting = typeof getGreeting === 'function' ? getGreeting() : 'Welcome';
        if (welcomeMsg) welcomeMsg.textContent = `${greeting}, ${escapeHTML(currentUserName)}!`;
        if (welcomeSub) welcomeSub.textContent = currentUserEmail ? currentUserEmail : 'Logged in successfully';
        if (welcomeAvatar) welcomeAvatar.textContent = currentUserName.charAt(0).toUpperCase();
        
        if (rankMsg) {
            let rankNum = userIndex !== -1 ? userIndex + 1 : 1;
            rankMsg.innerHTML = `<i class="fas fa-trophy"></i> Member <strong>#${rankNum}</strong>`;
        }
        
        renderDashboard();
    }

    // Expose delete
    window.handleDelete = function(id) {
        let users = JSON.parse(localStorage.getItem('nscc_users')) || [];
        users = users.filter(user => user.id !== id.toString());
        localStorage.setItem('nscc_users', JSON.stringify(users));
        renderDashboard();
    }

    function renderDashboard() {
        const userTbody = document.getElementById('user-tbody');
        const emptyState = document.getElementById('empty-state');
        let users = JSON.parse(localStorage.getItem('nscc_users')) || [];
        const searchEl = document.getElementById('user-search');
        const query = searchEl ? searchEl.value.toLowerCase().trim() : '';
        
        if (query) {
            users = users.filter(u => 
                (u.username && u.username.toLowerCase().includes(query)) || 
                (u.email && u.email.toLowerCase().includes(query))
            );
        }
        
        if (!userTbody) return;
        userTbody.innerHTML = '';
        
        if (users.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            const wrapper = document.querySelector('.table-wrapper');
            if (wrapper) wrapper.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            const wrapper = document.querySelector('.table-wrapper');
            if (wrapper) wrapper.style.display = 'block';
            
            users.forEach((user, index) => {
                const tr = document.createElement('tr');
                const uname = user.username || (user.email ? user.email.split('@')[0] : 'User');
                const uemail = user.email || 'N/A';
                const initial = uname.charAt(0).toUpperCase();
                
                // Generate consistent dummy data based on user rank
                const classes = ['Grandmaster', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
                const playerClass = classes[index % classes.length];
                
                // Calculate score
                const baseScore = 15000;
                const score = baseScore - (index * 850) + (uname.length * 25);
                
                tr.innerHTML = `
                    <td class="td-rank">#${index + 1}</td>
                    <td class="td-member">
                        <div class="user-cell">
                            <div class="user-avatar">${initial}</div>
                            <div class="user-info">
                                <span class="user-name">${escapeHTML(uname)}</span>
                                <span class="user-email-sub">${escapeHTML(uemail)}</span>
                            </div>
                        </div>
                    </td>
                    <td class="td-class"><span class="class-badge class-${playerClass.toLowerCase()}">${playerClass}</span></td>
                    <td class="td-status"><span class="status-badge">Online</span></td>
                `;
                userTbody.appendChild(tr);
            });
        }
    }

    // Image Text Captcha Logic
    const captchaImages = [
        { src: 'captcha1.png',                          answer: 'prnu' },
        { src: 'captcha2.jpg',                          answer: 'qggphjd' },
        { src: 'captcha3.jpg',                          answer: 'smzm' },
        { src: 'images (1).png',                        answer: 'agbf' },
        { src: 'images (2).jpg',                        answer: 'e3tj6hp' },
        { src: 'images.jpg',                            answer: 'qggphjd' },
        { src: 'images (1).jpg',                        answer: 'smzm' },
        { src: 'Screenshot 2026-09-05 182910.png',      answer: 'inued' },
        { src: 'Screenshot 2026-09-05 183009.png',      answer: 'zsjcxt' },
        { src: 'Screenshot 2026-09-05 183016.png',      answer: '542089' },
        { src: 'Screenshot 2026-09-05 183040.png',      answer: 'v6sqibcdt' }
    ];

    let currentCaptchaIndex = Math.floor(Math.random() * captchaImages.length);

    function loadCaptcha(index) {
        const imgEl = document.getElementById('captcha-img');
        const answerEl = document.getElementById('captcha-answer');
        const inputEl = document.getElementById('captcha-input');
        const verifiedEl = document.getElementById('captcha-verified');
        if (!imgEl) return;
        imgEl.src = captchaImages[index].src;
        answerEl.value = captchaImages[index].answer.toLowerCase();
        if (inputEl) inputEl.value = '';
        if (verifiedEl) verifiedEl.value = 'false';
    }

    loadCaptcha(currentCaptchaIndex);

    const captchaRefresh = document.getElementById('captcha-refresh');
    if (captchaRefresh) {
        captchaRefresh.addEventListener('click', () => {
            currentCaptchaIndex = (currentCaptchaIndex + 1) % captchaImages.length;
            loadCaptcha(currentCaptchaIndex);
            const errEl = document.getElementById('captcha-error');
            if (errEl) errEl.style.visibility = 'hidden';
        });
    }

    // Validate captcha input on typing
    const captchaInput = document.getElementById('captcha-input');
    if (captchaInput) {
        captchaInput.addEventListener('input', () => {
            const answerEl = document.getElementById('captcha-answer');
            const verifiedEl = document.getElementById('captcha-verified');
            if (captchaInput.value.toLowerCase().trim() === answerEl.value) {
                verifiedEl.value = 'true';
            } else {
                verifiedEl.value = 'false';
            }
        });
    }



    // Forgot Password Logic
    const forgotPwdBtn = document.querySelector('.forgot-pwd');
    if (forgotPwdBtn) {
        forgotPwdBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (typeof Swal === 'undefined') {
                alert("Please wait for the page to fully load.");
                return;
            }

            const { value: email } = await Swal.fire({
                title: 'Reset Password',
                input: 'email',
                inputLabel: 'Enter your registered email address',
                inputPlaceholder: 'user@example.com',
                showCancelButton: true,
                confirmButtonColor: '#6366f1',
                cancelButtonColor: '#334155',
                background: '#1e293b',
                color: '#f8fafc',
                validationMessage: 'Please enter a valid email address'
            });

            if (email) {
                let users = JSON.parse(localStorage.getItem('nscc_users')) || [];
                let userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
                
                if (userIndex === -1) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Email not found',
                        text: 'No account is registered with this email address.',
                        background: '#1e293b',
                        color: '#f8fafc',
                        confirmButtonColor: '#6366f1'
                    });
                } else if (users[userIndex].auth0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Social Login',
                        text: 'This email is linked to a Google account. Please use Google to sign in.',
                        background: '#1e293b',
                        color: '#f8fafc',
                        confirmButtonColor: '#6366f1'
                    });
                } else {
                    const { value: newPassword } = await Swal.fire({
                        title: 'New Password',
                        input: 'password',
                        inputLabel: 'Enter your new password',
                        inputPlaceholder: 'New password',
                        showCancelButton: true,
                        confirmButtonColor: '#6366f1',
                        cancelButtonColor: '#334155',
                        background: '#1e293b',
                        color: '#f8fafc',
                        inputValidator: (value) => {
                            if (!value) return 'You need to write something!';
                            if (value.length < 6) return 'Password must be at least 6 characters!';
                        }
                    });

                    if (newPassword) {
                        users[userIndex].password = await hashPassword(newPassword);
                        localStorage.setItem('nscc_users', JSON.stringify(users));
                        Swal.fire({
                            icon: 'success',
                            title: 'Password Updated!',
                            text: 'Your password has been successfully reset. You can now log in.',
                            background: '#1e293b',
                            color: '#f8fafc',
                            confirmButtonColor: '#10b981'
                        });
                    }
                }
            }
        });
    }
});
