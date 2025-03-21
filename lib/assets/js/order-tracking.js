// order-tracking.js

// Function to initialize the map and track delivery
function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: { lat: -34.397, lng: 150.644 }, // Default location
    });

    const carMarker = new google.maps.Marker({
        position: { lat: -34.397, lng: 150.644 },
        map: map,
        icon: 'car_icon.png', // Path to car icon
    });

    // Simulate car movement
    let deliveryLocation = { lat: -34.397, lng: 150.644 };
    setInterval(() => {
        // Update deliveryLocation with real data
        deliveryLocation = getUpdatedLocation(); // Function to get updated location
        carMarker.setPosition(deliveryLocation);
    }, 5000); // Update every 5 seconds
}

// Request notification permission
if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            // Show notifications for updates
            showNotification('Delivery Update', 'Your order is on the way!');
        }
    });
}

// Function to show notifications
function showNotification(title, body) {
    new Notification(title, { body });
}

// Call the initMap function after the Google Maps API is loaded
window.onload = function() {
    initMap();
};
