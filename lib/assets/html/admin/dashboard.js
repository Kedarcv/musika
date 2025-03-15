// Admin Dashboard Integration
class AdminDashboard {
    constructor() {
        this.baseUrl = '/api';
        this.initializeStats();
        this.initializeCharts();
        this.initializeRecentOrders();
        this.setupEventListeners();
    }

    async initializeStats() {
        try {
            const response = await fetch(`${this.baseUrl}/admin/stats`);
            const stats = await response.json();
            
            document.getElementById('totalOrders').textContent = stats.totalOrders.toLocaleString();
            document.getElementById('activeRestaurants').textContent = stats.activeRestaurants.toLocaleString();
            document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
            document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    async initializeCharts() {
        try {
            const [ordersResponse, revenueResponse] = await Promise.all([
                fetch(`${this.baseUrl}/admin/orders-chart`),
                fetch(`${this.baseUrl}/admin/revenue-chart`)
            ]);

            const ordersData = await ordersResponse.json();
            const revenueData = await revenueResponse.json();

            this.createOrdersChart(ordersData);
            this.createRevenueChart(revenueData);
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    createOrdersChart(data) {
        new Chart(document.getElementById('ordersChart'), {
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

    createRevenueChart(data) {
        new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Revenue',
                    data: data.values,
                    borderColor: 'rgb(255, 99, 132)',
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

    async initializeRecentOrders() {
        try {
            const response = await fetch(`${this.baseUrl}/admin/recent-orders`);
            const orders = await response.json();
            
            const tbody = document.getElementById('recentOrders');
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">${order.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${order.customer}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${order.restaurant}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs rounded-full ${this.getStatusClass(order.status)}">
                            ${order.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${order.total}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error fetching recent orders:', error);
        }
    }

    getStatusClass(status) {
        const statusClasses = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'In Progress': 'bg-blue-100 text-blue-800',
            'Delivered': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800'
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

    async handleNavigation(section) {
        // Handle navigation to different sections
        console.log(`Navigating to ${section}`);
        // Implement navigation logic here
    }

    // Auto-refresh data every 5 minutes
    startAutoRefresh() {
        setInterval(() => {
            this.initializeStats();
            this.initializeRecentOrders();
        }, 300000);
    }
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new AdminDashboard();
    dashboard.startAutoRefresh();
});
