function initializeAuth() {
    const modal = document.getElementById('authModal');
    const closeBtn = document.querySelector('.close');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const userIcon = document.querySelector('.user-icon');

    // Show modal when user icon is clicked
    userIcon.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Close modal when X is clicked
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update form visibility
            const forms = document.querySelectorAll('.auth-form');
            forms.forEach(form => {
                form.style.display = 'none';
                form.classList.remove('active');
            });
            
            document.getElementById('logoutSection').style.display = 'none';
            
            if (target === 'login') {
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('loginForm').classList.add('active');
            } else if (target === 'signup') {
                document.getElementById('signupForm').style.display = 'block';
                document.getElementById('signupForm').classList.add('active');
            }
        });
    });

    // Initialize users array in localStorage if it doesn't exist
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }

    // Check login state on init
    checkLoginState();
}

function checkLoginState() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const logoutSection = document.getElementById('logoutSection');

    if (currentUser) {
        loginForm.style.display = 'none';
        signupForm.style.display = 'none';
        logoutSection.style.display = 'block';
        document.getElementById('userEmail').textContent = currentUser.email;
        authStatus.isLoggedIn = true;
        authStatus.currentUser = currentUser;
    } else {
        // Show login form by default
        loginForm.style.display = 'block';
        loginForm.classList.add('active');
        signupForm.style.display = 'none';
        logoutSection.style.display = 'none';
        authStatus.isLoggedIn = false;
        authStatus.currentUser = null;
    }
}

let authStatus = {
    isLoggedIn: false,
    currentUser: null
};

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${SERVER_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store logged in user
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            authStatus.isLoggedIn = true;
            authStatus.currentUser = data.user;
            checkLoginState();  // Update UI for logged in state
            // Update UI
            showMessage('success', data.message);
            document.getElementById('authModal').style.display = 'none';
            updateUIForLoggedInUser(data.user);
        } else {
            showMessage('error', data.message);
        }
    } catch (error) {
        showMessage('error', 'Login failed: ' + error.message);
    }
}

async function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const vehicleNumber = document.getElementById('vehicleNumber').value;
    
    try {
        const response = await fetch(`${SERVER_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, vehicleNumber })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('success', data.message);
            switchToLoginTab();
        } else {
            showMessage('error', data.message);
        }
    } catch (error) {
        showMessage('error', 'Signup failed: ' + error.message);
    }
}

function showMessage(type, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.style.padding = '10px';
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.borderRadius = '4px';
    messageDiv.style.color = '#fff';
    messageDiv.style.backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
    messageDiv.textContent = message;
    
    const modalContent = document.querySelector('.modal-content');
    const existingMessage = modalContent.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    modalContent.insertBefore(messageDiv, modalContent.firstChild);
    setTimeout(() => messageDiv.remove(), 3000);
}

function switchToLoginTab() {
    document.querySelector('[data-tab="login"]').click();
}

function updateUIForLoggedInUser(user) {
    const userIcon = document.querySelector('.user-icon');
    userIcon.innerHTML = `<span class="user-initial">${user.email[0].toUpperCase()}</span>`;
}

// Add logout function
function logout() {
    localStorage.removeItem('currentUser');
    authStatus.isLoggedIn = false;
    authStatus.currentUser = null;
    checkLoginState();  // Update UI for logged out state
    const userIcon = document.querySelector('.user-icon');
    userIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#FFD700" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
    `;
}

// Replace the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
});
