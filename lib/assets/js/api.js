class MusikaAPI {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.clearToken();
                    window.location.href = '/login.html';
                    throw new Error('Authentication required');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        this.setToken(response.token);
        return response;
    }

    async register(name, email, password) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        this.setToken(response.token);
        return response;
    }

    async logout() {
        this.clearToken();
    }

    // Restaurants
    async getRestaurants(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/restaurants?${queryString}`);
    }

    async getRestaurant(id) {
        return await this.request(`/restaurants/${id}`);
    }

    // Addresses
    async getAddresses() {
        return await this.request('/addresses');
    }

    async saveAddress(address) {
        return await this.request('/addresses', {
            method: 'POST',
            body: JSON.stringify(address)
        });
    }

    // Orders
    async getOrders() {
        return await this.request('/orders');
    }

    async placeOrder(order) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(order)
        });
    }

    async getOrderStatus(orderId) {
        return await this.request(`/orders/${orderId}/status`);
    }

    // Reviews
    async submitReview(restaurantId, rating, text) {
        return await this.request('/reviews', {
            method: 'POST',
            body: JSON.stringify({
                restaurant_id: restaurantId,
                rating,
                text
            })
        });
    }

    // Error Handling
    handleError(error) {
        console.error('API Error:', error);
        if (error.message === 'Authentication required') {
            // Handle authentication errors
            window.location.href = '/login.html';
        } else {
            // Handle other errors
            alert('An error occurred. Please try again.');
        }
    }
}
