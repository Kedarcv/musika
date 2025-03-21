// Restaurant Dashboard Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard components
    initializeOrderManagement();
    initializeMenuManagement();
    initializeAnalytics();
    initializeSettings();
    
    // Load initial data
    loadPendingOrders();
    loadRestaurantStats();
});

// Order Management
function initializeOrderManagement() {
    const orderTabs = document.querySelectorAll('.order-tab');
    if (orderTabs) {
        orderTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const status = this.getAttribute('data-status');
                document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                loadOrdersByStatus(status);
            });
        });
    }
    
    // Initialize order action buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('accept-order-btn')) {
            acceptOrder(e.target.getAttribute('data-order-id'));
        } else if (e.target.classList.contains('reject-order-btn')) {
            rejectOrder(e.target.getAttribute('data-order-id'));
        } else if (e.target.classList.contains('complete-order-btn')) {
            completeOrder(e.target.getAttribute('data-order-id'));
        } else if (e.target.classList.contains('assign-driver-btn')) {
            showDriverAssignmentModal(e.target.getAttribute('data-order-id'));
        }
    });
}

function loadOrdersByStatus(status) {
    const ordersContainer = document.getElementById('orders-container');
    if (!ordersContainer) return;
    
    // Show loading state
    ordersContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Fetch orders by status from API
    fetch(`/api/restaurant/orders?status=${status}`, {
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.orders && data.orders.length > 0) {
            let ordersHTML = '';
            data.orders.forEach(order => {
                ordersHTML += generateOrderCard(order);
            });
            ordersContainer.innerHTML = ordersHTML;
        } else {
            ordersContainer.innerHTML = '<div class="alert alert-info">No orders found with this status.</div>';
        }
    })
    .catch(error => {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = '<div class="alert alert-danger">Failed to load orders. Please try again.</div>';
    });
}

function generateOrderCard(order) {
    const statusBadgeClass = getStatusBadgeClass(order.status);
    let actionButtons = '';
    
    if (order.status === 'pending') {
        actionButtons = `
            <button class="btn btn-success btn-sm accept-order-btn" data-order-id="${order.id}">Accept</button>
            <button class="btn btn-danger btn-sm reject-order-btn" data-order-id="${order.id}">Reject</button>
        `;
    } else if (order.status === 'accepted') {
        actionButtons = `
            <button class="btn btn-primary btn-sm assign-driver-btn" data-order-id="${order.id}">Assign Driver</button>
            <button class="btn btn-success btn-sm complete-order-btn" data-order-id="${order.id}">Mark Ready</button>
        `;
    } else if (order.status === 'ready') {
        actionButtons = `
            <button class="btn btn-info btn-sm" disabled>Awaiting Pickup</button>
        `;
    }
    
    return `
        <div class="card mb-3 order-card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span>Order #${order.id}</span>
                <span class="badge ${statusBadgeClass}">${order.status.toUpperCase()}</span>
            </div>
            <div class="card-body">
                <p><strong>Customer:</strong> ${order.customer.name}</p>
                <p><strong>Time:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <div class="order-items mt-3">
                    <h6>Items:</h6>
                    <ul class="list-group">
                        ${order.items.map(item => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${item.quantity} x ${item.name}
                                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="mt-3 d-flex justify-content-end">
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'pending': return 'bg-warning';
        case 'accepted': return 'bg-primary';
        case 'preparing': return 'bg-info';
        case 'ready': return 'bg-success';
        case 'delivered': return 'bg-success';
        case 'rejected': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function acceptOrder(orderId) {
    updateOrderStatus(orderId, 'accepted');
}

function rejectOrder(orderId) {
    if (confirm('Are you sure you want to reject this order?')) {
        updateOrderStatus(orderId, 'rejected');
    }
}

function completeOrder(orderId) {
    updateOrderStatus(orderId, 'ready');
}

function updateOrderStatus(orderId, status) {
    fetch(`/api/restaurant/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Success', `Order #${orderId} has been ${status}`, 'success');
            // Reload current tab
            const activeTab = document.querySelector('.order-tab.active');
            if (activeTab) {
                loadOrdersByStatus(activeTab.getAttribute('data-status'));
            }
        } else {
            showToast('Error', data.message || 'Failed to update order status', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating order status:', error);
        showToast('Error', 'Failed to update order status. Please try again.', 'error');
    });
}

function showDriverAssignmentModal(orderId) {
    // Fetch available drivers
    fetch('/api/restaurant/drivers/available', {
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.drivers && data.drivers.length > 0) {
            let driversOptions = '';
            data.drivers.forEach(driver => {
                driversOptions += `<option value="${driver.id}">${driver.name} (${driver.vehicle})</option>`;
            });
            
            const modalHTML = `
                <div class="modal fade" id="assignDriverModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Assign Driver to Order #${orderId}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="assign-driver-form">
                                    <div class="mb-3">
                                        <label for="driver-select" class="form-label">Select Driver</label>
                                        <select class="form-select" id="driver-select" required>
                                            <option value="">Choose a driver...</option>
                                            ${driversOptions}
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="confirm-assign-driver">Assign Driver</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Append modal to body if it doesn't exist
            if (!document.getElementById('assignDriverModal')) {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            }
            
            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('assignDriverModal'));
            modal.show();
            
            // Handle driver assignment
            document.getElementById('confirm-assign-driver').addEventListener('click', function() {
                const driverId = document.getElementById('driver-select').value;
                if (driverId) {
                    assignDriverToOrder(orderId, driverId, modal);
                } else {
                    alert('Please select a driver');
                }
            });
        } else {
            showToast('No Drivers', 'No available drivers found. Please try again later.', 'warning');
        }
    })
    .catch(error => {
        console.error('Error fetching drivers:', error);
        showToast('Error', 'Failed to load available drivers. Please try again.', 'error');
    });
}

function assignDriverToOrder(orderId, driverId, modal) {
    fetch(`/api/restaurant/orders/${orderId}/assign-driver`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ driver_id: driverId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            modal.hide();
            showToast('Success', `Driver assigned to order #${orderId}`, 'success');
            // Reload current tab
            const activeTab = document.querySelector('.order-tab.active');
            if (activeTab) {
                loadOrdersByStatus(activeTab.getAttribute('data-status'));
            }
        } else {
            showToast('Error', data.message || 'Failed to assign driver', 'error');
        }
    })
    .catch(error => {
        console.error('Error assigning driver:', error);
        showToast('Error', 'Failed to assign driver. Please try again.', 'error');
    });
}

// Menu Management
function initializeMenuManagement() {
    loadMenuCategories();
    loadMenuItems();
    
    // Initialize add/edit menu item form
    const addItemForm = document.getElementById('add-menu-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            saveMenuItem(formData);
        });
    }
    
    // Initialize add category button
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            const categoryName = prompt('Enter new category name:');
            if (categoryName) {
                addMenuCategory(categoryName);
            }
        });
    }
    
    // Handle edit and delete buttons for menu items
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-menu-item')) {
            const itemId = e.target.getAttribute('data-item-id');
            editMenuItem(itemId);
        } else if (e.target.classList.contains('delete-menu-item')) {
            const itemId = e.target.getAttribute('data-item-id');
            if (confirm('Are you sure you want to delete this menu item?')) {
                deleteMenuItem(itemId);
            }
        }
    });
}

function loadMenuCategories() {
    const categoriesContainer = document.getElementById('menu-categories');
    const categorySelect = document.getElementById('item-category');
    if (!categoriesContainer && !categorySelect) return;
    
    fetch('/api/restaurant/menu/categories', {
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.categories && data.categories.length > 0) {
            // Update categories list
            if (categoriesContainer) {
                let categoriesHTML = '';
                data.categories.forEach(category => {
                    categoriesHTML += `
                        <div class="category-item d-flex justify-content-between align-items-center mb-2">
                            <span>${category.name}</span>
                            <div>
                                <button class="btn btn-sm btn-outline-primary edit-category" data-category-id="${category.id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-category" data-category-id="${category.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                categoriesContainer.innerHTML = categoriesHTML;
            }
            
            // Update category dropdown in add/edit form
            if (categorySelect) {
                let optionsHTML = '<option value="">Select a category</option>';
                data.categories.forEach(category => {
                    optionsHTML += `<option value="${category.id}">${category.name}</option>`;
                });
                categorySelect.innerHTML = optionsHTML;
            }
        } else {
            if (categoriesContainer) {
                categoriesContainer.innerHTML = '<div class="alert alert-info">No categories found. Add your first category!</div>';
            }
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">No categories available</option>';
            }
        }
    })
    .catch(error => {
        console.error('Error loading menu categories:', error);
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '<div class="alert alert-danger">Failed to load categories. Please try again.</div>';
        }
    });
}

function addMenuCategory(categoryName) {
    fetch('/api/restaurant/menu/categories', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
