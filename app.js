// Travel Packer - Main Application Logic
// API Configuration - ADD THIS TO THE TOP
const API_BASE = window.location.hostname.includes('localhost') ? 'http://localhost:8888/api' : '/api';

// Replace your existing mock functions with these real API calls
async function getWeatherData(destination, departureDate, returnDate) {
    try {
        const response = await fetch(`${API_BASE}/weather?destination=${encodeURIComponent(destination)}&departureDate=${departureDate}&returnDate=${returnDate}`);
        return await response.json();
    } catch (error) {
        console.error('Weather API Error:', error);
        return null;
    }
}

async function getVisaData(nationality, destination) {
    try {
        const response = await fetch(`${API_BASE}/visa?nationality=${encodeURIComponent(nationality)}&destination=${encodeURIComponent(destination)}`);
        return await response.json();
    } catch (error) {
        console.error('Visa API Error:', error);
        return { visaStatus: 'unknown', visaMessage: 'Check with embassy' };
    }
}

async function getRecommendations(destination, weather, tripType, duration, activities) {
    try {
        const response = await fetch(`${API_BASE}/recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination, weather, tripType, duration, activities })
        });
        return await response.json();
    } catch (error) {
        console.error('Recommendations API Error:', error);
        return null;
    }
}

// Your existing code continues below...

class TravelPackingApp {
    constructor() {
        this.currentTrip = null;
        this.checklistData = {};
        this.checklistProgress = { packed: 0, total: 0 };
        this.isGenerating = false;
        
        // Sample data for countries and destinations
        this.countries = [
            "United States", "United Kingdom", "Canada", "Australia", "Germany", 
            "France", "Japan", "South Korea", "China", "India", "Brazil", "Mexico", 
            "Italy", "Spain", "Netherlands", "Sweden", "Norway", "Denmark", 
            "Switzerland", "Austria", "New Zealand", "Singapore", "Hong Kong", 
            "South Africa", "UAE", "Saudi Arabia", "Russia", "Turkey", "Greece", "Portugal"
        ];
        
        this.sampleDestinations = [
            "Paris, France", "Tokyo, Japan", "New York, USA", "London, UK", 
            "Sydney, Australia", "Rome, Italy", "Barcelona, Spain", "Amsterdam, Netherlands"
        ];
        
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
        console.log('Initializing Travel Packing App...');
        this.loadSavedTheme();
        this.setupEventListeners();
        this.populateCountryDropdown();
        this.setupDestinationSuggestions();
        this.setMinDates();
        this.loadSavedProgress();
        console.log('App initialized successfully');
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
    
    populateCountryDropdown() {
        try {
            const select = document.getElementById('nationality');
            if (select) {
                this.countries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error populating country dropdown:', error);
        }
    }
    
    setupDestinationSuggestions() {
        try {
            const input = document.getElementById('destination');
            const suggestionsList = document.getElementById('destination-suggestions');
            
            if (!input || !suggestionsList) return;
            
            input.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                if (query.length < 2) {
                    suggestionsList.classList.remove('show');
                    return;
                }
                
                const matches = this.sampleDestinations.filter(dest => 
                    dest.toLowerCase().includes(query)
                );
                
                if (matches.length > 0) {
                    suggestionsList.innerHTML = matches.map(dest => 
                        `<div class="suggestion-item" data-destination="${dest}">${dest}</div>`
                    ).join('');
                    suggestionsList.classList.add('show');
                    
                    // Add click listeners to suggestions
                    suggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
                        item.addEventListener('click', () => {
                            input.value = item.dataset.destination;
                            suggestionsList.classList.remove('show');
                        });
                    });
                } else {
                    suggestionsList.classList.remove('show');
                }
            });
            
            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !suggestionsList.contains(e.target)) {
                    suggestionsList.classList.remove('show');
                }
            });
        } catch (error) {
            console.error('Error setting up destination suggestions:', error);
        }
    }
    
    setMinDates() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const departureDate = document.getElementById('departure-date');
            const returnDate = document.getElementById('return-date');
            
            if (departureDate) departureDate.min = today;
            if (returnDate) returnDate.min = today;
        } catch (error) {
            console.error('Error setting min dates:', error);
        }
    }
    
    validateDates() {
        try {
            const departureDate = document.getElementById('departure-date');
            const returnDate = document.getElementById('return-date');
            
            if (!departureDate || !returnDate) return;
            
            const departureValue = departureDate.value;
            const returnValue = returnDate.value;
            
            if (departureValue && returnValue) {
                if (new Date(returnValue) <= new Date(departureValue)) {
                    returnDate.value = '';
                    this.showToast('Return date must be after departure date', 'warning');
                }
            }
            
            if (departureValue) {
                returnDate.min = departureValue;
            }
        } catch (error) {
            console.error('Error validating dates:', error);
        }
    }
    
    async generateChecklist() {
        if (this.isGenerating) {
            console.log('Already generating checklist, skipping...');
            return;
        }
        
        console.log('Starting checklist generation...');
        this.isGenerating = true;
        
        try {
            const formData = this.getFormData();
            console.log('Form data:', formData);
            
            if (!this.validateForm(formData)) {
                this.isGenerating = false;
                return;
            }
            
            this.showLoadingState();
            
            // Start progress animation
            const progressAnimation = this.animateProgress();
            
            // Generate data synchronously to avoid async issues
            const weatherData = this.generateWeatherData(formData.destination);
            const visaData = this.generateVisaData(formData.nationality, formData.destination);
            const culturalData = this.generateCulturalData(formData.destination);
            
            console.log('Generated weather data:', weatherData);
            console.log('Generated visa data:', visaData);
            console.log('Generated cultural data:', culturalData);
            
            this.currentTrip = {
                ...formData,
                weather: weatherData,
                visa: visaData,
                cultural: culturalData,
                checklist: this.generatePersonalizedChecklist(formData, weatherData)
            };
            
            console.log('Current trip data:', this.currentTrip);
            
            // Wait for animation to complete
            setTimeout(() => {
                this.displayResults();
                this.saveProgress();
                this.showToast('Packing checklist generated successfully!', 'success');
                this.isGenerating = false;
            }, 3000);
            
        } catch (error) {
            console.error('Error generating checklist:', error);
            this.isGenerating = false;
            setTimeout(() => {
                this.showError('Failed to generate checklist. Please try again.');
            }, 1000);
        }
    }
    
    getFormData() {
        try {
            const destination = document.getElementById('destination');
            const nationality = document.getElementById('nationality');
            const departureDate = document.getElementById('departure-date');
            const returnDate = document.getElementById('return-date');
            const tripType = document.getElementById('trip-type');
            
            return {
                destination: destination ? destination.value.trim() : '',
                nationality: nationality ? nationality.value : '',
                departureDate: departureDate ? departureDate.value : '',
                returnDate: returnDate ? returnDate.value : '',
                tripType: tripType ? tripType.value : ''
            };
        } catch (error) {
            console.error('Error getting form data:', error);
            return {};
        }
    }
    
    validateForm(data) {
        try {
            const required = ['destination', 'nationality', 'departureDate', 'returnDate', 'tripType'];
            const missing = required.filter(field => !data[field]);
            
            if (missing.length > 0) {
                this.showToast(`Please fill in: ${missing.join(', ')}`, 'warning');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error validating form:', error);
            return false;
        }
    }
    
    showLoadingState() {
        try {
            const loadingSection = document.getElementById('loading-section');
            const resultsSection = document.getElementById('results-section');
            const errorSection = document.getElementById('error-section');
            
            if (loadingSection) loadingSection.classList.remove('hidden');
            if (resultsSection) resultsSection.classList.add('hidden');
            if (errorSection) errorSection.classList.add('hidden');
            
            const generateBtn = document.getElementById('generate-btn');
            if (generateBtn) {
                generateBtn.classList.add('loading');
                generateBtn.disabled = true;
            }
            
            console.log('Loading state displayed');
        } catch (error) {
            console.error('Error showing loading state:', error);
        }
    }
    
    animateProgress() {
        try {
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            
            if (!progressFill || !progressText) return;
            
            const steps = [
                { progress: 20, text: 'Fetching weather data...' },
                { progress: 40, text: 'Checking visa requirements...' },
                { progress: 60, text: 'Gathering cultural tips...' },
                { progress: 80, text: 'Creating personalized checklist...' },
                { progress: 100, text: 'Finalizing your packing list...' }
            ];
            
            let currentStep = 0;
            const interval = setInterval(() => {
                if (currentStep < steps.length) {
                    const step = steps[currentStep];
                    progressFill.style.width = `${step.progress}%`;
                    progressText.textContent = step.text;
                    currentStep++;
                } else {
                    clearInterval(interval);
                }
            }, 500);
            
            return interval;
        } catch (error) {
            console.error('Error animating progress:', error);
        }
    }
    
    generateWeatherData(destination) {
        try {
            const weatherTypes = [
                { temp: '22°C', description: 'Partly cloudy', icon: '⛅' },
                { temp: '25°C', description: 'Sunny', icon: '☀️' },
                { temp: '19°C', description: 'Light rain', icon: '🌦️' },
                { temp: '23°C', description: 'Cloudy', icon: '☁️' },
                { temp: '26°C', description: 'Clear skies', icon: '☀️' }
            ];
            
            const forecast = [];
            for (let i = 0; i < 5; i++) {
                const weather = weatherTypes[i % weatherTypes.length];
                forecast.push({
                    date: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${i + 1}`,
                    ...weather
                });
            }
            
            return {
                location: destination,
                forecast: forecast
            };
        } catch (error) {
            console.error('Error generating weather data:', error);
            return {
                location: destination,
                forecast: [
                    { date: 'Today', temp: '22°C', description: 'Partly cloudy', icon: '⛅' }
                ]
            };
        }
    }
    
    generateVisaData(nationality, destination) {
        try {
            const visaRequired = Math.random() > 0.5;
            return {
                required: visaRequired,
                type: visaRequired ? (Math.random() > 0.5 ? 'eVisa available' : 'Embassy visa required') : 'No visa required',
                validity: visaRequired ? '90 days' : 'N/A',
                documents: [
                    'Valid passport (6+ months)',
                    'Passport photos (if visa required)',
                    'Proof of accommodation',
                    'Return flight tickets',
                    'Proof of sufficient funds'
                ]
            };
        } catch (error) {
            console.error('Error generating visa data:', error);
            return {
                required: false,
                type: 'Check with embassy',
                validity: 'Varies',
                documents: ['Valid passport', 'Proof of accommodation']
            };
        }
    }
    
    generateCulturalData(destination) {
        try {
            return {
                etiquette: [
                    'Dress modestly when visiting religious sites',
                    'Learn basic greetings in the local language',
                    'Respect local customs and traditions',
                    'Be punctual for appointments'
                ],
                dosDonts: {
                    dos: [
                        'Try local cuisine and specialties',
                        'Carry some cash for small vendors',
                        'Be respectful of local customs',
                        'Learn basic phrases in the local language',
                        'Research cultural norms beforehand'
                    ],
                    donts: [
                        'Don\'t wear revealing clothing in conservative areas',
                        'Don\'t refuse offered food or drink politely',
                        'Don\'t point with your finger at people',
                        'Don\'t take photos without permission',
                        'Don\'t ignore local etiquette'
                    ]
                },
                safety: [
                    'Keep copies of important documents',
                    'Stay aware of your surroundings',
                    'Use registered taxis or ride-sharing apps',
                    'Avoid displaying expensive items',
                    'Keep emergency contacts handy'
                ]
            };
        } catch (error) {
            console.error('Error generating cultural data:', error);
            return {
                etiquette: ['Respect local customs'],
                dosDonts: {
                    dos: ['Be respectful', 'Learn basic phrases'],
                    donts: ['Don\'t be disrespectful', 'Don\'t ignore local customs']
                },
                safety: ['Stay alert', 'Keep documents safe']
            };
        }
    }
    
    generatePersonalizedChecklist(formData, weatherData) {
        try {
            const checklist = JSON.parse(JSON.stringify(this.packingCategories));
            
            // Add weather-specific items
            if (weatherData.forecast && weatherData.forecast.some(day => day.description.includes('rain'))) {
                checklist.clothing.items.push({
                    name: 'Rain Jacket',
                    description: 'Waterproof protection',
                    essential: true,
                    weatherBased: true
                });
                checklist.accessories.items.push({
                    name: 'Waterproof Umbrella',
                    description: 'Essential for rainy weather',
                    essential: true,
                    weatherBased: true
                });
            }
            
            // Add trip-type specific items
            if (formData.tripType === 'business') {
                checklist.clothing.items.push({
                    name: 'Business Suits',
                    description: 'Professional attire',
                    essential: true,
                    tripTypeBased: true
                });
                checklist.accessories.items.push({
                    name: 'Business Cards',
                    description: 'Professional networking',
                    essential: false,
                    tripTypeBased: true
                });
            } else if (formData.tripType === 'beach') {
                checklist.clothing.items.push({
                    name: 'Swimwear',
                    description: 'Beach essentials',
                    essential: true,
                    tripTypeBased: true
                });
                checklist.toiletries.items.push({
                    name: 'High SPF Sunscreen',
                    description: 'Beach protection',
                    essential: true,
                    tripTypeBased: true
                });
            } else if (formData.tripType === 'adventure') {
                checklist.clothing.items.push({
                    name: 'Hiking Boots',
                    description: 'Sturdy footwear',
                    essential: true,
                    tripTypeBased: true
                });
                checklist.accessories.items.push({
                    name: 'Backpack',
                    description: 'For day trips',
                    essential: true,
                    tripTypeBased: true
                });
            }
            
            return checklist;
        } catch (error) {
            console.error('Error generating personalized checklist:', error);
            return this.packingCategories;
        }
    }
    
    displayResults() {
        try {
            console.log('Displaying results...');
            
            const loadingSection = document.getElementById('loading-section');
            const resultsSection = document.getElementById('results-section');
            const errorSection = document.getElementById('error-section');
            
            if (loadingSection) loadingSection.classList.add('hidden');
            if (resultsSection) resultsSection.classList.remove('hidden');
            if (errorSection) errorSection.classList.add('hidden');
            
            // Reset generate button
            const generateBtn = document.getElementById('generate-btn');
            if (generateBtn) {
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
            }
            
            this.displayTripOverview();
            this.displayWeatherInfo();
            this.displayVisaInfo();
            this.displayCulturalTips();
            this.displayChecklist();
            this.updateProgress();
            this.setupResultsEventListeners();
            
            // Scroll to results
            if (resultsSection) {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            console.log('Results displayed successfully');
        } catch (error) {
            console.error('Error displaying results:', error);
            this.showError('Error displaying results. Please try again.');
        }
    }
    
    setupResultsEventListeners() {
        try {
            // Control buttons
            const checkAllBtn = document.getElementById('check-all-btn');
            const uncheckAllBtn = document.getElementById('uncheck-all-btn');
            const exportBtn = document.getElementById('export-btn');
            const shareBtn = document.getElementById('share-btn');
            
            if (checkAllBtn) {
                checkAllBtn.replaceWith(checkAllBtn.cloneNode(true));
                document.getElementById('check-all-btn').addEventListener('click', () => this.checkAllItems());
            }
            if (uncheckAllBtn) {
                uncheckAllBtn.replaceWith(uncheckAllBtn.cloneNode(true));
                document.getElementById('uncheck-all-btn').addEventListener('click', () => this.uncheckAllItems());
            }
            if (exportBtn) {
                exportBtn.replaceWith(exportBtn.cloneNode(true));
                document.getElementById('export-btn').addEventListener('click', () => this.exportChecklist());
            }
            if (shareBtn) {
                shareBtn.replaceWith(shareBtn.cloneNode(true));
                document.getElementById('share-btn').addEventListener('click', () => this.shareChecklist());
            }
        } catch (error) {
            console.error('Error setting up results event listeners:', error);
        }
    }
    
    displayTripOverview() {
        try {
            if (!this.currentTrip) return;
            
            const trip = this.currentTrip;
            const departureDate = new Date(trip.departureDate);
            const returnDate = new Date(trip.returnDate);
            const duration = Math.ceil((returnDate - departureDate) / (1000 * 60 * 60 * 24));
            
            const tripTitle = document.getElementById('trip-title');
            const tripDetails = document.getElementById('trip-details');
            
            if (tripTitle) {
                tripTitle.textContent = `Your Trip to ${trip.destination}`;
            }
            if (tripDetails) {
                tripDetails.textContent = `${departureDate.toLocaleDateString()} - ${returnDate.toLocaleDateString()} • ${duration} days • ${trip.tripType.charAt(0).toUpperCase() + trip.tripType.slice(1)} Trip`;
            }
        } catch (error) {
            console.error('Error displaying trip overview:', error);
        }
    }
    
    displayWeatherInfo() {
        try {
            const weatherContainer = document.getElementById('weather-info');
            if (!weatherContainer || !this.currentTrip.weather) return;
            
            const forecast = this.currentTrip.weather.forecast;
            
            weatherContainer.innerHTML = forecast.map(day => `
                <div class="weather-day">
                    <div>
                        <div class="weather-date">${day.date}</div>
                        <div class="weather-desc">${day.icon} ${day.description}</div>
                    </div>
                    <div class="weather-temp">${day.temp}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error displaying weather info:', error);
        }
    }
    
    displayVisaInfo() {
        try {
            const visaContainer = document.getElementById('visa-info');
            if (!visaContainer || !this.currentTrip.visa) return;
            
            const visa = this.currentTrip.visa;
            
            const statusClass = visa.required ? 'required' : 'not-required';
            const statusIcon = visa.required ? '❌' : '✅';
            const statusText = visa.required ? `Visa Required - ${visa.type}` : 'No visa required';
            
            visaContainer.innerHTML = `
                <div class="visa-requirement">
                    <span>${statusIcon}</span>
                    <span class="visa-status ${statusClass}">${statusText}</span>
                </div>
                <div class="visa-documents">
                    <h4>Required Documents:</h4>
                    <ul>
                        ${visa.documents.map(doc => `<li>${doc}</li>`).join('')}
                    </ul>
                </div>
            `;
        } catch (error) {
            console.error('Error displaying visa info:', error);
        }
    }
    
    displayCulturalTips() {
        try {
            const culturalContainer = document.getElementById('cultural-info');
            if (!culturalContainer || !this.currentTrip.cultural) return;
            
            const cultural = this.currentTrip.cultural;
            
            culturalContainer.innerHTML = `
                <div class="cultural-section">
                    <h4>✅ Do's</h4>
                    <ul>
                        ${cultural.dosDonts.dos.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="cultural-section">
                    <h4>❌ Don'ts</h4>
                    <ul>
                        ${cultural.dosDonts.donts.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="cultural-section">
                    <h4>🛡️ Safety Tips</h4>
                    <ul>
                        ${cultural.safety.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        } catch (error) {
            console.error('Error displaying cultural tips:', error);
        }
    }
    
    displayChecklist() {
        try {
            const checklistContainer = document.getElementById('checklist-categories');
            if (!checklistContainer || !this.currentTrip.checklist) return;
            
            const checklist = this.currentTrip.checklist;
            console.log('Displaying checklist:', checklist);
            
            checklistContainer.innerHTML = Object.entries(checklist).map(([categoryKey, category]) => {
                const totalItems = category.items.length;
                const packedItems = category.items.filter(item => 
                    this.checklistData[this.getItemId(categoryKey, item.name)]
                ).length;
                
                return `
                    <div class="checklist-category">
                        <div class="category-header">
                            <h4 class="category-title">${category.name}</h4>
                            <span class="category-count">${packedItems}/${totalItems}</span>
                        </div>
                        <div class="checklist-items">
                            ${category.items.map(item => {
                                const itemId = this.getItemId(categoryKey, item.name);
                                const isChecked = this.checklistData[itemId] || false;
                                return `
                                    <div class="checklist-item ${isChecked ? 'checked' : ''}" data-item-id="${itemId}">
                                        <div class="item-checkbox ${isChecked ? 'checked' : ''}"></div>
                                        <div class="item-content">
                                            <div class="item-text">${item.name}</div>
                                            <div class="item-description">${item.description}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
            
            // Add click listeners to checklist items
            checklistContainer.querySelectorAll('.checklist-item').forEach(item => {
                item.addEventListener('click', () => this.toggleChecklistItem(item));
            });
            
            console.log('Checklist displayed with', checklistContainer.querySelectorAll('.checklist-item').length, 'items');
        } catch (error) {
            console.error('Error displaying checklist:', error);
        }
    }
    
    getItemId(category, itemName) {
        return `${category}-${itemName.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    toggleChecklistItem(itemElement) {
        try {
            const itemId = itemElement.dataset.itemId;
            const isChecked = itemElement.classList.contains('checked');
            
            if (isChecked) {
                itemElement.classList.remove('checked');
                itemElement.querySelector('.item-checkbox').classList.remove('checked');
                this.checklistData[itemId] = false;
            } else {
                itemElement.classList.add('checked');
                itemElement.querySelector('.item-checkbox').classList.add('checked');
                this.checklistData[itemId] = true;
            }
            
            this.updateProgress();
            this.saveProgress();
        } catch (error) {
            console.error('Error toggling checklist item:', error);
        }
    }
    
    updateProgress() {
        try {
            const allItems = document.querySelectorAll('.checklist-item');
            const checkedItems = document.querySelectorAll('.checklist-item.checked');
            
            const total = allItems.length;
            const packed = checkedItems.length;
            const percentage = total > 0 ? Math.round((packed / total) * 100) : 0;
            
            this.checklistProgress = { packed, total };
            
            // Update progress display
            const progressPercentage = document.getElementById('progress-percentage');
            const totalItemsEl = document.getElementById('total-items');
            const packedItemsEl = document.getElementById('packed-items');
            const remainingItemsEl = document.getElementById('remaining-items');
            
            if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
            if (totalItemsEl) totalItemsEl.textContent = total;
            if (packedItemsEl) packedItemsEl.textContent = packed;
            if (remainingItemsEl) remainingItemsEl.textContent = total - packed;
            
            // Update circle progress
            const circleProgress = document.getElementById('circle-progress');
            if (circleProgress) {
                circleProgress.style.background = `conic-gradient(white ${percentage * 3.6}deg, rgba(255, 255, 255, 0.3) ${percentage * 3.6}deg)`;
            }
            
            // Update category counts
            if (this.currentTrip && this.currentTrip.checklist) {
                Object.keys(this.currentTrip.checklist).forEach(categoryKey => {
                    const categoryItems = document.querySelectorAll(`[data-item-id^="${categoryKey}-"]`);
                    const categoryChecked = document.querySelectorAll(`[data-item-id^="${categoryKey}-"].checked`);
                    const countElement = document.querySelector(`[data-item-id^="${categoryKey}-"]`)
                        ?.closest('.checklist-category')
                        ?.querySelector('.category-count');
                    
                    if (countElement) {
                        countElement.textContent = `${categoryChecked.length}/${categoryItems.length}`;
                    }
                });
            }
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }
    
    checkAllItems() {
        try {
            document.querySelectorAll('.checklist-item:not(.checked)').forEach(item => {
                this.toggleChecklistItem(item);
            });
            this.showToast('All items checked!', 'success');
        } catch (error) {
            console.error('Error checking all items:', error);
        }
    }
    
    uncheckAllItems() {
        try {
            document.querySelectorAll('.checklist-item.checked').forEach(item => {
                this.toggleChecklistItem(item);
            });
            this.showToast('All items unchecked!', 'success');
        } catch (error) {
            console.error('Error unchecking all items:', error);
        }
    }
    
    exportChecklist() {
        try {
            if (!this.currentTrip) {
                this.showToast('No checklist to export', 'warning');
                return;
            }
            
            const content = this.generateExportContent();
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `packing-checklist-${this.currentTrip.destination.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Checklist exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting checklist:', error);
            this.showToast('Error exporting checklist', 'error');
        }
    }
    
    generateExportContent() {
        try {
            const trip = this.currentTrip;
            let content = `TRAVEL PACKER\n`;
            content += `========================\n\n`;
            content += `Destination: ${trip.destination}\n`;
            content += `Dates: ${trip.departureDate} to ${trip.returnDate}\n`;
            content += `Trip Type: ${trip.tripType}\n`;
            content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
            
            Object.entries(trip.checklist).forEach(([categoryKey, category]) => {
                content += `${category.name}\n`;
                content += `${'-'.repeat(category.name.length)}\n`;
                
                category.items.forEach(item => {
                    const itemId = this.getItemId(categoryKey, item.name);
                    const isChecked = this.checklistData[itemId] ? '✓' : '☐';
                    content += `${isChecked} ${item.name} - ${item.description}\n`;
                });
                content += '\n';
            });
            
            return content;
        } catch (error) {
            console.error('Error generating export content:', error);
            return 'Error generating export content';
        }
    }
    
    shareChecklist() {
        try {
            if (!this.currentTrip) {
                this.showToast('No checklist to share', 'warning');
                return;
            }
            
            const shareData = {
                title: `Packing Checklist for ${this.currentTrip.destination}`,
                text: 'Check out my personalized travel packer!',
                url: window.location.href
            };
            
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData).catch(() => {
                    this.fallbackShare();
                });
            } else {
                this.fallbackShare();
            }
        } catch (error) {
            console.error('Error sharing checklist:', error);
            this.fallbackShare();
        }
    }
    
    fallbackShare() {
        try {
            const shareText = `Check out my personalized travel packer for ${this.currentTrip.destination}!`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareText).then(() => {
                    this.showToast('Checklist text copied to clipboard!', 'success');
                }).catch(() => {
                    this.showToast('Unable to copy to clipboard', 'error');
                });
            } else {
                this.showToast('Sharing not supported on this device', 'info');
            }
        } catch (error) {
            console.error('Error in fallback share:', error);
            this.showToast('Unable to share checklist', 'error');
        }
    }
    
    showError(message) {
        try {
            const loadingSection = document.getElementById('loading-section');
            const resultsSection = document.getElementById('results-section');
            const errorSection = document.getElementById('error-section');
            const errorMessage = document.getElementById('error-message');
            
            if (loadingSection) loadingSection.classList.add('hidden');
            if (resultsSection) resultsSection.classList.add('hidden');
            if (errorSection) errorSection.classList.remove('hidden');
            if (errorMessage) errorMessage.textContent = message;
            
            // Reset generate button
            const generateBtn = document.getElementById('generate-btn');
            if (generateBtn) {
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error showing error:', error);
        }
    }
    
    retryGeneration() {
        try {
            const errorSection = document.getElementById('error-section');
            if (errorSection) {
                errorSection.classList.add('hidden');
            }
            this.generateChecklist();
        } catch (error) {
            console.error('Error retrying generation:', error);
        }
    }
    
    showToast(message, type = 'info') {
        try {
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
            toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
            
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 4000);
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }
    
    saveProgress() {
        try {
            const data = {
                currentTrip: this.currentTrip,
                checklistData: this.checklistData,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('travel-app-data', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }
    
    loadSavedProgress() {
        try {
            const savedData = localStorage.getItem('travel-app-data');
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.currentTrip && data.checklistData) {
                    this.currentTrip = data.currentTrip;
                    this.checklistData = data.checklistData;
                    
                    // Show saved trip data
                    this.displayResults();
                    this.showToast('Welcome back! Your previous trip data has been restored.', 'info');
                }
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    try {
        new TravelPackingApp();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Register service worker with inline implementation
        const swCode = `
            const CACHE_NAME = 'travel-packing-v1';
            const urlsToCache = [
                '/',
                '/index.html',
                '/style.css',
                '/app.js'
            ];

            self.addEventListener('install', (event) => {
              event.waitUntil(
                caches.open(CACHE_NAME)
                  .then((cache) => cache.addAll(urlsToCache))
              );
            });

            self.addEventListener('fetch', (event) => {
              event.respondWith(
                caches.match(event.request)
                  .then((response) => {
                    if (response) {
                      return response;
                    }
                    return fetch(event.request);
                  }
                )
              );
            });
        `;
        
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swUrl)
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}