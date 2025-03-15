class MusikaAPI {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api';
    }

    async getRestaurants(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseUrl}/restaurants?${queryString}`);
        return await response.json();
    }

    async getRestaurantDetails(restaurantId) {
        const response = await fetch(`${this.baseUrl}/restaurants/${restaurantId}`);
        return await response.json();
    }

    async getAddresses(userId) {
        const response = await fetch(`${this.baseUrl}/addresses?user_id=${userId}`);
        return await response.json();
    }

    async saveAddress(addressData) {
        const response = await fetch(`${this.baseUrl}/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(addressData)
        });
        return await response.json();
    }

    async getOrders(userId) {
        const response = await fetch(`${this.baseUrl}/orders?user_id=${userId}`);
        return await response.json();
    }

    async createOrder(orderData) {
        const response = await fetch(`${this.baseUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        return await response.json();
    }

    async createReview(reviewData) {
        const response = await fetch(`${this.baseUrl}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });
        return await response.json();
    }
}

// Export for use in other files
window.MusikaAPI = MusikaAPI;
