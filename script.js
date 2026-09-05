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
                if (typeof renderDashboard === 'function') renderDashboard();
                const welcomeMsg = document.getElementById('welcome-msg');
                if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${nsccUser.username}!`;
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
    const authContainer = document.getElementById('auth-container');
    
    // Desktop Sliding Panel Logic
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');

    if (signUpButton) {
        signUpButton.addEventListener('click', () => {
            authContainer.classList.add("right-panel-active");
        });
    }

    if (signInButton) {
        signInButton.addEventListener('click', () => {
            authContainer.classList.remove("right-panel-active");
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
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginEmail = document.getElementById('login-email').value.trim();
        
        let users = JSON.parse(localStorage.getItem('nscc_users')) || [];
        const user = users.find(u => u.email === loginEmail);
        
        if (user) {
            localStorage.setItem('currentUser', user.email);
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

        const captchaVerified = document.getElementById('captcha-verified');
        const captchaError = document.getElementById('captcha-error');
        if (captchaVerified && captchaVerified.value !== 'true') {
            if (captchaError) {
                captchaError.textContent = 'Please complete the security swipe.';
                captchaError.style.visibility = 'visible';
            }
            isValid = false;
        } else if (captchaError) {
            captchaError.style.visibility = 'hidden';
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
        let currentUserEmail = localStorage.getItem('currentUser');
        
        // Find current user and their rank (1-indexed based on sign-up order)
        let userIndex = users.findIndex(u => u.email === currentUserEmail);
        
        if (userIndex !== -1) {
            let currentUser = users[userIndex];
            const welcomeMsg = document.getElementById('welcome-message');
            const rankMsg = document.getElementById('rank-message');
            
            if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${escapeHTML(currentUser.username)}!`;
            if (rankMsg) rankMsg.innerHTML = `You are member <strong>#${userIndex + 1}</strong>`;
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
        
        if (!userTbody) return;
        userTbody.innerHTML = '';
        
        if (users.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            const wrapper = document.querySelector('.table-wrapper');
            if (wrapper) wrapper.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            const wrapper = document.querySelector('.table-wrapper');
            if (wrapper) wrapper.style.display = 'block';
            
            users.forEach((user, index) => {
                const tr = document.createElement('tr');
                const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';
                
                // Generate consistent dummy data based on user rank
                const classes = ['Grandmaster', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
                const playerClass = classes[index % classes.length];
                
                // Calculate a fun dummy score (Highest rank gets highest score)
                const baseScore = 15000;
                const score = baseScore - (index * 850) + (user.username.length * 25);
                
                tr.innerHTML = `
                    <td style="font-size: 18px; color: #fff;">#${index + 1}</td>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar">${initial}</div>
                            ${escapeHTML(user.username)}
                        </div>
                    </td>
                    <td class="class-${playerClass.toLowerCase()}">${playerClass}</td>
                    <td class="score-cell">${score.toLocaleString()} PTS</td>
                    <td><span class="status-badge">Online</span></td>
                `;
                userTbody.appendChild(tr);
            });
        }
    }





    // Puzzle Captcha Logic
    const puzzleCaptcha = document.getElementById('puzzle-captcha');
    const puzzleHole = document.getElementById('puzzle-hole');
    const puzzlePiece = document.getElementById('puzzle-piece');
    const captchaSlider = document.getElementById('captcha-slider');
    const captchaFill = document.getElementById('captcha-fill');
    const captchaText = document.getElementById('captcha-text');
    const captchaVerified = document.getElementById('captcha-verified');
    const captchaTrack = document.querySelector('.captcha-track');
    const captchaError = document.getElementById('captcha-error');

    if (puzzleCaptcha && puzzleHole && puzzlePiece && captchaSlider) {
        let isDragging = false;
        let startX = 0;
        let maxDrag = 280 - 45; // Box width (280) - piece width (45)
        let sliderMaxDrag = 280 - 38; // Track width (280) - slider width (34+4)
        
        // Generate random target X (between 100 and 230)
        const targetX = Math.floor(Math.random() * 130) + 100;
        puzzleHole.style.left = targetX + 'px';
        
        // Set puzzle piece background position so it matches the hole
        // The hole is at left: targetX, top: 45px
        puzzlePiece.style.backgroundPosition = \-\px -45px\;
        puzzlePiece.style.left = '10px'; // Start position

        const startDrag = (e) => {
            if (captchaVerified.value === 'true') return;
            isDragging = true;
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            sliderMaxDrag = captchaTrack.offsetWidth - captchaSlider.offsetWidth - 4;
            maxDrag = 280 - 45; // Based on CSS
            captchaSlider.style.transition = 'none';
            captchaFill.style.transition = 'none';
            puzzlePiece.style.transition = 'none';
            if (captchaError) captchaError.style.visibility = 'hidden';
        };

        const doDrag = (e) => {
            if (!isDragging) return;
            const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            let delta = currentX - startX;
            if (delta < 0) delta = 0;
            if (delta > sliderMaxDrag) delta = sliderMaxDrag;
            
            captchaSlider.style.left = (delta + 2) + 'px';
            captchaFill.style.width = (delta + 20) + 'px';
            
            // Move puzzle piece proportionally
            const pieceLeft = 10 + (delta / sliderMaxDrag) * (maxDrag - 10);
            puzzlePiece.style.left = pieceLeft + 'px';
        };

        const stopDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            
            // Check if piece is within 5px of targetX
            const currentPieceLeft = parseFloat(puzzlePiece.style.left);
            const tolerance = 5;
            
            if (Math.abs(currentPieceLeft - targetX) <= tolerance) {
                // Success!
                captchaVerified.value = 'true';
                puzzlePiece.style.left = targetX + 'px';
                captchaSlider.innerHTML = '<i class="fas fa-check"></i>';
                captchaSlider.classList.add('verified');
                captchaText.textContent = 'Verified';
                captchaText.style.color = '#fff';
                
                captchaSlider.style.transition = '0.3s';
                captchaFill.style.transition = '0.3s';
                puzzlePiece.style.transition = '0.3s';
                
                // Snap slider to equivalent position
                const targetSliderLeft = ((targetX - 10) / (maxDrag - 10)) * sliderMaxDrag;
                captchaSlider.style.left = (targetSliderLeft + 2) + 'px';
                captchaFill.style.width = (targetSliderLeft + 20) + 'px';
            } else {
                // Fail, reset
                captchaSlider.style.transition = '0.3s';
                captchaFill.style.transition = '0.3s';
                puzzlePiece.style.transition = '0.3s';
                captchaSlider.style.left = '2px';
                captchaFill.style.width = '0';
                puzzlePiece.style.left = '10px';
            }
        };

        captchaSlider.addEventListener('mousedown', startDrag);
        captchaSlider.addEventListener('touchstart', startDrag, {passive: true});
        
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('touchmove', doDrag, {passive: true});
        
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag]));
    }
});







