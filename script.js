const map = L.map('map-container').setView([18.925317, 72.832276], 18);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

const createCustomMarker = (color) => L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const createProgressBar = (available, total) => {
    const filledPercentage = ((total - available) / total) * 100;  // Calculate filled instead of available
    const barClass = available === 0 ? 'full' : 
                     available <= Math.floor(total * 0.3) ? 'warning' : '';
    return `
        <div class="parking-progress">
            <div class="progress-bar ${barClass}" style="width: ${filledPercentage}%"></div>
        </div>
        <small>${available}/${total} spots available</small>
    `;
};

const getRoadsideRate = () => {
    const now = new Date();
    hour = now.getHours();
    
    if (hour >= 0 && hour < 5) return 0;
    
    if ((hour >= 8 && hour < 11) || (hour >= 17 && hour < 21)) return 180;
    
    return 60;
};

const getBuildingRate = () => 50;
const getBMCRate = () => 50;

// Add timer functionality
let timerInterval;
function startTimer() {
    const timerOverlay = document.getElementById('timerOverlay');
    const timerElement = document.getElementById('timer');
    const legend = document.querySelector('.map-legend');
    let startTime = Date.now();

    // Show timer with animation and fade out legend
    timerOverlay.style.display = 'block';
    legend.style.opacity = '0';
    legend.style.pointerEvents = 'none';

    // Start the timer
    timerInterval = setInterval(() => {
        let elapsedTime = Date.now() - startTime;
        let hours = Math.floor(elapsedTime / (1000 * 60 * 60));
        let minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);

        timerElement.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    const timerOverlay = document.getElementById('timerOverlay');
    const legend = document.querySelector('.map-legend');
    
    // Show payment popup
    const upiPopup = document.createElement('div');
    upiPopup.className = 'upi-popup';
    upiPopup.innerHTML = `
        <div class="upi-popup-content">
            <h3>Payment Details</h3>
            <input type="text" id="upiId" placeholder="Enter your UPI ID" />
            <div class="popup-buttons">
                <button onclick="processPayment()">Pay</button>
                <button onclick="closePaymentPopup()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(upiPopup);
}

const ORIGINAL_COLABA_SPOTS = 4;

function processPayment() {
    const upiId = document.getElementById('upiId').value;
    if (!upiId) {
        alert('Please enter a valid UPI ID');
        return;
    }
    
    // Reset available spots to original number
    colabaCottageAvailable = ORIGINAL_COLABA_SPOTS;
    
    // Update the marker popup with reset spots
    markers.forEach(marker => {
        if (marker.position[0] === 18.924118 && marker.position[1] === 72.832453) {
            marker.popup = createBuildingPopup(marker.position, colabaCottageAvailable, 30, getBuildingRate(), "The Colaba Cottage");
            // Find and update the marker's popup on the map
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker && layer.getLatLng().lat === marker.position[0] && layer.getLatLng().lng === marker.position[1]) {
                    layer.setPopupContent(marker.popup);
                }
            });
        }
    });
    
    // Update popup content to show success message
    const popupContent = document.querySelector('.upi-popup-content');
    popupContent.innerHTML = `
        <h3>✅ Payment Successful</h3>
        <div class="popup-buttons">
            <button onclick="closePaymentPopup()">Done</button>
        </div>
    `;
}

function closePaymentPopup() {
    const upiPopup = document.querySelector('.upi-popup');
    if (upiPopup) {
        upiPopup.remove();
    }
    
    const timerOverlay = document.getElementById('timerOverlay');
    const legend = document.querySelector('.map-legend');
    timerOverlay.style.display = 'none';
    legend.style.opacity = '1';
    legend.style.pointerEvents = 'auto';
}

// Add QR scanner functionality before the markers array
const startQRScan = () => {
    // Create modal for QR scanner
    const modal = document.createElement('div');
    modal.className = 'qr-modal';
    modal.innerHTML = `
        <div class="qr-modal-content">
            <span class="qr-close">&times;</span>
            <div id="qr-scanner-container"></div>
            <div id="qr-result"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        { 
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
        },
        false
    );

    // Handle successful scan
    html5QrcodeScanner.render((decodedText, decodedResult) => {
        document.getElementById('qr-result').innerHTML = `
            Scanned Successfully: <strong>${decodedText}</strong>
        `;
        
        // Check if scanned text is "Enter" and update Colaba Cottage spots
        if (decodedText === "Enter" && colabaCottageAvailable > 0) {
            colabaCottageAvailable--;
            // Find and update the Colaba Cottage marker
            markers.forEach(marker => {
                if (marker.position[0] === 18.924118 && marker.position[1] === 72.832453) {
                    marker.popup = createBuildingPopup(marker.position, colabaCottageAvailable, 30, getBuildingRate(), "The Colaba Cottage");
                    // Find and update the marker's popup on the map
                    map.eachLayer((layer) => {
                        if (layer instanceof L.Marker && layer.getLatLng().lat === marker.position[0] && layer.getLatLng().lng === marker.position[1]) {
                            layer.setPopupContent(marker.popup);
                        }
                    });
                }
            });
        }
        
        // Stop scanner after successful scan
        setTimeout(() => {
            html5QrcodeScanner.clear();
            modal.remove();
            // Start timer after QR scan
            startTimer();
        }, 1000);
    });

    // Close modal when clicking X
    modal.querySelector('.qr-close').onclick = () => {
        html5QrcodeScanner.clear();
        modal.remove();
    };
};

// Modify building parking popups to include the new QR scanning button
const createBuildingPopup = (coords, available, total, rate, name = 'Building Parking') => `
    <a href="https://www.google.com/maps?q=${coords[0]},${coords[1]}" target="_blank">${name}</a><br>
    ${createProgressBar(available, total)}<br>
    Current Rate: ₹${rate}/hr<br>
    <button onclick="startQRScan()" class="booking-btn">Scan QR to Book</button>
`;

let colabaCottageAvailable = 4;

const markers = [

    //Colaba Causeway Pilot Project
    {
        position: [18.924776, 72.832100],
        color: 'orange',  // Using orange markers
        popup: `<a href="https://www.google.com/maps?q=18.924776,72.832100" target="_blank">Roadside Parking</a><br>
                ${createProgressBar(5, 10)}<br>
                Current Rate: ₹${getRoadsideRate()}/hr`
    },
    {
        position: [18.924775, 72.832158],
        color: 'orange',  // Using orange markers
        popup: `<a href="https://www.google.com/maps?q=18.924775,72.832158" target="_blank">Roadside Parking</a><br>
                ${createProgressBar(9, 10)}<br>
                Current Rate: ₹${getRoadsideRate()}/hr`
    },
    {
        position: [18.924872, 72.832576],
        color: 'orange',  // Using orange markers
        popup: `<a href="https://www.google.com/maps?q=18.924872,72.832576" target="_blank">Roadside Parking</a><br>${createProgressBar(6, 10)}<br>
                Current Rate: ₹${getRoadsideRate()}/hr`
    },
    {
        position: [18.925000, 72.832698],
        color: 'orange',  // Using orange markers
        popup: `<a href="https://www.google.com/maps?q=18.925000,72.832698" target="_blank">Roadside Parking</a><br>${createProgressBar(10, 10)}<br>
                Current Rate: ₹${getRoadsideRate()}/hr`
    },
    {
        position: [18.925562, 72.832863],
        color: 'orange',  // Using orange markers
        popup: `<a href="https://www.google.com/maps?q=18.925562,72.832863" target="_blank">Roadside Parking</a><br>${createProgressBar(0, 10)}<br>
                Current Rate: ₹${getRoadsideRate()}/hr`
    },
    {
        position: [18.926957, 72.833312],
        color: 'blue',
        popup: createBuildingPopup([18.926957, 72.833312], 20, 30, getBuildingRate())
    },
    {
        position: [18.924471, 72.831303],
        color: 'blue',
        popup: createBuildingPopup([18.924471, 72.831303], 0, 30, getBuildingRate())
    },
    {
        position: [18.924118, 72.832453],
        color: 'blue',
        popup: createBuildingPopup([18.924118, 72.832453], colabaCottageAvailable, 30, getBuildingRate(), "The Colaba Cottage")
    },
    {
        position: [18.925625, 72.829991],
        color: 'blue',
        popup: createBuildingPopup([18.925625, 72.829991], 25, 30, getBuildingRate())
    },
    {
        position: [18.925530, 72.830683],
        color: 'blue',
        popup: createBuildingPopup([18.925530, 72.830683], 2, 30, getBuildingRate())
    },
    {
        position: [18.926837, 72.835053],
        color: 'grey',  // Using grey markers
        popup: `<a href="https://www.google.com/maps?q=18.926837,72.835053" target="_blank">Free Parking</a><br>
                ${createProgressBar(0, 5)}`
    },
    {
        position: [18.925334, 72.833111],
        color: 'grey',  // Using grey markers
        popup: `<a href="https://www.google.com/maps?q=18.925334,72.833111" target="_blank">Free Parking</a><br>${createProgressBar(4, 5)}`
    },
    {
        position: [18.923955, 72.830406],
        color: 'grey',  // Using grey markers
        popup: `<a href="https://www.google.com/maps?q=18.923955,72.830406" target="_blank">Free Parking</a><br>${createProgressBar(5, 5)}`
    },
    {
        position: [18.923216, 72.833196],
        color: 'yellow',  // Using yellow markers
        popup: `<a href="https://www.google.com/maps?q=18.923216,72.833196" target="_blank">BMC Parking</a><br>
                ${createProgressBar(2, 5)}<br>
                Current Rate: ₹${getBMCRate()}/hr`
    },

    //SIES Nerul
    {
        position: [19.044208, 73.022947],
        color: 'orange',  // Using orange markers
        popup: `<a href="https://www.google.com/maps?q=19.044208,73.022947" target="_blank">Roadside Parking</a><br>${createProgressBar(6, 10)}<br>
                Current Rate: ₹${getRoadsideRate()}/hr`
    },

    {
        position: [19.044347, 73.023276],
        color: 'orange',  // Using orange markers
        popup: `<a href="https://www.google.com/maps?q=19.044347,73.023276" target="_blank">Roadside Parking</a><br>${createProgressBar(1, 5)}<br>
                Current Rate: ₹${getRoadsideRate()}/hr`
    },

    {
        position: [19.041057, 73.023122],
        color: 'orange',  // Using orange markers
        popup: `<a href="https://www.google.com/maps?q=19.041057,73.023122" target="_blank">Roadside Parking</a><br>${createProgressBar(2, 2)}<br>
                Current Rate: ₹${getRoadsideRate()}/hr`
    },

    {
        position: [19.040858, 73.021919],
        color: 'blue',
        popup: createBuildingPopup([19.040858, 73.021919], 25, 30, getBuildingRate())
    },

    {
        position: [19.040939, 73.022760],
        color: 'blue',
        popup: createBuildingPopup([19.040939, 73.022760], 12, 30, getBuildingRate())
    },

    {
        position: [19.045229, 73.020553],
        color: 'blue',
        popup: createBuildingPopup([19.045229, 73.020553], 27, 30, getBuildingRate())
    },

    {
        position: [19.043432 , 73.020341 ],
        color: 'blue',
        popup: createBuildingPopup([19.043432, 73.020341], 3, 30, getBuildingRate())
    },

    {
        position: [19.045183 , 73.0223204 ],
        color: 'grey',  // Using grey markers
        popup: `<a href="https://www.google.com/maps?q=19.045183,73.0223204" target="_blank">Free Parking</a><br>${createProgressBar(2, 3)}`
    },
    {
        position: [19.0458768 , 73.022936 ],
        color: 'grey',  // Using grey markers
        popup: `<a href="https://www.google.com/maps?q=19.0458768,73.022936" target="_blank">Free Parking</a><br>${createProgressBar(4, 5)}`
    },
];

markers.forEach(spot => {
    L.marker(spot.position, { icon: createCustomMarker(spot.color) })
        .addTo(map)
        .bindPopup(spot.popup, {
            maxWidth: 300,
            className: 'custom-popup'
        });
});

// Menu functionality
document.querySelector('.menu-toggle').addEventListener('click', () => {
    document.querySelector('.side-menu').classList.add('open');
});

document.querySelector('.close-menu').addEventListener('click', () => {
    document.querySelector('.side-menu').classList.remove('open');
});

// Handle menu item clicks
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all items and sections
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked item and corresponding section
        item.classList.add('active');
        const contentId = item.getAttribute('data-content');
        document.getElementById(contentId).classList.add('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.querySelector('.side-menu');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (!menu.contains(e.target) && !menuToggle.contains(e.target)) {
        menu.classList.remove('open');
    }
});

// Initialize first menu item as active
document.querySelector('.menu-item').click();

// Add search functionality
document.querySelector('.search-toggle').addEventListener('click', () => {
    const searchContainer = document.querySelector('.search-container');
    searchContainer.classList.toggle('active');
    
    if (searchContainer.classList.contains('active')) {
        setTimeout(() => {
            document.querySelector('.search-input').focus();
        }, 100);
    }
});

document.querySelector('.user-icon').addEventListener('click', () => {
    const modal = document.getElementById('authModal');
    modal.style.display = 'block';
});

// Geocoding and search functionality
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-submit');

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        // Using OpenStreetMap's Nominatim API for geocoding
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const location = data[0];
                    const lat = parseFloat(location.lat);
                    const lon = parseFloat(location.lon);

                    // Move map to the location
                    map.setView([lat, lon], 17);

                    // Find and highlight nearby markers
                    const markers = document.querySelectorAll('.leaflet-marker-icon');
                    markers.forEach(marker => {
                        marker.style.transition = 'transform 0.3s ease';
                        const markerLatLng = marker._leaflet_pos;
                        const distance = map.distance(
                            [lat, lon],
                            [marker._leaflet_events.click[0].sourceTarget._latlng.lat, 
                             marker._leaflet_events.click[0].sourceTarget._latlng.lng]
                        );

                        if (distance < 500) { // Within 500 meters
                            marker.style.transform += ' scale(1.3)';
                            setTimeout(() => {
                                marker.style.transform = marker.style.transform.replace(' scale(1.3)', '');
                            }, 2000);
                        }
                    });
                }
            })
            .catch(error => console.error('Error during search:', error));
    }

    // Event listener for Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Event listener for search button click
    searchButton.addEventListener('click', performSearch);
}

// Initialize search after map is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
});