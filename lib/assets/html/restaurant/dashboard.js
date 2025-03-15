// Restaurant Dashboard Integration
class RestaurantDashboard {
    constructor() {
        this.baseUrl = '/api';
        this.initializeStats();
        this.initializeCharts();
        this.initializeActiveOrders();
        this.initializeReviews();
        this.setupEventListeners();
        this.setupWebSocket();
    }

    async initializeStats() {
        try {
            const response = await fetch(`${this.baseUrl}/restaurant/stats`);
            const stats = await response.json();
            
            document.getElementById('todayOrders').textContent = stats.todayOrders.toLocaleString();
            document.getElementById('menuItems').textContent = stats.menuItems.toLocaleString();
            document.getElementById('rating').textContent = stats.rating.toFixed(1);
            document.getElementById('todayRevenue').textContent = `$${stats.todayRevenue.toLocaleString()}`;
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    async initializeCharts() {
        try {
            const [weeklyResponse, popularResponse] = await Promise.all([
                fetch(`${this.baseUrl}/restaurant/weekly-orders`),
                fetch(`${this.baseUrl}/restaurant/popular-items`)
            ]);

            const weeklyData = await weeklyResponse.json();
            const popularData = await popularResponse.json();

            this.createWeeklyOrdersChart(weeklyData);
            this.createPopularItemsChart(popularData);
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    createWeeklyOrdersChart(data) {
        new Chart(document.getElementById('weeklyOrdersChart'), {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Orders',
                    data: data.values,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    createPopularItemsChart(data) {
        new Chart(document.getElementById('popularItemsChart'), {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Orders',
                    data: data.values,
                    backgroundColor: 'rgb(255, 99, 132)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }

    async initializeActiveOrders() {
        try {
            const response = await fetch(`${this.baseUrl}/restaurant/active-orders`);
            const orders = await response.json();
            
            const container = document.getElementById('activeOrders');
            container.innerHTML = orders.map(order => this.createOrderCard(order)).join('');
            
            // Add event listeners to update buttons
            container.querySelectorAll('.update-status-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const orderId = e.currentTarget.dataset.orderId;
                    this.showUpdateStatusModal(orderId);
                });
            });
        } catch (error) {
            console.error('Error fetching active orders:', error);
        }
    }

    createOrderCard(order) {
        return `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-bold">Order #${order.id}</h4>
                    <span class="px-2 py-1 text-xs rounded-full ${this.getStatusClass(order.status)}">
                        ${order.status}
                    </span>
                </div>
                <p class="text-gray-600 mb-2">${order.customer}</p>
                <ul class="text-sm text-gray-500 mb-4">
                    ${order.items.map(item => `<li>${item}</li>`).join('')}
                </ul>
                <div class="flex justify-between items-center">
                    <span class="font-bold">${order.total}</span>
                    <button class="update-status-btn px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            data-order-id="${order.id}">
                        Update Status
                    </button>
                </div>
            </div>
        `;
    }

    async initializeReviews() {
        try {
            const response = await fetch(`${this.baseUrl}/restaurant/recent-reviews`);
            const reviews = await response.json();
            
            const container = document.getElementById('recentReviews');
            container.innerHTML = reviews.map(review => this.createReviewCard(review)).join('');
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    }

    createReviewCard(review) {
        return `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-bold">${review.customer}</h4>
                    <div class="flex items-center">
                        <span class="text-yellow-400">
                            ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                        </span>
                        <span class="text-sm text-gray-500 ml-2">${review.rating}/5</span>
                    </div>
                </div>
                <p class="text-gray-600 mb-2">${review.text}</p>
                <p class="text-sm text-gray-500">${review.date}</p>
            </div>
        `;
    }

    getStatusClass(status) {
        const statusClasses = {
            'New': 'bg-blue-100 text-blue-800',
            'Preparing': 'bg-yellow-100 text-yellow-800',
            'Ready': 'bg-green-100 text-green-800',
            'Delivered': 'bg-gray-100 text-gray-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }

    setupEventListeners() {
        // Add event listeners for sidebar navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.querySelector('span').textContent.toLowerCase();
                this.handleNavigation(section);
            });
        });
    }

    setupWebSocket() {
        // Set up WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:5000/ws/restaurant');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'new_order':
                    this.handleNewOrder(data.order);
                    break;
                case 'order_status_update':
                    this.handleOrderStatusUpdate(data.order);
                    break;
                case 'new_review':
                    this.handleNewReview(data.review);
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed. Retrying in 5 seconds...');
            setTimeout(() => this.setupWebSocket(), 5000);
        };
    }

    handleNewOrder(order) {
        const container = document.getElementById('activeOrders');
        const card = document.createElement('div');
        card.innerHTML = this.createOrderCard(order);
        container.insertBefore(card.firstChild, container.firstChild);
        
        // Update stats
        const todayOrders = document.getElementById('todayOrders');
        todayOrders.textContent = (parseInt(todayOrders.textContent) + 1).toString();
    }

    handleOrderStatusUpdate(order) {
        const orderCard = document.querySelector(`[data-order-id="${order.id}"]`).closest('.bg-white');
        if (orderCard) {
            orderCard.outerHTML = this.createOrderCard(order);
        }
    }

    handleNewReview(review) {
        const container = document.getElementById('recentReviews');
        const card = document.createElement('div');
        card.innerHTML = this.createReviewCard(review);
        container.insertBefore(card.firstChild, container.firstChild);
        
        // Update rating
        this.initializeStats(); // Refresh all stats to get new average rating
    }

    async handleNavigation(section) {
        // Handle navigation to different sections
        console.log(`Navigating to ${section}`);
        // Implement navigation logic here
    }

    showUpdateStatusModal(orderId) {
        // Implement status update modal
        console.log(`Showing status update modal for order ${orderId}`);
    }

    // Auto-refresh data every 5 minutes
    startAutoRefresh() {
        setInterval(() => {
            this.initializeStats();
            this.initializeActiveOrders();
            this.initializeReviews();
        }, 300000);
    }
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new RestaurantDashboard();
    dashboard.startAutoRefresh();
});
