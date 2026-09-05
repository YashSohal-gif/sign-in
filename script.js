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

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag]));
    }
});

let auth0Client = null;

// 1. Initialize Auth0
async function initAuth0() {
    auth0Client = await createAuth0Client({
        domain: "https://sign-in-eta-wine.vercel.app/.auth0.com", // Get this from Auth0 Settings
        clientId: "581387578808-esac9j9dav4mrrj850uilic2h2ohm15r.apps.googleusercontent.com",      // Get this from Auth0 Settings
        authorizationParams: {
            redirect_uri: window.location.origin
        }
    });

    // 2. Check if the user just returned from logging in
    if (location.search.includes("state=") && 
        (location.search.includes("code=") || location.search.includes("error="))) {
        await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/");
    }

    // 3. Check if user is logged in
    const isAuthenticated = await auth0Client.isAuthenticated();
    if (isAuthenticated) {
        const user = await auth0Client.getUser();
        console.log("Logged in user:", user);
        
        // Save to your localStorage to match your dashboard logic!
        localStorage.setItem('currentUser', JSON.stringify({
            username: user.name || user.nickname,
            email: user.email
        }));
        
        // Redirect to dashboard
        window.location.href = "dashboard.html"; // Or call your renderDashboard() function
    }
}

// Run init when page loads
window.addEventListener('load', initAuth0);


