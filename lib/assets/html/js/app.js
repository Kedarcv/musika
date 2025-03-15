// UI State Management
function setupUI() {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('loginButton').style.display = 'none';
        document.getElementById('signupButton').textContent = 'My Account';
    }
}

function handleBackButton() {
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            // Handle state changes
        }
    });
}

function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cartItems.length;
        cartCount.style.display = cartItems.length > 0 ? 'block' : 'none';
    }
}

function updateUIWithUserState(user) {
    const loginButton = document.getElementById('loginButton');
    const signupButton = document.getElementById('signupButton');
    
    if (user) {
        if (loginButton) loginButton.style.display = 'none';
        if (signupButton) {
            signupButton.textContent = 'My Account';
            signupButton.onclick = () => window.location.href = 'profile.html';
        }
    } else {
        if (loginButton) {
            loginButton.style.display = 'block';
            loginButton.onclick = () => window.location.href = 'login.html';
        }
        if (signupButton) {
            signupButton.textContent = 'Sign up';
            signupButton.onclick = () => window.location.href = 'signup-select.html';
        }
    }
}

// User State Management
class UserState {
    constructor() {
        this.listeners = [];
        this.currentUser = null;
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.currentUser));
    }

    setUser(user) {
        this.currentUser = user;
        this.notifyListeners();
    }

    getUser() {
        return this.currentUser;
    }
}

// Initialize user state
window.userState = new UserState();
