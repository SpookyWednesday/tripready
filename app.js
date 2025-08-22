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
            stayDuration: 'Check embassy guidelines',
            links: []
        };
    }
}

async function getRecommendations(destination, weather, tripType, duration) {
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
                duration
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
        this.currentEditingTheme = null;
        this.savedCustomThemes = this.loadSavedCustomThemes();

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
        this.populateCustomThemeSelector();
        this.setMinDates();
        this.loadSavedProgress();
        console.log('✅ App initialized successfully');
    }

    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem('travel-app-theme') || 'theme-default';
            const activeCustomTheme = localStorage.getItem('active-custom-theme');
            const themeSelector = document.getElementById('theme-selector');
            const customThemeSelector = document.getElementById('custom-theme-selector');
            const body = document.body;

            if (body) {
                if (savedTheme === 'theme-custom' && activeCustomTheme) {
                    // Load custom theme
                    if (customThemeSelector) customThemeSelector.value = activeCustomTheme;
                    if (themeSelector) themeSelector.selectedIndex = 0; // Reset to header
                    this.applyCustomTheme(activeCustomTheme);
                } else {
                    // Load default theme
                    if (themeSelector) themeSelector.value = savedTheme;
                    if (customThemeSelector) customThemeSelector.selectedIndex = 0; // Reset to header
                    body.className = savedTheme;
                    body.setAttribute('data-color-scheme', savedTheme.includes('dark') ? 'dark' : 'light');
                }
            }
        } catch (error) {
            console.error('Error loading saved theme:', error);
        }
    }

    loadAndApplyCustomTheme() {
        const savedCustomTheme = localStorage.getItem('custom-theme-settings');
        if (savedCustomTheme) {
            try {
                const settings = JSON.parse(savedCustomTheme);
                const themeColors = this.generateThemeColors(
                    settings.accentColor || '#86efac', 
                    settings.backgroundStyle || 'blue'
                );
                
                const root = document.documentElement;
                Object.entries(themeColors).forEach(([property, value]) => {
                    root.style.setProperty(property, value);
                });

                // Update body classes and attributes for custom theme
                const body = document.body;
                if (body) {
                    // Add font class if not default
                    const fontStyle = settings.fontStyle || 'default';
                    if (fontStyle !== 'default') {
                        body.classList.add(`font-${fontStyle}`);
                    }
                    
                    body.setAttribute('data-color-scheme', settings.backgroundStyle === 'light' ? 'light' : 'dark');
                }
            } catch (error) {
                console.error('Error loading custom theme settings:', error);
            }
        }
    }

    setupEventListeners() {
        try {
            // Default theme selector
            const themeSelector = document.getElementById('theme-selector');
            if (themeSelector) {
                themeSelector.addEventListener('change', (e) => {
                    if (e.target.value && e.target.value !== '') {
                        this.changeTheme(e.target.value);
                    } else {
                        // Reset to header if invalid selection
                        e.target.selectedIndex = 0;
                    }
                });
            }

            // Custom theme selector
            const customThemeSelector = document.getElementById('custom-theme-selector');
            if (customThemeSelector) {
                customThemeSelector.addEventListener('change', (e) => {
                    if (e.target.value && e.target.value !== '') {
                        this.applyCustomTheme(e.target.value);
                    } else {
                        // Reset to header if invalid selection
                        e.target.selectedIndex = 0;
                    }
                });
            }

            // Create custom theme button
            const createCustomBtn = document.getElementById('create-custom-theme');
            if (createCustomBtn) {
                createCustomBtn.addEventListener('click', () => {
                    this.openCustomThemeModal();
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
            // Clear custom theme selector when using default themes
            const customThemeSelector = document.getElementById('custom-theme-selector');
            if (customThemeSelector) {
                customThemeSelector.selectedIndex = 0; // Reset to header
            }

            const body = document.body;
            if (body) {
                // Clear custom theme classes
                this.clearFontClasses(body);
                body.className = themeName;
                body.setAttribute('data-color-scheme', themeName.includes('dark') ? 'dark' : 'light');
                localStorage.setItem('travel-app-theme', themeName);
                localStorage.removeItem('active-custom-theme');
                
                // Clear custom CSS variables
                const root = document.documentElement;
                const customVars = ['--custom-background', '--custom-surface', '--custom-text', '--custom-primary'];
                customVars.forEach(varName => root.style.removeProperty(varName));
                
                this.showToast('Theme changed successfully!', 'success');
            }
        } catch (error) {
            console.error('Error changing theme:', error);
        }
    }

    openCustomThemeModal() {
        const modal = document.getElementById('custom-theme-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.currentEditingTheme = null;
            
            // Reset modal UI
            document.getElementById('custom-theme-title').textContent = '🎨 Create Custom Theme';
            document.getElementById('delete-theme-btn').classList.add('hidden');
            document.getElementById('theme-name-input').value = '';
            
            this.populateSavedThemesGrid();
            this.loadCustomThemeSettings();
            this.setupCustomThemeEventListeners();
        }
    }

    closeCustomThemeModal() {
        const modal = document.getElementById('custom-theme-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        // Reset theme selector if user cancels
        const themeSelector = document.getElementById('theme-selector');
        const currentTheme = localStorage.getItem('travel-app-theme') || 'theme-default';
        if (themeSelector) {
            themeSelector.value = currentTheme;
        }
    }

    loadCustomThemeSettings() {
        const savedCustomTheme = localStorage.getItem('custom-theme-settings');
        let accentColor = '#86efac';
        let backgroundStyle = 'blue';
        let fontStyle = 'default';
        
        if (savedCustomTheme) {
            try {
                const settings = JSON.parse(savedCustomTheme);
                accentColor = settings.accentColor || '#86efac';
                backgroundStyle = settings.backgroundStyle || 'blue';
                fontStyle = settings.fontStyle || 'default';
            } catch (error) {
                console.error('Error parsing saved custom theme:', error);
            }
        }

        const accentColorInput = document.getElementById('accent-color');
        const accentColorText = document.getElementById('accent-color-text');
        const fontSelector = document.getElementById('font-selector');

        if (accentColorInput) accentColorInput.value = accentColor;
        if (accentColorText) accentColorText.value = accentColor;
        if (fontSelector) fontSelector.value = fontStyle;

        // Update active preset color
        const presetColors = document.querySelectorAll('.preset-color');
        presetColors.forEach(preset => {
            preset.classList.remove('active');
            if (preset.getAttribute('data-color') === accentColor) {
                preset.classList.add('active');
            }
        });

        // Update active background style
        const backgroundOptions = document.querySelectorAll('.background-option');
        backgroundOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-background') === backgroundStyle) {
                option.classList.add('active');
            }
        });

        // Trigger initial preview update
        setTimeout(() => this.updateThemePreview(), 100);
    }

    setupCustomThemeEventListeners() {
        const accentColorInput = document.getElementById('accent-color');
        const accentColorText = document.getElementById('accent-color-text');
        const backgroundColorInput = document.getElementById('background-color');
        const backgroundColorText = document.getElementById('background-color-text');
        const presetColors = document.querySelectorAll('.preset-color');
        const presetBgColors = document.querySelectorAll('.preset-bg-color');
        const backgroundOptions = document.querySelectorAll('.background-option');
        const fontSelector = document.getElementById('font-selector');

        // Sync accent color inputs
        if (accentColorInput && accentColorText) {
            accentColorInput.addEventListener('input', (e) => {
                accentColorText.value = e.target.value;
                this.updateThemePreview();
            });

            accentColorText.addEventListener('input', (e) => {
                if (this.isValidHexColor(e.target.value)) {
                    accentColorInput.value = e.target.value;
                    this.updateThemePreview();
                }
            });
        }

        // Sync background color inputs
        if (backgroundColorInput && backgroundColorText) {
            backgroundColorInput.addEventListener('input', (e) => {
                backgroundColorText.value = e.target.value;
                this.updateCustomBackgroundPreview();
                this.updateThemePreview();
            });

            backgroundColorText.addEventListener('input', (e) => {
                if (this.isValidHexColor(e.target.value)) {
                    backgroundColorInput.value = e.target.value;
                    this.updateCustomBackgroundPreview();
                    this.updateThemePreview();
                }
            });
        }

        // Preset accent color selection
        presetColors.forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                if (accentColorInput) accentColorInput.value = color;
                if (accentColorText) accentColorText.value = color;
                
                // Update active state
                presetColors.forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                
                this.updateThemePreview();
            });
        });

        // Preset background color selection
        presetBgColors.forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-bg-color');
                if (backgroundColorInput) backgroundColorInput.value = color;
                if (backgroundColorText) backgroundColorText.value = color;
                
                // Update active state
                presetBgColors.forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                
                this.updateCustomBackgroundPreview();
                this.updateThemePreview();
            });
        });

        // Background style selection
        backgroundOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // Update active state
                backgroundOptions.forEach(opt => opt.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Show/hide custom background controls
                const customBgGroup = document.getElementById('custom-background-group');
                const isCustom = e.currentTarget.getAttribute('data-background') === 'custom';
                
                if (customBgGroup) {
                    if (isCustom) {
                        customBgGroup.classList.add('visible');
                    } else {
                        customBgGroup.classList.remove('visible');
                    }
                }
                
                this.updateThemePreview();
            });
        });

        // Font style selection
        if (fontSelector) {
            fontSelector.addEventListener('change', () => {
                this.updateThemePreview();
                this.updateFontPreview();
            });
        }
    }

    updateThemePreview() {
        const accentColor = document.getElementById('accent-color')?.value || '#86efac';
        
        // Get selected background style
        const activeBackground = document.querySelector('.background-option.active');
        const backgroundStyle = activeBackground?.getAttribute('data-background') || 'blue';
        
        // Get selected font style
        const fontSelector = document.getElementById('font-selector');
        const fontStyle = fontSelector?.value || 'default';
        
        // Get custom background color if selected
        let customBackgroundColor = null;
        if (backgroundStyle === 'custom') {
            const backgroundColorInput = document.getElementById('background-color');
            customBackgroundColor = backgroundColorInput?.value || '#0c1e2e';
        }
        
        // Generate theme colors based on accent and background
        const themeColors = this.generateThemeColors(accentColor, backgroundStyle, customBackgroundColor);
        
        // Update preview
        const root = document.documentElement;
        Object.entries(themeColors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Apply font style to preview
        const body = document.body;
        if (body) {
            // Remove existing font classes
            this.clearFontClasses(body);
            
            // Add new font class if not default
            if (fontStyle !== 'default') {
                body.classList.add(`font-${fontStyle}`);
            }
        }
        
        // Update font preview
        this.updateFontPreview();
    }

    updateFontPreview() {
        const fontSelector = document.getElementById('font-selector');
        const fontPreviewText = document.getElementById('font-preview-text');
        
        if (fontSelector && fontPreviewText) {
            const fontStyle = fontSelector.value || 'default';
            
            // Remove existing font classes
            this.clearFontClasses(fontPreviewText);
            
            // Add new font class
            if (fontStyle !== 'default') {
                fontPreviewText.classList.add(`font-${fontStyle}`);
            }
        }
    }

    clearFontClasses(element) {
        const fontClasses = [
            'font-system', 'font-helvetica', 'font-arial', 'font-roboto', 'font-open-sans',
            'font-lato', 'font-poppins', 'font-nunito', 'font-montserrat', 'font-source-sans',
            'font-ubuntu', 'font-georgia', 'font-times', 'font-crimson', 'font-playfair',
            'font-merriweather', 'font-mono', 'font-courier', 'font-inconsolata'
        ];
        fontClasses.forEach(cls => element.classList.remove(cls));
    }

    updateCustomBackgroundPreview() {
        const backgroundColorInput = document.getElementById('background-color');
        const bgCustomPreview = document.getElementById('bg-custom-preview');
        
        if (backgroundColorInput && bgCustomPreview) {
            const color = backgroundColorInput.value;
            const root = document.documentElement;
            root.style.setProperty('--custom-bg-preview', color);
        }
    }

    generateThemeColors(accentColor, backgroundStyle, customBackgroundColor = null) {
        // Parse hex color to RGB
        const hex = accentColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Generate variations
        const lighten = (percent) => {
            return `rgb(${Math.min(255, r + (255 - r) * percent)}, ${Math.min(255, g + (255 - g) * percent)}, ${Math.min(255, b + (255 - b) * percent)})`;
        };

        const darken = (percent) => {
            return `rgb(${Math.max(0, r * (1 - percent))}, ${Math.max(0, g * (1 - percent))}, ${Math.max(0, b * (1 - percent))})`;
        };

        // Background colors based on style
        let backgrounds;
        switch (backgroundStyle) {
            case 'light':
                backgrounds = {
                    background: '#fafbfc',
                    surface: '#ffffff',
                    surfaceElevated: '#f8fafc',
                    text: '#1e293b',
                    textSecondary: '#475569',
                    btnText: darken(0.8)
                };
                break;
            case 'dark':
                backgrounds = {
                    background: '#0f172a',
                    surface: '#1e293b',
                    surfaceElevated: '#334155',
                    text: '#f1f5f9',
                    textSecondary: '#94a3b8',
                    btnText: '#ffffff'
                };
                break;
            case 'custom':
                const customBg = customBackgroundColor || '#0c1e2e';
                // Parse custom background color to determine if it's light or dark
                const bgHex = customBg.replace('#', '');
                const bgR = parseInt(bgHex.substr(0, 2), 16);
                const bgG = parseInt(bgHex.substr(2, 2), 16);
                const bgB = parseInt(bgHex.substr(4, 2), 16);
                const brightness = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;
                const isLight = brightness > 128;
                
                // Generate surface colors based on background
                const surfaceShift = isLight ? -20 : 20;
                const elevatedShift = isLight ? -40 : 40;
                
                backgrounds = {
                    background: customBg,
                    surface: `rgb(${Math.max(0, Math.min(255, bgR + surfaceShift))}, ${Math.max(0, Math.min(255, bgG + surfaceShift))}, ${Math.max(0, Math.min(255, bgB + surfaceShift))})`,
                    surfaceElevated: `rgb(${Math.max(0, Math.min(255, bgR + elevatedShift))}, ${Math.max(0, Math.min(255, bgG + elevatedShift))}, ${Math.max(0, Math.min(255, bgB + elevatedShift))})`,
                    text: isLight ? '#1e293b' : '#e2e8f0',
                    textSecondary: isLight ? '#475569' : '#94a3b8',
                    btnText: isLight ? darken(0.8) : '#ffffff'
                };
                break;
            default: // blue
                backgrounds = {
                    background: '#0c1e2e',
                    surface: '#1e3a52',
                    surfaceElevated: '#2a4a66',
                    text: '#e2e8f0',
                    textSecondary: '#94a3b8',
                    btnText: darken(0.8)
                };
        }

        return {
            '--custom-background': backgrounds.background,
            '--custom-surface': backgrounds.surface,
            '--custom-surface-elevated': backgrounds.surfaceElevated,
            '--custom-text': backgrounds.text,
            '--custom-text-secondary': backgrounds.textSecondary,
            '--custom-primary': accentColor,
            '--custom-primary-hover': lighten(0.1),
            '--custom-primary-active': darken(0.1),
            '--custom-secondary': `rgba(${r}, ${g}, ${b}, 0.08)`,
            '--custom-secondary-hover': `rgba(${r}, ${g}, ${b}, 0.12)`,
            '--custom-secondary-active': `rgba(${r}, ${g}, ${b}, 0.16)`,
            '--custom-border': `rgba(${r}, ${g}, ${b}, 0.2)`,
            '--custom-card-border': `rgba(${r}, ${g}, ${b}, 0.15)`,
            '--custom-card-border-inner': `rgba(${r}, ${g}, ${b}, 0.1)`,
            '--custom-btn-text': backgrounds.btnText,
            '--custom-focus-ring': `rgba(${r}, ${g}, ${b}, 0.3)`
        };
    }

    saveCustomTheme() {
        const accentColor = document.getElementById('accent-color')?.value || '#86efac';
        const themeNameInput = document.getElementById('theme-name-input');
        const themeName = themeNameInput?.value.trim();
        
        if (!themeName) {
            this.showToast('Please enter a theme name', 'warning');
            return;
        }
        
        // Get selected options
        const activeBackground = document.querySelector('.background-option.active');
        const backgroundStyle = activeBackground?.getAttribute('data-background') || 'blue';
        
        const fontSelector = document.getElementById('font-selector');
        const fontStyle = fontSelector?.value || 'default';

        // Get custom background color if applicable
        let customBackgroundColor = null;
        if (backgroundStyle === 'custom') {
            const backgroundColorInput = document.getElementById('background-color');
            customBackgroundColor = backgroundColorInput?.value || '#0c1e2e';
        }

        // Create theme data
        const themeData = {
            accentColor,
            backgroundStyle,
            customBackgroundColor,
            fontStyle,
            createdAt: new Date().toISOString()
        };

        // Save to themes collection
        this.savedCustomThemes[themeName] = themeData;
        this.saveCustomThemesToStorage();
        
        // Update UI
        this.populateCustomThemeSelector();
        this.populateSavedThemesGrid();

        // Apply the custom theme
        this.applyCustomTheme(themeName);

        this.closeCustomThemeModal();
        this.showToast(`Theme "${themeName}" saved and applied!`, 'success');
    }

    isValidHexColor(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    // Custom Theme Management Methods
    loadSavedCustomThemes() {
        try {
            const savedThemes = localStorage.getItem('saved-custom-themes');
            return savedThemes ? JSON.parse(savedThemes) : {};
        } catch (error) {
            console.error('Error loading saved custom themes:', error);
            return {};
        }
    }

    saveCustomThemesToStorage() {
        try {
            localStorage.setItem('saved-custom-themes', JSON.stringify(this.savedCustomThemes));
        } catch (error) {
            console.error('Error saving custom themes:', error);
        }
    }

    populateCustomThemeSelector() {
        const customThemeSelector = document.getElementById('custom-theme-selector');
        if (!customThemeSelector) return;

        // Clear existing options except the first one (header)
        while (customThemeSelector.children.length > 1) {
            customThemeSelector.removeChild(customThemeSelector.lastChild);
        }

        const themeNames = Object.keys(this.savedCustomThemes);
        
        if (themeNames.length === 0) {
            // Show "No themes saved" when empty
            const noThemesOption = document.createElement('option');
            noThemesOption.value = '';
            noThemesOption.textContent = 'No themes saved';
            noThemesOption.disabled = true;
            customThemeSelector.appendChild(noThemesOption);
        } else {
            // Add saved themes
            themeNames.forEach(themeName => {
                const option = document.createElement('option');
                option.value = themeName;
                option.textContent = themeName;
                customThemeSelector.appendChild(option);
            });
        }
    }

    populateSavedThemesGrid() {
        const savedThemesGrid = document.getElementById('saved-themes-grid');
        if (!savedThemesGrid) return;

        savedThemesGrid.innerHTML = '';

        Object.entries(this.savedCustomThemes).forEach(([themeName, themeData]) => {
            const themeItem = document.createElement('div');
            themeItem.className = 'saved-theme-item';
            themeItem.setAttribute('data-theme-name', themeName);
            
            const preview = document.createElement('div');
            preview.className = 'saved-theme-preview';
            preview.style.background = themeData.accentColor;
            
            const name = document.createElement('div');
            name.className = 'saved-theme-name';
            name.textContent = themeName;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'saved-theme-delete';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteSavedTheme(themeName);
            };
            
            themeItem.appendChild(preview);
            themeItem.appendChild(name);
            themeItem.appendChild(deleteBtn);
            
            themeItem.onclick = () => this.loadThemeForEditing(themeName);
            
            savedThemesGrid.appendChild(themeItem);
        });
    }

    loadThemeForEditing(themeName) {
        this.currentEditingTheme = themeName;
        const themeData = this.savedCustomThemes[themeName];
        
        if (themeData) {
            // Update form inputs
            const accentColorInput = document.getElementById('accent-color');
            const accentColorText = document.getElementById('accent-color-text');
            const themeNameInput = document.getElementById('theme-name-input');
            
            if (accentColorInput) accentColorInput.value = themeData.accentColor;
            if (accentColorText) accentColorText.value = themeData.accentColor;
            if (themeNameInput) themeNameInput.value = themeName;
            
            // Update active states
            this.updateActiveOptions(themeData);
            this.updateThemePreview();
            
            // Update UI
            document.getElementById('custom-theme-title').textContent = `🎨 Edit Theme: ${themeName}`;
            document.getElementById('delete-theme-btn').classList.remove('hidden');
            
            // Update active state in grid
            const savedThemeItems = document.querySelectorAll('.saved-theme-item');
            savedThemeItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-theme-name') === themeName) {
                    item.classList.add('active');
                }
            });
        }
    }

    updateActiveOptions(themeData) {
        // Update accent color inputs
        const accentColorInput = document.getElementById('accent-color');
        const accentColorText = document.getElementById('accent-color-text');
        if (accentColorInput) accentColorInput.value = themeData.accentColor;
        if (accentColorText) accentColorText.value = themeData.accentColor;

        // Update preset colors
        const presetColors = document.querySelectorAll('.preset-color');
        presetColors.forEach(preset => {
            preset.classList.remove('active');
            if (preset.getAttribute('data-color') === themeData.accentColor) {
                preset.classList.add('active');
            }
        });

        // Update background options
        const backgroundOptions = document.querySelectorAll('.background-option');
        backgroundOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-background') === themeData.backgroundStyle) {
                option.classList.add('active');
            }
        });

        // Update custom background color if applicable
        if (themeData.backgroundStyle === 'custom' && themeData.customBackgroundColor) {
            const backgroundColorInput = document.getElementById('background-color');
            const backgroundColorText = document.getElementById('background-color-text');
            if (backgroundColorInput) backgroundColorInput.value = themeData.customBackgroundColor;
            if (backgroundColorText) backgroundColorText.value = themeData.customBackgroundColor;
            
            // Show custom background controls
            const customBgGroup = document.getElementById('custom-background-group');
            if (customBgGroup) {
                customBgGroup.classList.add('visible');
            }
        }

        // Update font selector
        const fontSelector = document.getElementById('font-selector');
        if (fontSelector) {
            fontSelector.value = themeData.fontStyle || 'default';
        }
    }

    applyCustomTheme(themeName) {
        const themeData = this.savedCustomThemes[themeName];
        if (!themeData) return;

        // Clear default theme selector
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.selectedIndex = 0; // Reset to header
        }

        const body = document.body;
        if (body) {
            // Apply custom theme
            body.className = 'theme-custom';
            
            // Add font class if not default
            this.clearFontClasses(body);
            if (themeData.fontStyle !== 'default') {
                body.classList.add(`font-${themeData.fontStyle}`);
            }
            
            body.setAttribute('data-color-scheme', themeData.backgroundStyle === 'light' ? 'light' : 'dark');
            localStorage.setItem('travel-app-theme', 'theme-custom');
            localStorage.setItem('active-custom-theme', themeName);
        }

        // Generate and apply custom CSS variables
        const themeColors = this.generateThemeColors(themeData.accentColor, themeData.backgroundStyle, themeData.customBackgroundColor);
        const root = document.documentElement;
        Object.entries(themeColors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        this.showToast(`Applied theme: ${themeName}`, 'success');
    }

    deleteSavedTheme(themeName) {
        if (confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
            delete this.savedCustomThemes[themeName];
            this.saveCustomThemesToStorage();
            this.populateCustomThemeSelector();
            this.populateSavedThemesGrid();
            
            // If this was the active theme, switch to default
            const activeCustomTheme = localStorage.getItem('active-custom-theme');
            if (activeCustomTheme === themeName) {
                this.changeTheme('theme-default');
            }
            
            this.showToast(`Deleted theme: ${themeName}`, 'success');
        }
    }

    deleteCurrentTheme() {
        if (this.currentEditingTheme) {
            this.deleteSavedTheme(this.currentEditingTheme);
            this.closeCustomThemeModal();
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
                getRecommendations(tripData.destination, null, tripData.tripType, duration)
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

// FIXED: Updated visa section to properly handle links and new categories
    updateVisaSection() {
        const visaSection = document.querySelector('.visa-info');
        if (!visaSection) return;

        if (!this.currentTrip.visa) {
            visaSection.innerHTML = '<p>Visa information unavailable</p>';
            return;
        }

        const visa = this.currentTrip.visa;
        // Map visa status to CSS classes (including new ETA/ESTA categories)
        const statusClassMap = {
            'visa_free': 'not-required',
            'visa_required': 'required',
            'e_visa': 'evisa',
            'eta': 'evisa',        // NEW: ETA uses same styling as e_visa
            'esta': 'evisa',       // NEW: ESTA uses same styling as e_visa
            'visa_on_arrival': 'evisa',
            'unknown': 'unknown'
        };

        const statusClass = statusClassMap[visa.visaStatus] || 'unknown';

        // Build links HTML properly
        let linksHtml = '';
        if (visa.links && visa.links.length > 0) {
            linksHtml = '<div class="visa-links">';
            visa.links.forEach(link => {
                linksHtml += `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="visa-link">${link.text}</a>`;
            });
            linksHtml += '</div>';
        }

        visaSection.innerHTML = `
            <div class="visa-requirement">
                <span class="visa-status ${statusClass}">${visa.visaMessage}</span>
                <p>${visa.additionalInfo || 'Please verify requirements with embassy'}</p>
                <small>Stay Duration: ${visa.stayDuration || 'Check embassy guidelines'}</small>
                ${linksHtml}
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