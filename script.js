/**
 * Coffee Explorer - JavaScript Functionality
 * Using Leaflet.js and OpenStreetMap for coffee shop discovery
 */

// Global Variables
let map;
let markers = [];
let cafes = [];
let userLocation = null;
let currentCarouselIndex = 0;
let currentPage = 1;
let itemsPerPage = 9;
let filteredCafes = [];

// Coffee shop mock data with realistic coordinates around major cities
const mockCafes = [
    // New York City Area
    {
        name: "The Roasted Bean",
        lat: 40.7589,
        lng: -73.9851,
        address: "123 Coffee Street, New York, NY",
        rating: 4.5,
        specialty: "coffee",
        description: "Artisanal coffee roasted on-site daily with single-origin beans",
        hours: "6:00 AM - 8:00 PM",
        isOpen: true,
        phone: "(555) 123-4567"
    },
    {
        name: "Brew & Beans Cafe",
        lat: 40.7614,
        lng: -73.9776,
        address: "456 Latte Avenue, New York, NY",
        rating: 4.2,
        specialty: "cafe",
        description: "Cozy atmosphere with fresh pastries and specialty drinks",
        hours: "7:00 AM - 9:00 PM",
        isOpen: true,
        phone: "(555) 234-5678"
    },
    {
        name: "Espresso Central",
        lat: 40.7505,
        lng: -73.9934,
        address: "789 Cappuccino Lane, New York, NY",
        rating: 4.7,
        specialty: "coffee",
        description: "Premium espresso bar with award-winning baristas",
        hours: "5:30 AM - 7:00 PM",
        isOpen: false,
        phone: "(555) 345-6789"
    },
    {
        name: "Morning Glory Bakery",
        lat: 40.7484,
        lng: -73.9857,
        address: "321 Fresh Bread Road, New York, NY",
        rating: 4.3,
        specialty: "bakery",
        description: "Fresh coffee and homemade pastries baked daily",
        hours: "6:30 AM - 3:00 PM",
        isOpen: true,
        phone: "(555) 456-7890"
    },
    {
        name: "Dark Roast Roastery",
        lat: 40.7549,
        lng: -73.9707,
        address: "654 Roast Street, New York, NY",
        rating: 4.6,
        specialty: "roastery",
        description: "Local roastery specializing in custom blends and single origins",
        hours: "8:00 AM - 6:00 PM",
        isOpen: true,
        phone: "(555) 567-8901"
    },
    // London Area (for testing location search)
    {
        name: "London Coffee House",
        lat: 51.5074,
        lng: -0.1278,
        address: "Baker Street, London, UK",
        rating: 4.4,
        specialty: "cafe",
        description: "Traditional British coffee house with modern twist",
        hours: "7:00 AM - 8:00 PM",
        isOpen: true,
        phone: "+44 20 1234 5678"
    },
    // Paris Area
    {
        name: "Café de Paris",
        lat: 48.8566,
        lng: 2.3522,
        address: "Champs-Élysées, Paris, France",
        rating: 4.1,
        specialty: "cafe",
        description: "Classic Parisian café experience with excellent coffee",
        hours: "6:00 AM - 10:00 PM",
        isOpen: true,
        phone: "+33 1 23 45 67 89"
    }
];

// Initialize the application when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    startCarouselAutoplay();
    addEventListeners();
});

/**
 * Initialize the main application
 */
function initializeApp() {
    initMap();
    setupFactAnimation();
    showToast('Welcome to Coffee Explorer! ☕', 'success');
}

/**
 * Initialize the Leaflet map
 */
function initMap() {
    try {
        // Default to New York City
        const defaultLocation = [40.7589, -73.9851];
        
        map = L.map('map', {
            zoomControl: false,
            attributionControl: true
        }).setView(defaultLocation, 13);

        // Add custom zoom control
        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Try to get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = [position.coords.latitude, position.coords.longitude];
                    map.setView(userLocation, 13);
                    
                    // Add user location marker
                    addUserLocationMarker(userLocation);
                    
                    // Auto-search nearby cafes after a delay
                    setTimeout(() => {
                        searchNearbyPlaces(userLocation);
                    }, 1000);
                    
                    showToast('Location found! Searching for nearby cafes...', 'success');
                },
                (error) => {
                    console.log('Geolocation failed:', error);
                    // Load default cafes for demo
                    loadMockCafes(defaultLocation);
                    showToast('Using default location. Click "Near Me" to use your location.', 'info');
                }
            );
        } else {
            loadMockCafes(defaultLocation);
            showToast('Geolocation not supported. Showing default location.', 'info');
        }
    } catch (error) {
        console.error('Map initialization error:', error);
        showToast('Map failed to load. Please refresh the page.', 'error');
    }
}

/**
 * Add user location marker to map
 */
function addUserLocationMarker(location) {
    const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: '<div style="background: #667eea; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    L.marker(location, { icon: userIcon })
        .addTo(map)
        .bindPopup('<div style="text-align: center; font-weight: bold; color: #3C2415; padding: 5px;">📍 Your Location</div>');
}

/**
 * Load mock cafes for demonstration
 */
function loadMockCafes(centerLocation) {
    // Filter cafes near the center location (within reasonable distance)
    const nearbyCafes = mockCafes.filter(cafe => {
        const distance = calculateDistance(centerLocation[0], centerLocation[1], cafe.lat, cafe.lng);
        return distance < 50; // Within 50km for demo purposes
    });
    
    if (nearbyCafes.length === 0) {
        // If no nearby cafes, use the first few cafes and add some randomization
        const baseCafes = mockCafes.slice(0, 5).map(cafe => ({
            ...cafe,
            lat: centerLocation[0] + (Math.random() - 0.5) * 0.02,
            lng: centerLocation[1] + (Math.random() - 0.5) * 0.02
        }));
        displayCafes(baseCafes);
    } else {
        displayCafes(nearbyCafes);
    }
}

/**
 * Search for cafes by location input
 */
async function searchCafes() {
    const locationInput = document.getElementById('locationInput').value.trim();
    
    if (!locationInput) {
        showToast('Please enter a location to search', 'error');
        return;
    }

    showLoadingOverlay(true);
    
    try {
        // Use Nominatim API for geocoding (free alternative to Google Geocoding)
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}&limit=1`;
        
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.length > 0) {
            const location = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            map.setView(location, 13);
            
            // Clear previous user marker and add new one
            clearUserMarker();
            addUserLocationMarker(location);
            
            searchNearbyPlaces(location);
            showToast(`Found location: ${data[0].display_name.split(',').slice(0, 2).join(', ')}`, 'success');
        } else {
            throw new Error('Location not found');
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        showToast('Location not found. Please try a different search term.', 'error');
        
        // Fallback: show default cafes
        const defaultLocation = [40.7589, -73.9851];
        map.setView(defaultLocation, 13);
        loadMockCafes(defaultLocation);
    }
    
    showLoadingOverlay(false);
}

/**
 * Find cafes near user's current location
 */
function findNearby() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }

    showLoadingOverlay(true);
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = [position.coords.latitude, position.coords.longitude];
            map.setView(userLocation, 14);
            
            clearUserMarker();
            addUserLocationMarker(userLocation);
            
            searchNearbyPlaces(userLocation);
            showToast('Found your location! Searching nearby...', 'success');
            showLoadingOverlay(false);
        },
        (error) => {
            console.error('Geolocation error:', error);
            showToast('Unable to get your location. Please check location permissions.', 'error');
            showLoadingOverlay(false);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

/**
 * Search for nearby places (mock implementation)
 */
function searchNearbyPlaces(location) {
    showLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
        // Create some mock cafes around the location
        const nearbyMockCafes = generateNearbyMockCafes(location);
        displayCafes(nearbyMockCafes);
        showLoading(false);
    }, 1500);
}

/**
 * Generate mock cafes around a given location
 */
function generateNearbyMockCafes(centerLocation) {
    const cafeNames = [
        "The Coffee Corner", "Bean There Done That", "Grind Coffee Co.", 
        "Steam & Beans", "Café Mocha", "The Daily Grind", "Roast Masters",
        "Brew House", "Coffee Culture", "The Espresso Bar", "Latte Art Café",
        "French Press Bistro", "Cold Brew Corner", "Artisan Roasters"
    ];
    
    const descriptions = [
        "Cozy neighborhood coffee shop with artisanal brews",
        "Modern café featuring locally sourced beans",
        "Traditional coffeehouse with fresh pastries",
        "Specialty coffee roasters with unique blends",
        "Hip café with great atmosphere and WiFi",
        "Family-owned coffee shop serving since 1995",
        "Eco-friendly café with organic options",
        "Drive-through coffee with quick service",
        "Coffee and bookstore combination",
        "Artisanal coffee with handcrafted drinks"
    ];
    
    const mockCafes = [];
    const numCafes = Math.floor(Math.random() * 8) + 7; // 7-15 cafes
    
    for (let i = 0; i < numCafes; i++) {
        // Generate random coordinates within ~2km radius
        const latOffset = (Math.random() - 0.5) * 0.02; // ~2km
        const lngOffset = (Math.random() - 0.5) * 0.02;
        
        const cafe = {
            name: cafeNames[Math.floor(Math.random() * cafeNames.length)],
            lat: centerLocation[0] + latOffset,
            lng: centerLocation[1] + lngOffset,
            address: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Oak', 'Pine', 'Maple', 'Coffee', 'Bean'][Math.floor(Math.random() * 6)]} Street`,
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
            specialty: ['coffee', 'cafe', 'bakery', 'roastery'][Math.floor(Math.random() * 4)],
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            hours: "7:00 AM - 6:00 PM",
            isOpen: Math.random() > 0.3, // 70% chance open
            phone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            distance: Math.round(Math.random() * 2000 + 200) // 200m - 2.2km
        };
        
        mockCafes.push(cafe);
    }
    
    return mockCafes;
}

/**
 * Display cafes on map and in results
 */
function displayCafes(cafeList) {
    cafes = cafeList;
    filteredCafes = [...cafes];
    
    // Add distance calculation if user location is available
    if (userLocation) {
        filteredCafes.forEach(cafe => {
            cafe.distance = calculateDistance(
                userLocation[0], userLocation[1], 
                cafe.lat, cafe.lng
            );
        });
    }
    
    applyFilters();
    addMarkersToMap(filteredCafes);
    updateResultsStats();
}

/**
 * Apply current filters and sorting
 */
function applyFilters() {
    const specialtyFilter = document.getElementById('specialtyFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    
    // Apply specialty filter
    filteredCafes = cafes.filter(cafe => {
        if (specialtyFilter && cafe.specialty !== specialtyFilter) {
            return false;
        }
        return true;
    });
    
    // Apply sorting
    switch (sortFilter) {
        case 'distance':
            if (userLocation) {
                filteredCafes.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            }
            break;
        case 'name':
            filteredCafes.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rating':
            filteredCafes.sort((a, b) => b.rating - a.rating);
            break;
    }
    
    currentPage = 1;
    displayResults();
    updatePagination();
}

/**
 * Display results in the results section
 */
function displayResults() {
    const resultsDiv = document.getElementById('results');
    
    if (filteredCafes.length === 0) {
        resultsDiv.innerHTML = `
            <div class="loading">
                <div style="font-size: 3rem; margin-bottom: 20px;">😔</div>
                <div class="loading-text">No coffee shops found</div>
                <div class="loading-subtext">Try adjusting your filters or search in a different area</div>
            </div>
        `;
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredCafes.slice(startIndex, endIndex);
    
    const cafeCards = pageItems.map((cafe, index) => {
        const rating = cafe.rating || 'N/A';
        const stars = rating !== 'N/A' ? generateStarRating(rating) : 'No rating';
        const distance = cafe.distance ? `${cafe.distance.toFixed(1)} km away` : '';
        const isOpen = cafe.isOpen;
        const statusText = isOpen !== undefined ? (isOpen ? 'Open now' : 'Closed') : 'Hours unknown';
        const statusClass = isOpen !== undefined ? (isOpen ? 'open' : 'closed') : '';
        
        return `
            <div class="cafe-card-result slide-up" onclick="selectCafe(${startIndex + index})" style="animation-delay: ${index * 0.1}s">
                <div class="cafe-name">${cafe.name}</div>
                <div class="cafe-rating">
                    <span class="stars">${stars}</span>
                    <span class="rating-text">(${rating})</span>
                </div>
                <div class="cafe-address">📍 ${cafe.address}</div>
                <div class="cafe-description">${cafe.description}</div>
                <div class="cafe-details">
                    <span class="cafe-specialty">${cafe.specialty}</span>
                    ${distance ? `<span class="cafe-distance">${distance}</span>` : ''}
                    <span class="cafe-status ${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
    
    resultsDiv.innerHTML = `<div class="cafe-grid">${cafeCards}</div>`;
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + 
           (halfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
}

/**
 * Add markers to the map
 */
function addMarkersToMap(cafeList) {
    clearMarkers();
    
    cafeList.forEach((cafe, index) => {
        const isOpen = cafe.isOpen;
        const markerColor = isOpen ? '#8B4513' : '#dc3545';
        
        const customIcon = L.divIcon({
            className: 'custom-coffee-marker',
            html: `<div style="background: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.3); cursor: pointer; transition: all 0.3s ease;">☕</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        const marker = L.marker([cafe.lat, cafe.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(createPopupContent(cafe))
            .on('click', () => selectCafe(filteredCafes.indexOf(cafe)));
        
        markers.push(marker);
    });
    
    // Fit map to show all markers if there are any
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

/**
 * Create popup content for map markers
 */
function createPopupContent(cafe) {
    const stars = generateStarRating(cafe.rating);
    const statusClass = cafe.isOpen ? 'open' : 'closed';
    const statusText = cafe.isOpen ? 'Open now' : 'Closed';
    const distance = cafe.distance ? `<p><strong>Distance:</strong> ${cafe.distance.toFixed(1)} km</p>` : '';
    
    return `
        <div style="min-width: 200px; font-family: 'Open Sans', sans-serif;">
            <h3 style="color: #3C2415; margin-bottom: 10px; font-size: 1.1rem;">${cafe.name}</h3>
            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 8px;">
                <span style="color: #D4AF37;">${stars}</span>
                <span style="color: #8B4513;">(${cafe.rating})</span>
            </div>
            <p style="color: #8B4513; margin-bottom: 5px;"><strong>Address:</strong> ${cafe.address}</p>
            ${distance}
            <p style="color: #8B4513; margin-bottom: 5px;"><strong>Hours:</strong> ${cafe.hours}</p>
            <p style="margin-bottom: 8px;"><span class="cafe-status ${statusClass}" style="padding: 4px 8px; border-radius: 10px; font-size: 12px; font-weight: bold;">${statusText}</span></p>
            <p style="color: #704214; font-style: italic; font-size: 0.9rem;">${cafe.description}</p>
        </div>
    `;
}

/**
 * Select and focus on a specific cafe
 */
function selectCafe(index) {
    if (index >= 0 && index < filteredCafes.length) {
        const cafe = filteredCafes[index];
        map.setView([cafe.lat, cafe.lng], 16);
        
        // Open the popup for this marker
        if (markers[index]) {
            markers[index].openPopup();
        }
        
        // Scroll to the cafe card
        const cafeCards = document.querySelectorAll('.cafe-card-result');
        const cardIndex = index % itemsPerPage;
        if (cafeCards[cardIndex]) {
            cafeCards[cardIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            cafeCards[cardIndex].style.transform = 'scale(1.02)';
            cafeCards[cardIndex].style.boxShadow = '0 20px 50px rgba(60, 36, 21, 0.3)';
            
            setTimeout(() => {
                cafeCards[cardIndex].style.transform = '';
                cafeCards[cardIndex].style.boxShadow = '';
            }, 1000);
        }
    }
}

/**
 * Clear all markers from the map
 */
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

/**
 * Clear user location marker
 */
function clearUserMarker() {
    map.eachLayer(layer => {
        if (layer.options && layer.options.icon && layer.options.icon.options.className === 'custom-user-marker') {
            map.removeLayer(layer);
        }
    });
}

/**
 * Calculate distance between two coordinates
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

/**
 * Update results statistics
 */
function updateResultsStats() {
    const totalCafes = filteredCafes.length;
    const avgRating = totalCafes > 0 ? 
        (filteredCafes.reduce((sum, cafe) => sum + cafe.rating, 0) / totalCafes).toFixed(1) : 0;
    const openNow = filteredCafes.filter(cafe => cafe.isOpen).length;
    
    document.getElementById('totalCafes').textContent = totalCafes;
    document.getElementById('avgRating').textContent = avgRating;
    document.getElementById('openNow').textContent = openNow;
    
    const statsElement = document.getElementById('resultsStats');
    if (totalCafes > 0) {
        statsElement.style.display = 'flex';
        statsElement.classList.add('fade-in');
    } else {
        statsElement.style.display = 'none';
    }
}

/**
 * Carousel functionality
 */
let carouselAutoplayInterval;

function moveCarousel(direction) {
    const track = document.getElementById('carouselTrack');
    const cards = track.querySelectorAll('.coffee-card');
    const cardWidth = cards[0].offsetWidth + 20; // Including gap
    const visibleCards = Math.floor(track.parentElement.offsetWidth / cardWidth);
    const maxIndex = Math.max(0, cards.length - visibleCards);
    
    currentCarouselIndex = Math.max(0, Math.min(maxIndex, currentCarouselIndex + direction));
    
    track.style.transform = `translateX(-${currentCarouselIndex * cardWidth}px)`;
    
    // Reset autoplay
    clearInterval(carouselAutoplayInterval);
    startCarouselAutoplay();
}

function startCarouselAutoplay() {
    carouselAutoplayInterval = setInterval(() => {
        const track = document.getElementById('carouselTrack');
        const cards = track.querySelectorAll('.coffee-card');
        const cardWidth = cards[0].offsetWidth + 20;
        const visibleCards = Math.floor(track.parentElement.offsetWidth / cardWidth);
        const maxIndex = Math.max(0, cards.length - visibleCards);
        
        if (currentCarouselIndex >= maxIndex) {
            currentCarouselIndex = 0;
        } else {
            currentCarouselIndex++;
        }
        
        track.style.transform = `translateX(-${currentCarouselIndex * cardWidth}px)`;
    }, 4000);
}

/**
 * Pagination functionality
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredCafes.length / itemsPerPage);
    const paginationElement = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationElement.style.display = 'none';
        return;
    }
    
    paginationElement.style.display = 'flex';
    
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredCafes.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayResults();
        updatePagination();
        
        // Scroll to results
        document.querySelector('.results-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

/**
 * Loading states
 */
function showLoading(show = true) {
    const resultsDiv = document.getElementById('results');
    if (show) {
        resultsDiv.innerHTML = `
            <div class="loading">
                <div class="coffee-loader"></div>
                <div class="loading-text">Brewing your coffee search...</div>
                <div class="loading-subtext">Finding the best coffee spots nearby</div>
            </div>
        `;
    }
}

function showLoadingOverlay(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

/**
 * Toast notifications
 */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.2rem;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * Map controls
 */
function toggleFullscreen() {
    const mapContainer = document.querySelector('.map-container');
    
    if (!document.fullscreenElement) {
        mapContainer.requestFullscreen().then(() => {
            document.getElementById('fullscreenBtn').innerHTML = '⛶';
            setTimeout(() => map.invalidateSize(), 100);
        }).catch(err => {
            showToast('Fullscreen not supported', 'error');
        });
    } else {
        document.exitFullscreen().then(() => {
            document.getElementById('fullscreenBtn').innerHTML = '⛶';
            setTimeout(() => map.invalidateSize(), 100);
        });
    }
}

function centerOnUser() {
    if (userLocation) {
        map.setView(userLocation, 15);
        showToast('Centered on your location', 'success');
    } else {
        showToast('Location not available', 'error');
        findNearby();
    }
}

/**
 * Setup fact animation
 */
function setupFactAnimation() {
    const factNumber = document.getElementById('factNumber');
    let currentValue = 0;
    const targetValue = 2.25;
    const increment = 0.05;
    
    const animate = () => {
        if (currentValue < targetValue) {
            currentValue += increment;
            factNumber.textContent = currentValue.toFixed(2);
            requestAnimationFrame(animate);
        } else {
            factNumber.textContent = targetValue;
        }
    };
    
    // Start animation when element is visible
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animate();
            observer.disconnect();
        }
    });
    
    observer.observe(factNumber);
}

/**
 * Add event listeners
 */
function addEventListeners() {
    // Search input enter key
    document.getElementById('locationInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchCafes();
        }
    });
    
    // Filter change events
    document.getElementById('specialtyFilter').addEventListener('change', applyFilters);
    document.getElementById('sortFilter').addEventListener('change', applyFilters);
    document.getElementById('radiusFilter').addEventListener('change', () => {
        if (userLocation) {
            searchNearbyPlaces(userLocation);
        }
    });
    
    // Carousel touch/swipe support for mobile
    let isDown = false;
    let startX;
    let scrollLeft;
    
    const carouselTrack = document.getElementById('carouselTrack');
    
    carouselTrack.addEventListener('mousedown', (e) => {
        isDown = true;
        carouselTrack.style.cursor = 'grabbing';
        startX = e.pageX - carouselTrack.offsetLeft;
        scrollLeft = carouselTrack.scrollLeft;
    });
    
    carouselTrack.addEventListener('mouseleave', () => {
        isDown = false;
        carouselTrack.style.cursor = 'grab';
    });
    
    carouselTrack.addEventListener('mouseup', () => {
        isDown = false;
        carouselTrack.style.cursor = 'grab';
    });
    
    carouselTrack.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carouselTrack.offsetLeft;
        const walk = (x - startX) * 2;
        carouselTrack.scrollLeft = scrollLeft - walk;
    });
    
    // Touch events for mobile
    carouselTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX - carouselTrack.offsetLeft;
        scrollLeft = carouselTrack.scrollLeft;
    });
    
    carouselTrack.addEventListener('touchmove', (e) => {
        if (!startX) return;
        const x = e.touches[0].pageX - carouselTrack.offsetLeft;
        const walk = (x - startX) * 2;
        carouselTrack.scrollLeft = scrollLeft - walk;
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
        if (map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
    });
}

/**
 * Footer link handlers
 */
function showAbout() {
    showToast('Coffee Explorer - Discover amazing coffee shops using OpenStreetMap! ☕', 'info', 6000);
}

function showContact() {
    showToast('Contact us at: hello@coffeeexplorer.com ☕', 'info', 5000);
}

function showPrivacy() {
    showToast('We respect your privacy. Location data is only used for search and never stored.', 'info', 5000);
}

// Export functions for global access (if needed)
window.searchCafes = searchCafes;
window.findNearby = findNearby;
window.moveCarousel = moveCarousel;
window.selectCafe = selectCafe;
window.changePage = changePage;
window.toggleFullscreen = toggleFullscreen;
window.centerOnUser = centerOnUser;
window.showAbout = showAbout;
window.showContact = showContact;
window.showPrivacy = showPrivacy;