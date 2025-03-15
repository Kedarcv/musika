class LocationManager {
    constructor() {
        this.map = null;
        this.marker = null;
        this.geocoder = null;
        this.currentLocation = null;
        this.addressInput = null;
        this.onLocationSelected = null;
        this.confirmButton = null;
    }

    init(addressInputId, useAutocomplete = true, onLocationSelected = null) {
        try {
            if (!window.google || !google.maps) {
                throw new Error('Google Maps not loaded');
            }

            this.addressInput = document.getElementById(addressInputId);
            this.onLocationSelected = onLocationSelected;
            this.geocoder = new google.maps.Geocoder();

            if (useAutocomplete) {
                this.setupAutocomplete();
            }

            return true;
        } catch (error) {
            console.error('LocationManager initialization error:', error);
            return false;
        }
    }

    initMap() {
        try {
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                throw new Error('Map element not found');
            }

            // Create map container with confirm button
            const mapContainer = document.createElement('div');
            mapContainer.style.position = 'relative';
            mapContainer.appendChild(mapElement);

            // Create confirm button
            this.confirmButton = document.createElement('button');
            this.confirmButton.textContent = 'Confirm Location';
            this.confirmButton.className = 'absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 z-10';
            this.confirmButton.style.display = 'none';
            mapContainer.appendChild(this.confirmButton);

            // Replace map element with container
            mapElement.parentNode.replaceChild(mapContainer, mapElement);
            mapContainer.appendChild(mapElement);

            this.map = new google.maps.Map(mapElement, {
                zoom: 13,
                center: { lat: -17.824858, lng: 31.053028 }, // Default to Harare
                mapTypeControl: false,
                streetViewControl: false
            });

            this.marker = new google.maps.Marker({
                map: this.map,
                draggable: true
            });

            this.setupMarkerDrag();
            this.setupConfirmButton();
            return true;
        } catch (error) {
            console.error('Map initialization error:', error);
            return false;
        }
    }

    setupAutocomplete() {
        if (!this.addressInput) return;

        const autocomplete = new google.maps.places.Autocomplete(this.addressInput, {
            componentRestrictions: { country: 'ZW' }
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;

            this.updateLocation(place.geometry.location, place.formatted_address);
        });
    }

    setupMarkerDrag() {
        if (!this.marker) return;

        this.marker.addListener('dragend', () => {
            const position = this.marker.getPosition();
            this.geocodePosition(position);
        });
    }

    setupConfirmButton() {
        if (!this.confirmButton) return;

        // Show button when location is selected
        this.map.addListener('click', (event) => {
            const position = event.latLng;
            this.marker.setPosition(position);
            this.geocodePosition(position);
            this.confirmButton.style.display = 'block';
        });

        this.marker.addListener('dragend', () => {
            this.confirmButton.style.display = 'block';
        });

        // Handle confirm button click
        this.confirmButton.addEventListener('click', () => {
            const position = this.marker.getPosition();
            if (position) {
                this.geocodePosition(position).then(() => {
                    if (this.onLocationSelected) {
                        this.onLocationSelected(this.currentLocation);
                    }
                    this.confirmButton.style.display = 'none';
                });
            }
        });
    }

    handlePlaceSelection(place) {
        if (!place || !place.geometry) return;
        this.updateLocation(place.geometry.location, place.formatted_address);
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            throw new Error('Geolocation not supported');
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });

            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            await this.geocodePosition(location);
            return this.currentLocation;
        } catch (error) {
            console.error('Error getting current location:', error);
            throw error;
        }
    }

    async geocodePosition(position) {
        if (!this.geocoder) {
            this.geocoder = new google.maps.Geocoder();
        }

        try {
            const results = await new Promise((resolve, reject) => {
                this.geocoder.geocode({ location: position }, (results, status) => {
                    if (status === 'OK') resolve(results);
                    else reject(new Error(`Geocoding failed: ${status}`));
                });
            });

            if (results[0]) {
                this.updateLocation(position, results[0].formatted_address);
                return results[0];
            }
            throw new Error('No results found');
        } catch (error) {
            console.error('Geocoding error:', error);
            throw error;
        }
    }

    updateLocation(position, address) {
        // Update map and marker if they exist
        if (this.map && this.marker) {
            this.map.setCenter(position);
            this.marker.setPosition(position);
            if (this.confirmButton) {
                this.confirmButton.style.display = 'block';
            }
        }
        
        // Update input field if it exists
        if (this.addressInput) {
            this.addressInput.value = address;
        }

        // Store current location
        this.currentLocation = {
            lat: typeof position.lat === 'function' ? position.lat() : position.lat,
            lng: typeof position.lng === 'function' ? position.lng() : position.lng,
            address: address
        };
    }

    getLastLocation() {
        try {
            const lastLocation = localStorage.getItem('lastLocation');
            return lastLocation ? JSON.parse(lastLocation) : null;
        } catch (error) {
            console.error('Error getting last location:', error);
            return null;
        }
    }

    async searchAddress(address) {
        if (!this.geocoder) {
            this.geocoder = new google.maps.Geocoder();
        }

        try {
            const results = await new Promise((resolve, reject) => {
                this.geocoder.geocode({ address }, (results, status) => {
                    if (status === 'OK') resolve(results);
                    else reject(new Error(`Address search failed: ${status}`));
                });
            });

            if (results[0]) {
                this.updateLocation(results[0].geometry.location, results[0].formatted_address);
                return results[0];
            }
            throw new Error('No results found');
        } catch (error) {
            console.error('Address search error:', error);
            throw error;
        }
    }
}

// Export for use in other files
window.LocationManager = LocationManager;
