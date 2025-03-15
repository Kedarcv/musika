class LocationManager {
    constructor() {
        this.map = null;
        this.marker = null;
        this.geocoder = null;
        this.currentLocation = null;
        this.onLocationSelected = null;
        this.STORAGE_KEY = 'musika_last_location';
    }

    async init(mapElementId, addressInputId = null, onLocationSelected = null) {
        this.onLocationSelected = onLocationSelected;
        this.geocoder = new google.maps.Geocoder();

        // Default to Zimbabwe center
        const defaultLocation = { lat: -17.824858, lng: 31.053028 };
        
        // Initialize map
        this.map = new google.maps.Map(document.getElementById(mapElementId), {
            center: defaultLocation,
            zoom: 13,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });

        // Initialize marker
        this.marker = new google.maps.Marker({
            map: this.map,
            draggable: true,
            animation: google.maps.Animation.DROP
        });

        // Set up marker drag event
        this.marker.addListener('dragend', () => {
            const position = this.marker.getPosition();
            this.updateLocationFromLatLng(position.lat(), position.lng());
        });

        // Set up map click event
        this.map.addListener('click', (event) => {
            this.marker.setPosition(event.latLng);
            this.updateLocationFromLatLng(event.latLng.lat(), event.latLng.lng());
        });

        // Initialize address input if provided
        if (addressInputId) {
            const input = document.getElementById(addressInputId);
            const autocomplete = new google.maps.places.Autocomplete(input, {
                componentRestrictions: { country: ['zw'] }
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    const location = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address
                    };
                    this.updateLocation(location);
                }
            });
        }

        // Try to get user's location
        try {
            await this.getCurrentLocation();
        } catch (error) {
            console.warn('Could not get current location:', error);
            // Use last saved location or default
            const lastLocation = this.getLastLocation();
            if (lastLocation) {
                this.updateLocation(lastLocation);
            } else {
                this.updateLocationFromLatLng(defaultLocation.lat, defaultLocation.lng);
            }
        }
    }

    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        await this.updateLocationFromLatLng(
                            position.coords.latitude,
                            position.coords.longitude
                        );
                        resolve(this.currentLocation);
                    } catch (error) {
                        reject(error);
                    }
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    }

    async updateLocationFromLatLng(lat, lng) {
        try {
            const results = await this.geocodePosition(lat, lng);
            if (results && results.length > 0) {
                const location = {
                    lat: lat,
                    lng: lng,
                    address: results[0].formatted_address
                };
                this.updateLocation(location);
            }
        } catch (error) {
            console.error('Error updating location:', error);
            throw error;
        }
    }

    updateLocation(location) {
        this.currentLocation = location;
        
        // Update map and marker
        const latLng = new google.maps.LatLng(location.lat, location.lng);
        this.map.setCenter(latLng);
        this.marker.setPosition(latLng);

        // Save to local storage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(location));

        // Call callback if provided
        if (this.onLocationSelected) {
            this.onLocationSelected(location);
        }
    }

    async geocodePosition(lat, lng) {
        return new Promise((resolve, reject) => {
            this.geocoder.geocode(
                { location: { lat, lng } },
                (results, status) => {
                    if (status === 'OK') {
                        resolve(results);
                    } else {
                        reject(new Error('Geocoder failed: ' + status));
                    }
                }
            );
        });
    }

    getLastLocation() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    clearLastLocation() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    // Calculate distance between two points in kilometers
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI/180);
    }

    // Check if a location is within delivery radius
    isWithinDeliveryRadius(restaurantLat, restaurantLng, deliveryRadiusKm) {
        if (!this.currentLocation) return false;
        
        const distance = this.calculateDistance(
            this.currentLocation.lat,
            this.currentLocation.lng,
            restaurantLat,
            restaurantLng
        );
        
        return distance <= deliveryRadiusKm;
    }
}
