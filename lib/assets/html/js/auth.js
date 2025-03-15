class AuthService {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.listeners = [];
    }

    initialize() {
        try {
            this.auth = firebase.auth();
            return new Promise((resolve) => {
                this.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    this.notifyListeners();
                    resolve(user);
                });
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            throw error;
        }
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentUser));
    }

    async signIn(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    async signUp(email, password) {
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('Sign up error:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Export for use in other files
window.AuthService = AuthService;
