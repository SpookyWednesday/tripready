// Travel Packer - Main Application Logic
// API Configuration
const API_BASE = window.location.hostname.includes('localhost') ? 'http://localhost:8888/.netlify/functions' : '/.netlify/functions';

// COMPREHENSIVE MAJOR CITIES DATABASE
const MAJOR_CITIES = [
    // North America
    { city: "New York", country: "United States", region: "North America", weatherName: "New York" },
    { city: "Los Angeles", country: "United States", region: "North America", weatherName: "Los Angeles" },
    { city: "Chicago", country: "United States", region: "North America", weatherName: "Chicago" },
    { city: "Miami", country: "United States", region: "North America", weatherName: "Miami" },
    { city: "Las Vegas", country: "United States", region: "North America", weatherName: "Las Vegas" },
    { city: "San Francisco", country: "United States", region: "North America", weatherName: "San Francisco" },
    { city: "Washington DC", country: "United States", region: "North America", weatherName: "Washington" },
    { city: "Boston", country: "United States", region: "North America", weatherName: "Boston" },
    { city: "Seattle", country: "United States", region: "North America", weatherName: "Seattle" },
    { city: "Toronto", country: "Canada", region: "North America", weatherName: "Toronto" },
    { city: "Vancouver", country: "Canada", region: "North America", weatherName: "Vancouver" },
    { city: "Montreal", country: "Canada", region: "North America", weatherName: "Montreal" },
    { city: "Mexico City", country: "Mexico", region: "North America", weatherName: "Mexico City" },
    { city: "Cancun", country: "Mexico", region: "North America", weatherName: "Cancun" },
    
    // Europe
    { city: "London", country: "United Kingdom", region: "Europe", weatherName: "London" },
    { city: "Paris", country: "France", region: "Europe", weatherName: "Paris" },
    { city: "Rome", country: "Italy", region: "Europe", weatherName: "Rome" },
    { city: "Berlin", country: "Germany", region: "Europe", weatherName: "Berlin" },
    { city: "Madrid", country: "Spain", region: "Europe", weatherName: "Madrid" },
    { city: "Barcelona", country: "Spain", region: "Europe", weatherName: "Barcelona" },
    { city: "Amsterdam", country: "Netherlands", region: "Europe", weatherName: "Amsterdam" },
    { city: "Vienna", country: "Austria", region: "Europe", weatherName: "Vienna" },
    { city: "Prague", country: "Czech Republic", region: "Europe", weatherName: "Prague" },
    { city: "Budapest", country: "Hungary", region: "Europe", weatherName: "Budapest" },
    { city: "Warsaw", country: "Poland", region: "Europe", weatherName: "Warsaw" },
    { city: "Stockholm", country: "Sweden", region: "Europe", weatherName: "Stockholm" },
    { city: "Copenhagen", country: "Denmark", region: "Europe", weatherName: "Copenhagen" },
    { city: "Oslo", country: "Norway", region: "Europe", weatherName: "Oslo" },
    { city: "Helsinki", country: "Finland", region: "Europe", weatherName: "Helsinki" },
    { city: "Brussels", country: "Belgium", region: "Europe", weatherName: "Brussels" },
    { city: "Zurich", country: "Switzerland", region: "Europe", weatherName: "Zurich" },
    { city: "Geneva", country: "Switzerland", region: "Europe", weatherName: "Geneva" },
    { city: "Milan", country: "Italy", region: "Europe", weatherName: "Milan" },
    { city: "Florence", country: "Italy", region: "Europe", weatherName: "Florence" },
    { city: "Venice", country: "Italy", region: "Europe", weatherName: "Venice" },
    { city: "Naples", country: "Italy", region: "Europe", weatherName: "Naples" },
    { city: "Nice", country: "France", region: "Europe", weatherName: "Nice" },
    { city: "Marseille", country: "France", region: "Europe", weatherName: "Marseille" },
    { city: "Lyon", country: "France", region: "Europe", weatherName: "Lyon" },
    { city: "Munich", country: "Germany", region: "Europe", weatherName: "Munich" },
    { city: "Hamburg", country: "Germany", region: "Europe", weatherName: "Hamburg" },
    { city: "Frankfurt", country: "Germany", region: "Europe", weatherName: "Frankfurt" },
    { city: "Cologne", country: "Germany", region: "Europe", weatherName: "Cologne" },
    { city: "Edinburgh", country: "United Kingdom", region: "Europe", weatherName: "Edinburgh" },
    { city: "Manchester", country: "United Kingdom", region: "Europe", weatherName: "Manchester" },
    { city: "Dublin", country: "Ireland", region: "Europe", weatherName: "Dublin" },
    { city: "Lisbon", country: "Portugal", region: "Europe", weatherName: "Lisbon" },
    { city: "Porto", country: "Portugal", region: "Europe", weatherName: "Porto" },
    { city: "Athens", country: "Greece", region: "Europe", weatherName: "Athens" },
    { city: "Santorini", country: "Greece", region: "Europe", weatherName: "Santorini" },
    { city: "Istanbul", country: "Turkey", region: "Europe/Asia", weatherName: "Istanbul" },
    { city: "Moscow", country: "Russia", region: "Europe/Asia", weatherName: "Moscow" },
    { city: "St. Petersburg", country: "Russia", region: "Europe", weatherName: "Saint Petersburg" },
    
    // Asia
    { city: "Tokyo", country: "Japan", region: "Asia", weatherName: "Tokyo" },
    { city: "Osaka", country: "Japan", region: "Asia", weatherName: "Osaka" },
    { city: "Kyoto", country: "Japan", region: "Asia", weatherName: "Kyoto" },
    { city: "Seoul", country: "South Korea", region: "Asia", weatherName: "Seoul" },
    { city: "Busan", country: "South Korea", region: "Asia", weatherName: "Busan" },
    { city: "Beijing", country: "China", region: "Asia", weatherName: "Beijing" },
    { city: "Shanghai", country: "China", region: "Asia", weatherName: "Shanghai" },
    { city: "Hong Kong", country: "Hong Kong", region: "Asia", weatherName: "Hong Kong" },
    { city: "Singapore", country: "Singapore", region: "Asia", weatherName: "Singapore" },
    { city: "Bangkok", country: "Thailand", region: "Asia", weatherName: "Bangkok" },
    { city: "Phuket", country: "Thailand", region: "Asia", weatherName: "Phuket" },
    { city: "Chiang Mai", country: "Thailand", region: "Asia", weatherName: "Chiang Mai" },
    { city: "Kuala Lumpur", country: "Malaysia", region: "Asia", weatherName: "Kuala Lumpur" },
    { city: "Manila", country: "Philippines", region: "Asia", weatherName: "Manila" },
    { city: "Cebu", country: "Philippines", region: "Asia", weatherName: "Cebu" },
    { city: "Jakarta", country: "Indonesia", region: "Asia", weatherName: "Jakarta" },
    { city: "Bali", country: "Indonesia", region: "Asia", weatherName: "Denpasar" },
    { city: "Ho Chi Minh City", country: "Vietnam", region: "Asia", weatherName: "Ho Chi Minh City" },
    { city: "Hanoi", country: "Vietnam", region: "Asia", weatherName: "Hanoi" },
    { city: "Mumbai", country: "India", region: "Asia", weatherName: "Mumbai" },
    { city: "Delhi", country: "India", region: "Asia", weatherName: "New Delhi" },
    { city: "Bangalore", country: "India", region: "Asia", weatherName: "Bangalore" },
    { city: "Chennai", country: "India", region: "Asia", weatherName: "Chennai" },
    { city: "Kolkata", country: "India", region: "Asia", weatherName: "Kolkata" },
    { city: "Goa", country: "India", region: "Asia", weatherName: "Panaji" },
    { city: "Jaipur", country: "India", region: "Asia", weatherName: "Jaipur" },
    { city: "Agra", country: "India", region: "Asia", weatherName: "Agra" },
    { city: "Kathmandu", country: "Nepal", region: "Asia", weatherName: "Kathmandu" },
    { city: "Colombo", country: "Sri Lanka", region: "Asia", weatherName: "Colombo" },
    { city: "Dhaka", country: "Bangladesh", region: "Asia", weatherName: "Dhaka" },
    { city: "Islamabad", country: "Pakistan", region: "Asia", weatherName: "Islamabad" },
    { city: "Karachi", country: "Pakistan", region: "Asia", weatherName: "Karachi" },
    { city: "Lahore", country: "Pakistan", region: "Asia", weatherName: "Lahore" },
    { city: "Kabul", country: "Afghanistan", region: "Asia", weatherName: "Kabul" },
    { city: "Tashkent", country: "Uzbekistan", region: "Asia", weatherName: "Tashkent" },
    { city: "Almaty", country: "Kazakhstan", region: "Asia", weatherName: "Almaty" },
    
    // Middle East
    { city: "Dubai", country: "UAE", region: "Middle East", weatherName: "Dubai" },
    { city: "Abu Dhabi", country: "UAE", region: "Middle East", weatherName: "Abu Dhabi" },
    { city: "Doha", country: "Qatar", region: "Middle East", weatherName: "Doha" },
    { city: "Kuwait City", country: "Kuwait", region: "Middle East", weatherName: "Kuwait" },
    { city: "Riyadh", country: "Saudi Arabia", region: "Middle East", weatherName: "Riyadh" },
    { city: "Jeddah", country: "Saudi Arabia", region: "Middle East", weatherName: "Jeddah" },
    { city: "Mecca", country: "Saudi Arabia", region: "Middle East", weatherName: "Mecca" },
    { city: "Tehran", country: "Iran", region: "Middle East", weatherName: "Tehran" },
    { city: "Baghdad", country: "Iraq", region: "Middle East", weatherName: "Baghdad" },
    { city: "Damascus", country: "Syria", region: "Middle East", weatherName: "Damascus" },
    { city: "Beirut", country: "Lebanon", region: "Middle East", weatherName: "Beirut" },
    { city: "Amman", country: "Jordan", region: "Middle East", weatherName: "Amman" },
    { city: "Jerusalem", country: "Israel", region: "Middle East", weatherName: "Jerusalem" },
    { city: "Tel Aviv", country: "Israel", region: "Middle East", weatherName: "Tel Aviv" },
    { city: "Ankara", country: "Turkey", region: "Middle East", weatherName: "Ankara" },
    
    // Africa
    { city: "Cairo", country: "Egypt", region: "Africa", weatherName: "Cairo" },
    { city: "Alexandria", country: "Egypt", region: "Africa", weatherName: "Alexandria" },
    { city: "Cape Town", country: "South Africa", region: "Africa", weatherName: "Cape Town" },
    { city: "Johannesburg", country: "South Africa", region: "Africa", weatherName: "Johannesburg" },
    { city: "Durban", country: "South Africa", region: "Africa", weatherName: "Durban" },
    { city: "Lagos", country: "Nigeria", region: "Africa", weatherName: "Lagos" },
    { city: "Abuja", country: "Nigeria", region: "Africa", weatherName: "Abuja" },
    { city: "Nairobi", country: "Kenya", region: "Africa", weatherName: "Nairobi" },
    { city: "Mombasa", country: "Kenya", region: "Africa", weatherName: "Mombasa" },
    { city: "Dar es Salaam", country: "Tanzania", region: "Africa", weatherName: "Dar es Salaam" },
    { city: "Addis Ababa", country: "Ethiopia", region: "Africa", weatherName: "Addis Ababa" },
    { city: "Accra", country: "Ghana", region: "Africa", weatherName: "Accra" },
    { city: "Dakar", country: "Senegal", region: "Africa", weatherName: "Dakar" },
    { city: "Casablanca", country: "Morocco", region: "Africa", weatherName: "Casablanca" },
    { city: "Marrakech", country: "Morocco", region: "Africa", weatherName: "Marrakech" },
    { city: "Rabat", country: "Morocco", region: "Africa", weatherName: "Rabat" },
    { city: "Tunis", country: "Tunisia", region: "Africa", weatherName: "Tunis" },
    { city: "Algiers", country: "Algeria", region: "Africa", weatherName: "Algiers" },
    { city: "Tripoli", country: "Libya", region: "Africa", weatherName: "Tripoli" },
    { city: "Khartoum", country: "Sudan", region: "Africa", weatherName: "Khartoum" },
    { city: "Kampala", country: "Uganda", region: "Africa", weatherName: "Kampala" },
    { city: "Kigali", country: "Rwanda", region: "Africa", weatherName: "Kigali" },
    { city: "Lusaka", country: "Zambia", region: "Africa", weatherName: "Lusaka" },
    { city: "Harare", country: "Zimbabwe", region: "Africa", weatherName: "Harare" },
    { city: "Gaborone", country: "Botswana", region: "Africa", weatherName: "Gaborone" },
    { city: "Windhoek", country: "Namibia", region: "Africa", weatherName: "Windhoek" },
    
    // Oceania
    { city: "Sydney", country: "Australia", region: "Oceania", weatherName: "Sydney" },
    { city: "Melbourne", country: "Australia", region: "Oceania", weatherName: "Melbourne" },
    { city: "Brisbane", country: "Australia", region: "Oceania", weatherName: "Brisbane" },
    { city: "Perth", country: "Australia", region: "Oceania", weatherName: "Perth" },
    { city: "Adelaide", country: "Australia", region: "Oceania", weatherName: "Adelaide" },
    { city: "Canberra", country: "Australia", region: "Oceania", weatherName: "Canberra" },
    { city: "Auckland", country: "New Zealand", region: "Oceania", weatherName: "Auckland" },
    { city: "Wellington", country: "New Zealand", region: "Oceania", weatherName: "Wellington" },
    { city: "Christchurch", country: "New Zealand", region: "Oceania", weatherName: "Christchurch" },
    { city: "Suva", country: "Fiji", region: "Oceania", weatherName: "Suva" },
    { city: "Port Moresby", country: "Papua New Guinea", region: "Oceania", weatherName: "Port Moresby" },
    
    // South America
    { city: "São Paulo", country: "Brazil", region: "South America", weatherName: "São Paulo" },
    { city: "Rio de Janeiro", country: "Brazil", region: "South America", weatherName: "Rio de Janeiro" },
    { city: "Brasília", country: "Brazil", region: "South America", weatherName: "Brasília" },
    { city: "Salvador", country: "Brazil", region: "South America", weatherName: "Salvador" },
    { city: "Recife", country: "Brazil", region: "South America", weatherName: "Recife" },
    { city: "Buenos Aires", country: "Argentina", region: "South America", weatherName: "Buenos Aires" },
    { city: "Córdoba", country: "Argentina", region: "South America", weatherName: "Córdoba" },
    { city: "Santiago", country: "Chile", region: "South America", weatherName: "Santiago" },
    { city: "Valparaíso", country: "Chile", region: "South America", weatherName: "Valparaíso" },
    { city: "Lima", country: "Peru", region: "South America", weatherName: "Lima" },
    { city: "Cusco", country: "Peru", region: "South America", weatherName: "Cusco" },
    { city: "Bogotá", country: "Colombia", region: "South America", weatherName: "Bogotá" },
    { city: "Medellín", country: "Colombia", region: "South America", weatherName: "Medellín" },
    { city: "Cartagena", country: "Colombia", region: "South America", weatherName: "Cartagena" },
    { city: "Caracas", country: "Venezuela", region: "South America", weatherName: "Caracas" },
    { city: "Quito", country: "Ecuador", region: "South America", weatherName: "Quito" },
    { city: "Guayaquil", country: "Ecuador", region: "South America", weatherName: "Guayaquil" },
    { city: "La Paz", country: "Bolivia", region: "South America", weatherName: "La Paz" },
    { city: "Santa Cruz", country: "Bolivia", region: "South America", weatherName: "Santa Cruz de la Sierra" },
    { city: "Asunción", country: "Paraguay", region: "South America", weatherName: "Asunción" },
    { city: "Montevideo", country: "Uruguay", region: "South America", weatherName: "Montevideo" },
    { city: "Georgetown", country: "Guyana", region: "South America", weatherName: "Georgetown" },
    { city: "Paramaribo", country: "Suriname", region: "South America", weatherName: "Paramaribo" },
    { city: "Cayenne", country: "French Guiana", region: "South America", weatherName: "Cayenne" },
    
    // Caribbean
    { city: "Havana", country: "Cuba", region: "Caribbean", weatherName: "Havana" },
    { city: "Kingston", country: "Jamaica", region: "Caribbean", weatherName: "Kingston" },
    { city: "San Juan", country: "Puerto Rico", region: "Caribbean", weatherName: "San Juan" },
    { city: "Santo Domingo", country: "Dominican Republic", region: "Caribbean", weatherName: "Santo Domingo" },
    { city: "Port-au-Prince", country: "Haiti", region: "Caribbean", weatherName: "Port-au-Prince" },
    { city: "Nassau", country: "Bahamas", region: "Caribbean", weatherName: "Nassau" },
    { city: "Bridgetown", country: "Barbados", region: "Caribbean", weatherName: "Bridgetown" },
    { city: "Port of Spain", country: "Trinidad and Tobago", region: "Caribbean", weatherName: "Port of Spain" },
    { city: "St. George's", country: "Grenada", region: "Caribbean", weatherName: "St. George's" }
];

// COMPLETE NATIONALITY LIST - ALL RAPIDAPI SUPPORTED COUNTRIES (Alphabetical)
const ALL_NATIONALITIES = [
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
    "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
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

// API Functions
async function getWeatherData(destination, departureDate, returnDate) {
    try {
        // Find city data to get proper weather name
        const cityData = MAJOR_CITIES.find(city => 
            city.city === destination || `${city.city}, ${city.country}` === destination
        );
        
        const weatherLocation = cityData ? cityData.weatherName : destination;
        console.log(`Weather lookup: ${destination} → ${weatherLocation}`);
        
        const response = await fetch(`${API_BASE}/weather?destination=${encodeURIComponent(weatherLocation)}&departureDate=${departureDate}&returnDate=${returnDate}`);
        
        if (!response.ok) {
            throw new Error(`Weather API returned ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Weather API Error:', error);
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
        // Find city data to extract country for visa lookup
        const cityData = MAJOR_CITIES.find(city => 
            city.city === destination || `${city.city}, ${city.country}` === destination
        );
        
        const visaDestination = cityData ? cityData.country : destination;
        console.log(`Visa lookup: ${nationality} → ${destination} (${visaDestination})`);
        
        const response = await fetch(`${API_BASE}/visa?nationality=${encodeURIComponent(nationality)}&destination=${encodeURIComponent(visaDestination)}`);
        
        if (!response.ok) {
            throw new Error(`Visa API returned ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Visa API Error:', error);
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
        this.filteredCities = MAJOR_CITIES;

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
        this.populateDestinationDropdown();
        this.setupDestinationSelector();
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
                // Use complete nationality list and sort alphabetically
                ALL_NATIONALITIES.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    select.appendChild(option);
                });
                console.log(`Populated ${ALL_NATIONALITIES.length} nationalities`);
            }
        } catch (error) {
            console.error('Error populating country dropdown:', error);
        }
    }

    populateDestinationDropdown() {
        try {
            const select = document.getElementById('destination');
            if (select) {
                // Clear existing options except the first one
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }

                // Group cities by region for better organization
                const regions = {};
                MAJOR_CITIES.forEach(city => {
                    if (!regions[city.region]) {
                        regions[city.region] = [];
                    }
                    regions[city.region].push(city);
                });

                // Sort regions and cities
                Object.keys(regions).sort().forEach(region => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = region;
                    
                    regions[region].sort((a, b) => a.city.localeCompare(b.city)).forEach(city => {
                        const option = document.createElement('option');
                        option.value = `${city.city}, ${city.country}`;
                        option.textContent = `${city.city}, ${city.country}`;
                        option.setAttribute('data-country', city.country);
                        option.setAttribute('data-region', city.region);
                        optgroup.appendChild(option);
                    });
                    
                    select.appendChild(optgroup);
                });
                console.log(`Populated ${MAJOR_CITIES.length} destinations`);
            }
        } catch (error) {
            console.error('Error populating destination dropdown:', error);
        }
    }

    // FIXED: Better destination selector that maintains dropdown functionality
    setupDestinationSelector() {
        try {
            const searchInput = document.getElementById('destination-search');
            const dropdown = document.getElementById('destination');
            const suggestionsList = document.getElementById('destination-suggestions');

            if (!searchInput || !dropdown || !suggestionsList) return;

            // BOTH elements should be visible and functional
            searchInput.style.display = 'block';
            dropdown.style.display = 'block';

            // Search input functionality
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                
                // Clear dropdown selection when typing
                dropdown.value = '';
                
                if (query.length < 2) {
                    suggestionsList.classList.remove('show');
                    return;
                }

                // Filter cities based on search query
                const matches = MAJOR_CITIES.filter(city => 
                    city.city.toLowerCase().includes(query) ||
                    city.country.toLowerCase().includes(query) ||
                    `${city.city}, ${city.country}`.toLowerCase().includes(query)
                ).slice(0, 8); // Limit to 8 results

                if (matches.length > 0) {
                    suggestionsList.innerHTML = matches.map(city => 
                        `<div class="suggestion-item" onclick="app.selectDestination('${city.city}, ${city.country}')">
                            <div class="suggestion-main">${city.city}</div>
                            <div class="suggestion-sub">${city.country} • ${city.region}</div>
                        </div>`
                    ).join('');
                    suggestionsList.classList.add('show');
                } else {
                    suggestionsList.innerHTML = '<div class="suggestion-item no-results">No destinations found</div>';
                    suggestionsList.classList.add('show');
                }
            });

            // Dropdown change functionality
            dropdown.addEventListener('change', (e) => {
                if (e.target.value) {
                    // Update search input to match selection
                    searchInput.value = e.target.value;
                    suggestionsList.classList.remove('show');
                    this.showToast(`Selected: ${e.target.value}`, 'success');
                }
            });

            // Clear search when dropdown is used
            dropdown.addEventListener('focus', () => {
                suggestionsList.classList.remove('show');
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && 
                    !suggestionsList.contains(e.target) && 
                    !dropdown.contains(e.target)) {
                    suggestionsList.classList.remove('show');
                }
            });

            console.log('Destination selector setup complete');
        } catch (error) {
            console.error('Error setting up destination selector:', error);
        }
    }

    selectDestination(destination) {
        const searchInput = document.getElementById('destination-search');
        const dropdown = document.getElementById('destination');
        const suggestionsList = document.getElementById('destination-suggestions');
        
        if (searchInput && dropdown) {
            // Update both input and dropdown
            searchInput.value = destination;
            dropdown.value = destination;
            
            // Hide suggestions
            if (suggestionsList) {
                suggestionsList.classList.remove('show');
            }
            
            // Show success message
            this.showToast(`Selected: ${destination}`, 'success');
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

    // UPDATED: Main checklist generation with better destination handling
    async generateChecklist() {
        if (this.isGenerating) return;
        
        try {
            this.isGenerating = true;
            console.log('Starting checklist generation...');
            
            // Get form element
            const form = document.getElementById('travel-form');
            if (!form) {
                throw new Error('Travel form not found');
            }
            
            // Get destination from either search input or dropdown (both should have same value)
            const searchInput = document.getElementById('destination-search');
            const dropdown = document.getElementById('destination');
            const destinationValue = searchInput?.value?.trim() || dropdown?.value?.trim();
            
            if (!destinationValue) {
                throw new Error('Please select a destination');
            }
            
            // Create FormData from form
            const formData = new FormData(form);
            
            // Extract and validate data
            const tripData = {
                destination: destinationValue,
                nationality: formData.get('nationality')?.trim(),
                departureDate: formData.get('departure-date'),
                returnDate: formData.get('return-date'),
                tripType: formData.get('trip-type'),
                activities: formData.get('activities')?.trim() || ''
            };
            
            console.log('Form data extracted:', tripData);
            
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
            console.log(`Trip duration: ${duration} days`);
            
            // Get weather and visa data
            console.log('Fetching weather and visa data...');
            const [weatherResult, visaResult] = await Promise.allSettled([
                getWeatherData(tripData.destination, tripData.departureDate, tripData.returnDate),
                getVisaData(tripData.nationality, tripData.destination)
            ]);
            
            const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
            const visa = visaResult.status === 'fulfilled' ? visaResult.value : null;
            
            console.log('Weather data:', weather);
            console.log('Visa data:', visa);
            
            // Get recommendations with weather data
            console.log('Getting recommendations with weather data...');
            const recommendations = await getRecommendations(
                tripData.destination, 
                weather,
                tripData.tripType, 
                duration, 
                tripData.activities
            );
            
            console.log('Recommendations:', recommendations);
            
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
            console.error('Error generating checklist:', error);
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
        console.log('Displaying results...');
        
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

// Initialize the app
const app = new TravelPackingApp();