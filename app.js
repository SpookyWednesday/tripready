// API Configuration
const API_BASE = window.location.hostname.includes('localhost') ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';

// RAPIDAPI SUPPORTED COUNTRIES ONLY - Used for both nationality AND destination
const RAPIDAPI_COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
    "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
    "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
    "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
    "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
    "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
    "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
    "Lithuania", "Luxembourg", "Macao", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
    "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
    "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
    "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
    "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
    "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
    "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "UAE", "Uganda", "Ukraine", "United Kingdom", "United States", "Uruguay",
    "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// SIMPLIFIED API Functions - Countries only, API only
async function getWeatherData(destination, departureDate, returnDate) {
    console.log('🌤️ Weather request for country:', destination);

    try {
        const response = await fetch(`${API_BASE}/weather?destination=${encodeURIComponent(destination)}&departureDate=${departureDate}&returnDate=${returnDate}`);
        
        if (!response.ok) {
            throw new Error(`Weather API returned ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Weather API Error:', error);
        return {
            location: { name: destination, country: destination },
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
    console.log('🛂 ===== API-ONLY VISA REQUEST =====');
    console.log('📍 Nationality:', nationality);
    console.log('📍 Destination:', destination);
    console.log('🔗 API_BASE:', API_BASE);

    try {
        // SIMPLIFIED: Direct country-to-country API call ONLY
        const url = `${API_BASE}/visa?nationality=${encodeURIComponent(nationality)}&destination=${encodeURIComponent(destination)}`;
        console.log('🔗 Visa API URL:', url);
        
        console.log('🚀 Making visa API call (no fallback)...');
        const response = await fetch(url);
        
        console.log('📊 Visa response status:', response.status);
        console.log('📋 Visa response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Visa API Error:', errorText);
            throw new Error(`Visa API returned ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Visa API Response:', data);
        
        return data;
    } catch (error) {
        console.error('💥 Visa API Error:', error);
        
        // SIMPLIFIED ERROR HANDLING - No fallback database
        return {
            nationality: nationality,
            destination: destination,
            visaStatus: 'api_unavailable',
            visaMessage: 'Visa service temporarily unavailable',
            additionalInfo: `Unable to retrieve visa requirements at this time. Please check embassy websites directly. Error: ${error.message}`,
            stayDuration: 'Contact embassy',
            requirements: [
                'Check embassy website',
                'Contact consulate directly',
                'Verify current requirements'
            ],
            source: 'error_fallback',
            cached: false,
            timestamp: new Date().toISOString(),
            debugError: error.message
        };
    }
}

async function getRecommendations(destination, weather, tripType, duration, activities) {
    try {
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
        
        return await response.json();
    } catch (error) {
        console.error('Recommendations API Error:', error);
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
        console.log('🚀 Initializing COUNTRIES-ONLY Travel App...');
        this.loadSavedTheme();
        this.setupEventListeners();
        this.populateCountryDropdowns(); // SIMPLIFIED: Same list for both
        this.setMinDates();
        this.loadSavedProgress();
        console.log('✅ Countries-only app initialized successfully');
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

            console.log('✅ Event listeners set up successfully');
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

    // SIMPLIFIED: Countries only for both dropdowns
    populateCountryDropdowns() {
        try {
            // Populate nationality dropdown
            const nationalitySelect = document.getElementById('nationality');
            if (nationalitySelect) {
                // Clear existing options except the first one
                while (nationalitySelect.children.length > 1) {
                    nationalitySelect.removeChild(nationalitySelect.lastChild);
                }
                
                RAPIDAPI_COUNTRIES.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    nationalitySelect.appendChild(option);
                });
                console.log(`✅ Populated nationality with ${RAPIDAPI_COUNTRIES.length} countries`);
            }

            // Populate destination dropdown (same countries)
            const destinationSelect = document.getElementById('destination');
            if (destinationSelect) {
                // Clear existing options except the first one
                while (destinationSelect.children.length > 1) {
                    destinationSelect.removeChild(destinationSelect.lastChild);
                }
                
                RAPIDAPI_COUNTRIES.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    destinationSelect.appendChild(option);
                });
                console.log(`✅ Populated destination with ${RAPIDAPI_COUNTRIES.length} countries`);
            }
        } catch (error) {
            console.error('Error populating country dropdowns:', error);
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

    // SIMPLIFIED: Main checklist generation - countries only, API only
    async generateChecklist() {
        if (this.isGenerating) return;
        
        try {
            this.isGenerating = true;
            console.log('🚀 ===== STARTING COUNTRIES-ONLY GENERATION =====');
            
            // Get form element
            const form = document.getElementById('travel-form');
            if (!form) {
                throw new Error('Travel form not found');
            }
            
            // Create FormData from form
            const formData = new FormData(form);
            
            // Extract and validate data - SIMPLIFIED: Both are just country names
            const tripData = {
                destination: formData.get('destination')?.trim(),
                nationality: formData.get('nationality')?.trim(),
                departureDate: formData.get('departure-date'),
                returnDate: formData.get('return-date'),
                tripType: formData.get('trip-type'),
                activities: formData.get('activities')?.trim() || ''
            };
            
            console.log('📋 Countries-only form data:', tripData);
            console.log('🎯 Direct country-to-country:', `${tripData.nationality} → ${tripData.destination}`);
            
            // Validate required fields
            const requiredFields = ['destination', 'nationality', 'departureDate', 'returnDate', 'tripType'];
            const missingFields = requiredFields.filter(field => !tripData[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            }
            
            // Validate countries are in supported list
            if (!RAPIDAPI_COUNTRIES.includes(tripData.nationality)) {
                throw new Error(`Nationality "${tripData.nationality}" is not supported. Please select from the dropdown.`);
            }
            if (!RAPIDAPI_COUNTRIES.includes(tripData.destination)) {
                throw new Error(`Destination "${tripData.destination}" is not supported. Please select from the dropdown.`);
            }
            
            // Show loading state
            this.showLoadingState();
            
            // Calculate trip duration
            const duration = this.calculateDuration(tripData.departureDate, tripData.returnDate);
            console.log(`📅 Trip duration: ${duration} days`);
            
            // API CALLS - Countries only, API only (no fallback database)
            console.log('🔄 Starting API-only calls...');
            console.log('🌤️ Weather call for country:', tripData.destination);
            console.log('🛂 Visa call for countries:', `${tripData.nationality} → ${tripData.destination}`);
            
            const [weatherResult, visaResult] = await Promise.allSettled([
                getWeatherData(tripData.destination, tripData.departureDate, tripData.returnDate),
                getVisaData(tripData.nationality, tripData.destination)
            ]);
            
            const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
            const visa = visaResult.status === 'fulfilled' ? visaResult.value : null;
            
            console.log('🌤️ Weather result:', weather);
            console.log('🛂 Visa result:', visa);
            
            // Check if visa API actually failed
            if (visa && visa.visaStatus === 'api_unavailable') {
                console.log('⚠️ Visa API is unavailable - continuing with error message');
            } else if (visa && visa.source === 'rapidapi_live') {
                console.log('✅ Visa API call successful!');
            }
            
            // Get recommendations
            console.log('🤖 Getting AI recommendations...');
            const recommendations = await getRecommendations(
                tripData.destination, 
                weather,
                tripData.tripType, 
                duration, 
                tripData.activities
            );
            
            console.log('🤖 Recommendations result:', recommendations);
            
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
            console.error('💥 Countries-only generation error:', error);
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
        console.log('📊 Displaying countries-only results...');
        
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
            const departure = new Date(trip.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const returnDate = new Date(trip.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            tripDetails.textContent = `${departure} - ${returnDate} • ${trip.duration} days • ${trip.tripType}`;
        }
    }

    updateWeatherSection() {
        const weatherSection = document.querySelector('.weather-info');
        if (!weatherSection) return;
        
        if (!this.currentTrip.weather) {
            weatherSection.innerHTML = '<p class="text-center">Weather data unavailable</p>';
            return;
        }
        
        const weather = this.currentTrip.weather;
        weatherSection.innerHTML = `
            <div class="weather-current">
                <h4>Current Weather in ${weather.location?.name || this.currentTrip.destination}</h4>
                <div class="weather-day">
                    <span class="weather-date">Now</span>
                    <span class="weather-temp">${weather.current.temperature}°C</span>
                    <span class="weather-desc">${weather.current.description}</span>
                </div>
            </div>
            ${weather.forecast && weather.forecast.length > 0 ? `
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
            ` : ''}
        `;
    }

    updateVisaSection() {
        const visaSection = document.querySelector('.visa-info');
        if (!visaSection) return;
        
        if (!this.currentTrip.visa) {
            visaSection.innerHTML = '<p class="text-center">Visa information unavailable</p>';
            return;
        }
        
        const visa = this.currentTrip.visa;
        
        // Map visa status to CSS classes - including API error states
        const statusClassMap = {
            'visa_free': 'not-required',
            'visa_required': 'required',
            'e_visa': 'evisa',
            'visa_on_arrival': 'evisa',
            'api_unavailable': 'unknown',
            'unknown': 'unknown'
        };
        const statusClass = statusClassMap[visa.visaStatus] || 'unknown';
        
        visaSection.innerHTML = `
            <div class="visa-requirement">
                <span class="visa-status ${statusClass}">${visa.visaMessage}</span>
                <p>${visa.additionalInfo || 'Please verify requirements with embassy'}</p>
                <small>Stay Duration: ${visa.stayDuration || 'Check embassy guidelines'}</small>
                ${visa.source ? `<small class="visa-source">Source: ${visa.source}</small>` : ''}
                ${visa.debugError ? `<small class="visa-debug">Debug: ${visa.debugError}</small>` : ''}
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
                        ${category.items.map((item, index) => `
                            <div class="checklist-item" data-category="${categoryKey}" data-item="${item.name}" data-index="${index}">
                                <div class="item-checkbox" onclick="app.toggleItem('${categoryKey}', '${item.name}', ${index})"></div>
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
        
        // Show toast with AI tip if available
        if (this.currentTrip.recommendations?.aiTip) {
            this.showToast(`AI Tip: ${this.currentTrip.recommendations.aiTip}`, 'info');
        }
    }

    updateProgressStats(total, packed) {
        const stats = document.querySelectorAll('.stat-number');
        if (stats.length >= 3) {
            stats[0].textContent = total;
            stats[1].textContent = packed;
            stats[2].textContent = total - packed;
        }
        
        // Update progress circle
        const percentage = total > 0 ? Math.round((packed / total) * 100) : 0;
        const progressPercentage = document.querySelector('.progress-percentage');
        if (progressPercentage) {
            progressPercentage.textContent = percentage + '%';
        }
        
        // Update circular progress
        const circleProgress = document.querySelector('.circle-progress');
        if (circleProgress) {
            const degrees = (percentage / 100) * 360;
            circleProgress.style.background = `conic-gradient(white ${degrees}deg, rgba(255, 255, 255, 0.3) ${degrees}deg)`;
        }
    }

    toggleItem(category, itemName, index) {
        const itemElement = document.querySelector(`[data-category="${category}"][data-item="${itemName}"][data-index="${index}"]`);
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

// ADD DEBUG FUNCTION FOR MANUAL TESTING
window.debugVisaAPI = async function(nationality = 'China', destination = 'United States') {
    console.log('🧪 ===== MANUAL VISA API TEST =====');
    console.log(`🧪 Testing: ${nationality} → ${destination}`);

    const result = await getVisaData(nationality, destination);
    console.log('🧪 Manual test result:', result);

    return result;
};

// Initialize the app
const app = new TravelPackingApp();
console.log('🎯 COUNTRIES-ONLY + API-ONLY APP LOADED');
console.log('🧪 Use debugVisaAPI() to test visa API manually');
