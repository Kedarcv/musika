let map;
let deliveryCarMarker;

function initMap() {
    map = L.map('map').setView([-34.397, 150.644], 13); // Set initial view to a default location

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Add a marker for the delivery car
    deliveryCarMarker = L.marker([-34.397, 150.644]).addTo(map); // Initial position of the delivery car
}

function updateDeliveryLocation(lat, lng) {
    // Update the delivery car's position on the map
    deliveryCarMarker.setLatLng([lat, lng]);
    map.setView([lat, lng]);
}

function requestNotificationPermission() {
    if (Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
            }
        });
    }
}

// Simulate delivery location updates (this would be replaced with real-time updates from the server)
setInterval(() => {
    const lat = -34.397 + (Math.random() - 0.5) * 0.05; // Increased range for latitude
    const lng = 150.644 + (Math.random() - 0.5) * 0.05; // Increased range for longitude
    updateDeliveryLocation(lat, lng);
}, 5000); // Update every 5 seconds

// Initialize the map and request notification permission when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    requestNotificationPermission();
});
