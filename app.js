// Travel Packer - Main Application Logic
// API Configuration
const API_BASE = window.location.hostname.includes('localhost') ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';

// COMPLETE RAPIDAPI SUPPORTED COUNTRIES LIST (190+ countries including Hong Kong)
const RAPIDAPI_COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hong Kong", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Macao", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "UAE", "Uganda", "Ukraine", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
];

// Enhanced API Functions with Debugging
async function getWeatherData(destination, departureDate, returnDate) {
    try {
        console.log('🌤️ Frontend calling weather API:', destination);
        const response = await fetch(`${API_BASE}/weather?destination=${encodeURIComponent(destination)}&departureDate=${departureDate}&returnDate=${returnDate}`);
        
        if (!response.ok) {
            throw new Error(`Weather API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Frontend received weather data:', data);
        return data;
    } catch (error) {
        console.error('❌ Weather API Error:', error);
        return {
            location: { name: destination, country: 'Unknown' },
            current: {
                temperature: 20,
                description: 'Weather data unavailable',
                humidity: 50,
                windSpeed: 5,
                icon: '01d'
            },
            forecast: Array(5).fill(null).map((_, i) => ({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
                temperature: 20,
                description: 'Weather data unavailable',
                icon: '01d'
            })),
            error: 'Weather service temporarily unavailable'
        };
    }
}

async function getVisaData(nationality, destination) {
    try {
        console.log('🛂 Frontend calling visa API:', nationality, '→', destination);
        const response = await fetch(`${API_BASE}/visa?nationality=${encodeURIComponent(nationality)}&destination=${encodeURIComponent(destination)}`);
        
        if (!response.ok) {
            console.error('❌ Visa API HTTP Error:', response.status, response.statusText);
            throw new Error(`Visa API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Frontend received visa data:', data);
        return data;
    } catch (error) {
        console.error('❌ Visa API Error:', error);
        return {
            nationality: nationality,
            destination: destination,
            visaStatus: 'unknown',
            visaMessage: 'Check with embassy - service temporarily unavailable',
            additionalInfo: 'Please verify visa requirements with the embassy',
            stayDuration: 'Check embassy guidelines'
        };
    }
}

async function getRecommendations(destination, weather, tripType, duration, activities) {
    try {
        console.log('🤖 Frontend calling recommendations API:', destination, tripType);
        const response = await fetch(`${API_BASE}/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                destination,
                weather,
                tripType,
                duration,
                activities
            })
        });
        
        if (!response.ok) {
            throw new Error(`Recommendations API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Frontend received recommendations data:', data);
        return data;
    } catch (error) {
        console.error('❌ Recommendations API Error:', error);
        return null;
    }
}

class TravelPackingApp {
    constructor() {
        this.currentTrip = null;
        this.checklistData = {};
        this.checklistProgress = { packed: 0, total: 0 };
        this.isGenerating = false;

        this.packingCategories = {
            documents: {
                name: "📄 Essential Documents",
                items: [
                    { name: "Passport", description: "Valid for at least 6 months", essential: true },
                    { name: "Visa", description: "If required for your destination", essential: true },
                    { name: "Travel Insurance", description: "Comprehensive coverage recommended", essential: true },
                    { name: "Flight Tickets", description: "Print and digital copies", essential: true },
                    { name: "Hotel Reservations", description: "Booking confirmations", essential: false },
                    { name: "Driver's License", description: "For car rentals", essential: false },
                    { name: "Emergency Contacts", description: "Important phone numbers", essential: true },
                    { name: "Medical Information", description: "Prescriptions and allergies", essential: false }
                ]
            },
            clothing: {
                name: "👕 Clothing & Accessories",
                items: [
                    { name: "Shirts", description: "Based on weather forecast", essential: true },
                    { name: "Pants", description: "Comfortable and weather-appropriate", essential: true },
                    { name: "Underwear", description: "Pack extra pairs", essential: true },
                    { name: "Socks", description: "Comfortable walking socks", essential: true },
                    { name: "Shoes", description: "Comfortable walking shoes", essential: true },
                    { name: "Jacket", description: "Weather-dependent", essential: false },
                    { name: "Sleepwear", description: "Comfortable pajamas", essential: false },
                    { name: "Formal wear", description: "For business or special occasions", essential: false }
                ]
            },
            electronics: {
                name: "🔌 Electronics & Gadgets",
                items: [
                    { name: "Phone Charger", description: "Don't forget!", essential: true },
                    { name: "Camera", description: "Capture memories", essential: false },
                    { name: "Laptop", description: "For work or entertainment", essential: false },
                    { name: "Power Adapter", description: "Universal adapter recommended", essential: true },
                    { name: "Headphones", description: "For travel entertainment", essential: false },
                    { name: "Portable Battery", description: "Keep devices charged", essential: false },
                    { name: "Travel Router", description: "For reliable internet", essential: false }
                ]
            },
            toiletries: {
                name: "🧴 Toiletries & Health",
                items: [
                    { name: "Toothbrush", description: "Essential hygiene", essential: true },
                    { name: "Toothpaste", description: "Travel-sized", essential: true },
                    { name: "Shampoo", description: "Travel-sized bottles", essential: true },
                    { name: "Soap", description: "Body wash or bar soap", essential: true },
                    { name: "Deodorant", description: "Personal hygiene", essential: true },
                    { name: "Medications", description: "Prescription and over-the-counter", essential: true },
                    { name: "Sunscreen", description: "SPF 30+ recommended", essential: false },
                    { name: "First Aid Kit", description: "Basic medical supplies", essential: false }
                ]
            },
            accessories: {
                name: "🎒 Travel Accessories",
                items: [
                    { name: "Luggage Tags", description: "Identify your bags", essential: false },
                    { name: "Travel Pillow", description: "For comfortable flights", essential: false },
                    { name: "Eye Mask", description: "Better sleep while traveling", essential: false },
                    { name: "Earplugs", description: "Noise reduction", essential: false },
                    { name: "Travel Wallet", description: "Organize important documents", essential: false },
                    { name: "Umbrella", description: "Weather protection", essential: false },
                    { name: "Sunglasses", description: "Eye protection", essential: false }
                ]
            }
        };

        this.init();
    }

    init() {
        console.log('🚀 Initializing Travel Packing App...');
        this.loadSavedTheme();
        this.setupEventListeners();
        this.populateDropdowns();
        this.setMinDates();
        this.loadSavedProgress();
        console.log('✅ App initialized successfully');
    }

    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('travel-app-theme') || 'theme-default';
            const themeSelector = document.getElementById('theme-selector');
            const body = document.body;

            if (themeSelector && body) {
                themeSelector.value = savedTheme;
                body.className = savedTheme;
                body.setAttribute('data-color-scheme', savedTheme.includes('dark') ? 'dark' : 'light');
            }
        } catch (error) {
            console.error('Error loading saved theme:', error);
        }
    }

    setupEventListeners() {
        try {
            // Theme selector
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                themeSelector.addEventListener('change', (e) => {
                    this.changeTheme(e.target.value);
                });
            }

            // Form submission
            const travelForm = document.getElementById('travel-form');
            if (travelForm) {
                travelForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.generateChecklist();
                });
            }

            // Date validation
            const departureDate = document.getElementById('departure-date');
            const returnDate = document.getElementById('return-date');

            if (departureDate) {
                departureDate.addEventListener('change', () => this.validateDates());
            }
            if (returnDate) {
                returnDate.addEventListener('change', () => this.validateDates());
            }

            // Retry button
            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.retryGeneration());
            }

            // External link handler for visa section
            document.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' && e.target.closest('.visa-info')) {
                    const href = e.target.getAttribute('href');
                    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                        e.preventDefault();
                        window.open(href, '_blank', 'noopener,noreferrer');
                    }
                }
            });
    
            console.log('Event listeners set up successfully');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    changeTheme(themeName) {
        try {
            const body = document.body;
            if (body) {
                body.className = themeName;
                body.setAttribute('data-color-scheme', themeName.includes('dark') ? 'dark' : 'light');
                localStorage.setItem('travel-app-theme', themeName);
                this.showToast('Theme changed successfully!', 'success');
            }
        } catch (error) {
            console.error('Error changing theme:', error);
        }
    }

    populateDropdowns() {
        try {
            // Populate nationality dropdown
            const nationalitySelect = document.getElementById('nationality');
            if (nationalitySelect) {
                RAPIDAPI_COUNTRIES.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    nationalitySelect.appendChild(option);
                });
                console.log(`📍 Populated ${RAPIDAPI_COUNTRIES.length} nationalities (including Hong Kong, Macao, Taiwan)`);
            }

            // Populate destination dropdown
            const destinationSelect = document.getElementById('destination');
            if (destinationSelect) {
                RAPIDAPI_COUNTRIES.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    destinationSelect.appendChild(option);
                });
                console.log(`📍 Populated ${RAPIDAPI_COUNTRIES.length} destinations (including Hong Kong, Macao, Taiwan)`);
            }
        } catch (error) {
            console.error('Error populating dropdowns:', error);
        }
    }

    setMinDates() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const departureDate = document.getElementById('departure-date');
            const returnDate = document.getElementById('return-date');

            if (departureDate) {
                departureDate.min = today;
            }
            if (returnDate) {
                returnDate.min = today;
            }
        } catch (error) {
            console.error('Error setting minimum dates:', error);
        }
    }

    validateDates() {
        try {
            const departureDate = document.getElementById('departure-date');
            const returnDate = document.getElementById('return-date');

            if (departureDate && returnDate && departureDate.value && returnDate.value) {
                if (new Date(returnDate.value) <= new Date(departureDate.value)) {
                    returnDate.setCustomValidity('Return date must be after departure date');
                    this.showToast('Return date must be after departure date', 'warning');
                } else {
                    returnDate.setCustomValidity('');
                }
            }
        } catch (error) {
            console.error('Error validating dates:', error);
        }
    }

    loadSavedProgress() {
        try {
            const savedProgress = localStorage.getItem('travel-checklist-progress');
            if (savedProgress) {
                this.checklistProgress = JSON.parse(savedProgress);
            }
        } catch (error) {
            console.error('Error loading saved progress:', error);
        }
    }

    async generateChecklist() {
        if (this.isGenerating) return;

        try {
            this.isGenerating = true;
            console.log('🎯 Starting checklist generation...');

            // Get form element
            const form = document.getElementById('travel-form');
            if (!form) {
                throw new Error('Travel form not found');
            }

            // Create FormData from form
            const formData = new FormData(form);

            // Extract and validate data
            const tripData = {
                destination: formData.get('destination')?.trim(),
                nationality: formData.get('nationality')?.trim(),
                departureDate: formData.get('departure-date'),
                returnDate: formData.get('return-date'),
                tripType: formData.get('trip-type'),
                activities: formData.get('activities')?.trim() || ''
            };

            console.log('📝 Form data extracted:', tripData);

            // Validate required fields
            const requiredFields = ['destination', 'nationality', 'departureDate', 'returnDate', 'tripType'];
            const missingFields = requiredFields.filter(field => !tripData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            }

            // Show loading state
            this.showLoadingState();

            // Calculate trip duration
            const duration = this.calculateDuration(tripData.departureDate, tripData.returnDate);
            console.log(`📅 Trip duration: ${duration} days`);

            // Call APIs in parallel
            console.log('🔄 Calling APIs in parallel...');
            const [weatherData, visaData, recommendationsData] = await Promise.allSettled([
                getWeatherData(tripData.destination, tripData.departureDate, tripData.returnDate),
                getVisaData(tripData.nationality, tripData.destination),
                getRecommendations(tripData.destination, null, tripData.tripType, duration, tripData.activities)
            ]);

            // Process results
            const weather = weatherData.status === 'fulfilled' ? weatherData.value : null;
            const visa = visaData.status === 'fulfilled' ? visaData.value : null;
            const recommendations = recommendationsData.status === 'fulfilled' ? recommendationsData.value : null;

            console.log('📊 API Results Summary:', { 
                weather: weather ? '✅ Success' : '❌ Failed', 
                visa: visa ? '✅ Success' : '❌ Failed', 
                recommendations: recommendations ? '✅ Success' : '❌ Failed' 
            });

            // Store trip data
            this.currentTrip = {
                ...tripData,
                duration,
                weather,
                visa,
                recommendations
            };

            // Generate and display checklist
            this.displayResults();

        } catch (error) {
            console.error('❌ Error generating checklist:', error);
            this.showError(error.message || 'Failed to generate checklist');
        } finally {
            this.isGenerating = false;
        }
    }

    calculateDuration(departureDate, returnDate) {
        const departure = new Date(departureDate);
        const returnD = new Date(returnDate);
        const diffTime = Math.abs(returnD - departure);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    showLoadingState() {
        const loadingSection = document.getElementById('loading-section');
        const resultsSection = document.getElementById('results-section');
        const errorSection = document.getElementById('error-section');

        if (loadingSection) {
            loadingSection.classList.remove('hidden');
            loadingSection.style.display = 'block';
        }
        if (resultsSection) {
            resultsSection.classList.add('hidden');
            resultsSection.style.display = 'none';
        }
        if (errorSection) {
            errorSection.classList.add('hidden');
            errorSection.style.display = 'none';
        }

        // Animate progress bar
        this.animateProgressBar();
    }

    animateProgressBar() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '0%';
            let width = 0;
            const interval = setInterval(() => {
                width += 10;
                progressFill.style.width = width + '%';
                if (width >= 90) {
                    clearInterval(interval);
                }
            }, 200);
        }
    }

    displayResults() {
        console.log('🎨 Displaying results...');

        const loadingSection = document.getElementById('loading-section');
        const resultsSection = document.getElementById('results-section');
        const errorSection = document.getElementById('error-section');

        // Complete progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '100%';
        }

        // Hide loading after a short delay
        setTimeout(() => {
            if (loadingSection) {
                loadingSection.classList.add('hidden');
                loadingSection.style.display = 'none';
            }
            if (resultsSection) {
                resultsSection.classList.remove('hidden');
                resultsSection.style.display = 'block';
            }
            if (errorSection) {
                errorSection.classList.add('hidden');
                errorSection.style.display = 'none';
            }

            // Update all sections
            this.updateTripOverview();
            this.updateWeatherSection();
            this.updateVisaSection();
            this.updateChecklist();

            // Scroll to results
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }

    updateTripOverview() {
        const trip = this.currentTrip;
        const tripTitle = document.querySelector('.trip-overview h2');
        const tripDetails = document.querySelector('.trip-details');

        if (tripTitle) {
            tripTitle.textContent = `Your Trip to ${trip.destination}`;
        }

        if (tripDetails) {
            const departure = new Date(trip.departureDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            const returnDate = new Date(trip.returnDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            tripDetails.textContent = `${departure} - ${returnDate} • ${trip.duration} days • ${trip.tripType}`;
        }
    }

    updateWeatherSection() {
        const weatherSection = document.querySelector('.weather-info');
        if (!weatherSection) return;

        if (!this.currentTrip.weather) {
            weatherSection.innerHTML = '<p>Weather data unavailable</p>';
            return;
        }

        const weather = this.currentTrip.weather;
        weatherSection.innerHTML = `
            <div class="weather-current">
                <h4>Current Weather</h4>
                <div class="weather-day">
                    <span class="weather-date">Now</span>
                    <span class="weather-temp">${weather.current.temperature}°C</span>
                    <span class="weather-desc">${weather.current.description}</span>
                </div>
            </div>
            <div class="weather-forecast">
                <h4>5-Day Forecast</h4>
                ${weather.forecast.map(day => `
                    <div class="weather-day">
                        <span class="weather-date">${day.date}</span>
                        <span class="weather-temp">${day.temperature}°C</span>
                        <span class="weather-desc">${day.description}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateVisaSection() {
        const visaSection = document.querySelector('.visa-info');
        if (!visaSection) return;

        if (!this.currentTrip.visa) {
            visaSection.innerHTML = '<p>Visa information unavailable</p>';
            return;
        }

        const visa = this.currentTrip.visa;
        // Map visa status to CSS classes
        const statusClassMap = {
            'visa_free': 'not-required',
            'visa_required': 'required',
            'e_visa': 'evisa',
            'visa_on_arrival': 'evisa',
            'unknown': 'unknown'
        };

        const statusClass = statusClassMap[visa.visaStatus] || 'unknown';

        visaSection.innerHTML = `
            <div class="visa-requirement">
                <span class="visa-status ${statusClass}">${visa.visaMessage}</span>
                <p>${visa.additionalInfo || 'Please verify requirements with embassy'}</p>
                <small>Stay Duration: ${visa.stayDuration || 'Check embassy guidelines'}</small>
            </div>
        `;
    }

    updateChecklist() {
        const checklistCategories = document.querySelector('.checklist-categories');
        if (!checklistCategories) return;

        // Use AI recommendations if available, otherwise use default categories
        const categories = this.currentTrip.recommendations?.categories || this.packingCategories;

        let totalItems = 0;
        let categoriesHTML = '';

        for (const [categoryKey, category] of Object.entries(categories)) {
            const itemsCount = category.items.length;
            totalItems += itemsCount;

            categoriesHTML += `
                <div class="checklist-category">
                    <div class="category-header">
                        <h4 class="category-title">${category.name}</h4>
                        <span class="category-count">${itemsCount} items</span>
                    </div>
                    <div class="checklist-items">
                        ${category.items.map(item => `
                            <div class="checklist-item" data-category="${categoryKey}" data-item="${item.name}">
                                <div class="item-checkbox" onclick="app.toggleItem('${categoryKey}', '${item.name}')"></div>
                                <div class="item-text">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-description">${item.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        checklistCategories.innerHTML = categoriesHTML;

        // Update progress stats
        this.updateProgressStats(totalItems, 0);
    }

    updateProgressStats(total, packed) {
        const totalItems = document.querySelector('.stat-number');
        const packedItems = document.querySelectorAll('.stat-number')[1];
        const remainingItems = document.querySelectorAll('.stat-number')[2];

        if (totalItems) totalItems.textContent = total;
        if (packedItems) packedItems.textContent = packed;
        if (remainingItems) remainingItems.textContent = total - packed;
    }

    toggleItem(category, itemName) {
        const itemElement = document.querySelector(`[data-category="${category}"][data-item="${itemName}"]`);
        if (!itemElement) return;

        const checkbox = itemElement.querySelector('.item-checkbox');
        const isChecked = checkbox.classList.contains('checked');

        if (isChecked) {
            checkbox.classList.remove('checked');
            itemElement.classList.remove('checked');
        } else {
            checkbox.classList.add('checked');
            itemElement.classList.add('checked');
        }

        // Update progress
        this.updateProgress();
    }

    toggleAllItems(checked) {
        const items = document.querySelectorAll('.checklist-item');
        items.forEach(item => {
            const checkbox = item.querySelector('.item-checkbox');
            if (checked) {
                checkbox.classList.add('checked');
                item.classList.add('checked');
            } else {
                checkbox.classList.remove('checked');
                item.classList.remove('checked');
            }
        });
        this.updateProgress();
    }

    updateProgress() {
        const totalItems = document.querySelectorAll('.checklist-item').length;
        const packedItems = document.querySelectorAll('.checklist-item.checked').length;
        const percentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

        // Update progress circle
        const progressFill = document.querySelector('.progress-fill');
        const progressPercentage = document.querySelector('.progress-percentage');

        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressPercentage) progressPercentage.textContent = percentage + '%';

        // Update stats
        this.updateProgressStats(totalItems, packedItems);

        // Save progress
        this.checklistProgress = { packed: packedItems, total: totalItems };
        localStorage.setItem('travel-checklist-progress', JSON.stringify(this.checklistProgress));
    }

    showError(message) {
        const loadingSection = document.getElementById('loading-section');
        const resultsSection = document.getElementById('results-section');
        const errorSection = document.getElementById('error-section');

        if (loadingSection) {
            loadingSection.classList.add('hidden');
            loadingSection.style.display = 'none';
        }
        if (resultsSection) {
            resultsSection.classList.add('hidden');
            resultsSection.style.display = 'none';
        }
        if (errorSection) {
            errorSection.classList.remove('hidden');
            errorSection.style.display = 'block';
            const errorMessage = errorSection.querySelector('p');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }

        this.showToast(message, 'error');
    }

    retryGeneration() {
        this.generateChecklist();
    }

    showToast(message, type = 'info') {
        try {
            // Create toast container if it doesn't exist
            let toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.className = 'toast-container';
                document.body.appendChild(toastContainer);
            }

            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<span>${message}</span>`;

            // Add to container
            toastContainer.appendChild(toast);

            // Remove after 4 seconds
            setTimeout(() => {
                toast.remove();
            }, 4000);
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }
}

// Initialize the app
const app = new TravelPackingApp();
