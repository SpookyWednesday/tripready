const axios = require('axios');

// Country code mapping for RapidAPI
function getCountryCode(countryName) {
    const countryCodes = {
        'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Argentina': 'AR', 'Armenia': 'AM', 
        'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ', 'Bahrain': 'BH', 'Bangladesh': 'BD',
        'Belarus': 'BY', 'Belgium': 'BE', 'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Brazil': 'BR',
        'Bulgaria': 'BG', 'Cambodia': 'KH', 'Canada': 'CA', 'Chile': 'CL', 'China': 'CN', 'Colombia': 'CO',
        'Croatia': 'HR', 'Cuba': 'CU', 'Cyprus': 'CY', 'Czech Republic': 'CZ', 'Denmark': 'DK',
        'Ecuador': 'EC', 'Egypt': 'EG', 'Estonia': 'EE', 'Finland': 'FI', 'France': 'FR', 'Georgia': 'GE',
        'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR', 'Hungary': 'HU', 'Iceland': 'IS', 'India': 'IN',
        'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ', 'Ireland': 'IE', 'Israel': 'IL', 'Italy': 'IT',
        'Jamaica': 'JM', 'Japan': 'JP', 'Jordan': 'JO', 'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kuwait': 'KW',
        'Latvia': 'LV', 'Lebanon': 'LB', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Malaysia': 'MY',
        'Mexico': 'MX', 'Morocco': 'MA', 'Nepal': 'NP', 'Netherlands': 'NL', 'New Zealand': 'NZ',
        'Nigeria': 'NG', 'Norway': 'NO', 'Pakistan': 'PK', 'Peru': 'PE', 'Philippines': 'PH',
        'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA', 'Romania': 'RO', 'Russia': 'RU',
        'Saudi Arabia': 'SA', 'Singapore': 'SG', 'Slovakia': 'SK', 'Slovenia': 'SI', 'South Africa': 'ZA',
        'South Korea': 'KR', 'Spain': 'ES', 'Sri Lanka': 'LK', 'Sweden': 'SE', 'Switzerland': 'CH',
        'Thailand': 'TH', 'Tunisia': 'TN', 'Turkey': 'TR', 'UAE': 'AE', 'Ukraine': 'UA',
        'United Kingdom': 'GB', 'United States': 'US', 'Uruguay': 'UY', 'Venezuela': 'VE', 'Vietnam': 'VN'
    };
    
    return countryCodes[countryName] || countryName.substring(0, 2).toUpperCase();
}

// Fallback database - only used when API is unavailable
const FALLBACK_VISA_DATABASE = {
    'United States': {
        'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
        'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
        'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
        'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
        'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
        'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' }
    },
    'China': {
        'Japan': { status: 'visa_free', duration: '15 days', message: 'No visa required for short stays' },
        'United States': { status: 'visa_required', duration: '90 days', message: 'Visa required before travel' },
        'United Kingdom': { status: 'visa_required', duration: '90 days', message: 'Visa required before travel' }
    }
};

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const { nationality, destination } = event.queryStringParameters || {};

        console.log('========== CORRECTED VISA API CALL ==========');
        console.log(`Request: ${nationality} → ${destination}`);

        if (!nationality || !destination) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nationality and destination parameters are required' }),
            };
        }

        // Clean inputs for API calls
        const cleanNationality = cleanCountryName(nationality);
        const cleanDestination = cleanCountryName(destination);
        console.log(`Cleaned: ${cleanNationality} → ${cleanDestination}`);

        // CORRECTED RAPIDAPI CALL
        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
        console.log('RapidAPI Key available:', !!RAPIDAPI_KEY);

        if (RAPIDAPI_KEY) {
            console.log('🚀 Attempting corrected RapidAPI call...');
            try {
                // Convert country names to proper country codes
                const passportCode = getCountryCode(cleanNationality);
                const destinationCode = getCountryCode(cleanDestination);
                
                console.log(`Country codes: ${passportCode} → ${destinationCode}`);

                const visaResponse = await axios.post(
                    'https://visa-requirement.p.rapidapi.com/',  // CORRECTED: singular, not plural
                    // CORRECTED: Form data in request body
                    `passport=${passportCode}&destination=${destinationCode}`,
                    {
                        headers: {
                            'X-RapidAPI-Key': RAPIDAPI_KEY,
                            'X-RapidAPI-Host': 'visa-requirement.p.rapidapi.com',  // CORRECTED: singular
                            'Content-Type': 'application/x-www-form-urlencoded'     // CORRECTED: proper content type
                        },
                        timeout: 15000
                    }
                );

                console.log('✅ RapidAPI Response Status:', visaResponse.status);
                console.log('✅ RapidAPI Data:', JSON.stringify(visaResponse.data, null, 2));

                const visaData = visaResponse.data;
                
                // Process the response if successful
                if (visaData && !visaData.error) {
                    const processedVisa = processRapidAPIResponse(visaData);
                    console.log('✅ Processed API Result:', processedVisa);

                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            nationality: nationality,
                            destination: destination,
                            visaStatus: processedVisa.status,
                            visaMessage: processedVisa.message,
                            additionalInfo: processedVisa.additionalInfo,
                            stayDuration: processedVisa.duration,
                            requirements: getRequirements(processedVisa.status),
                            cached: false,
                            timestamp: new Date().toISOString(),
                            source: 'rapidapi_corrected',
                            note: 'Real-time visa requirements from corrected API'
                        }),
                    };
                } else {
                    console.log('⚠️ RapidAPI returned error:', visaData.message);
                }

            } catch (apiError) {
                console.error('❌ RapidAPI Error:');
                console.error('- Status:', apiError.response?.status);
                console.error('- Message:', apiError.message);
                console.error('- Data:', apiError.response?.data);
            }
        }

        // FALLBACK: Use fallback database
        console.log('📚 Using fallback database...');
        const fallbackInfo = getFallbackData(cleanNationality, cleanDestination);
        if (fallbackInfo) {
            console.log('✅ Found fallback data:', fallbackInfo);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    nationality: nationality,
                    destination: destination,
                    visaStatus: fallbackInfo.status,
                    visaMessage: fallbackInfo.message,
                    additionalInfo: 'This is fallback data. Please verify with official sources.',
                    stayDuration: fallbackInfo.duration,
                    requirements: getRequirements(fallbackInfo.status),
                    cached: false,
                    timestamp: new Date().toISOString(),
                    source: 'fallback_database',
                    note: 'API unavailable - showing cached data'
                }),
            };
        }

        // FINAL FALLBACK: Unknown with helpful message
        console.log('❓ All methods failed, returning unknown status');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                nationality: nationality,
                destination: destination,
                visaStatus: 'unknown',
                visaMessage: 'Unable to determine current visa requirements',
                additionalInfo: 'Please check with the embassy or official government sources for the most current visa requirements.',
                stayDuration: 'Contact embassy for guidance',
                requirements: [
                    'Valid passport (6+ months validity)',
                    'Check embassy website for current requirements',
                    'Contact consulate for specific guidance',
                    'Verify requirements before travel'
                ],
                cached: false,
                timestamp: new Date().toISOString(),
                source: 'service_unavailable',
                note: 'All visa data sources temporarily unavailable'
            }),
        };

    } catch (error) {
        console.error('========== VISA API FATAL ERROR ==========');
        console.error('Error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                nationality: event.queryStringParameters?.nationality || 'Unknown',
                destination: event.queryStringParameters?.destination || 'Unknown',
                visaStatus: 'error',
                visaMessage: 'Service temporarily unavailable',
                additionalInfo: 'Please try again later or check with embassy.',
                stayDuration: 'Contact embassy',
                requirements: ['Check embassy website', 'Contact consulate'],
                cached: false,
                timestamp: new Date().toISOString(),
                source: 'error_handler',
                error: 'Service error'
            }),
        };
    }
};

function cleanCountryName(country) {
    if (!country) return '';
    let cleaned = country.trim();
    // Handle "City, Country" format
    if (cleaned.includes(',')) {
        const parts = cleaned.split(',').map(part => part.trim());
        cleaned = parts[parts.length - 1];
    }
    // Remove common prefixes/suffixes
    cleaned = cleaned.replace(/^(the\s+)/i, '');
    return cleaned;
}

function processRapidAPIResponse(visaData) {
    console.log('Processing RapidAPI response:', visaData);
    let status = 'unknown';
    let message = 'Check with embassy';
    let duration = 'Varies';
    let additionalInfo = '';

    // Handle different API response formats
    const visaRequirement = visaData.visa_requirement || visaData.status || visaData.result;

    if (typeof visaRequirement === 'string') {
        const requirement = visaRequirement.toLowerCase();
        if (requirement.includes('visa free') || requirement.includes('no visa required')) {
            status = 'visa_free';
            message = 'No visa required for short stays';
            duration = visaData.max_stay || visaData.duration || '90 days';
            additionalInfo = 'Visa-free entry for tourism/business purposes.';
        } else if (requirement.includes('visa required')) {
            status = 'visa_required';
            message = 'Visa required before travel';
            additionalInfo = 'Apply for visa at embassy/consulate before departure.';
        } else if (requirement.includes('e-visa') || requirement.includes('electronic')) {
            status = 'e_visa';
            message = 'Electronic visa available online';
            additionalInfo = 'Apply online for e-visa before travel.';
        } else if (requirement.includes('visa on arrival')) {
            status = 'visa_on_arrival';
            message = 'Visa available on arrival';
            duration = visaData.max_stay || '30 days';
            additionalInfo = 'Visa can be obtained at port of entry.';
        }
    }

    return {
        status,
        message,
        duration,
        additionalInfo: additionalInfo || getAdditionalInfo(status)
    };
}

function getFallbackData(nationality, destination) {
    if (FALLBACK_VISA_DATABASE[nationality] && FALLBACK_VISA_DATABASE[nationality][destination]) {
        return FALLBACK_VISA_DATABASE[nationality][destination];
    }
    return null;
}

function getAdditionalInfo(visaStatus) {
    const infoMap = {
        'visa_free': 'No visa required for short-term tourism or business visits. Ensure passport validity of at least 6 months.',
        'visa_required': 'Visa must be obtained before travel. Apply at embassy/consulate with sufficient processing time.',
        'e_visa': 'Electronic visa can be applied for online. Print approval and carry during travel.',
        'visa_on_arrival': 'Visa can be obtained at the port of entry. Have required documents and fees ready.',
        'unknown': 'Visa requirements change frequently. Always verify current requirements with official sources.'
    };
    return infoMap[visaStatus] || infoMap['unknown'];
}

function getRequirements(visaStatus) {
    const requirementsMap = {
        'visa_free': [
            'Valid passport (6+ months validity)',
            'Return/onward ticket',
            'Proof of accommodation',
            'Sufficient funds for stay'
        ],
        'visa_required': [
            'Valid passport (6+ months validity)',
            'Completed visa application',
            'Recent passport photos',
            'Visa fee payment',
            'Supporting documents as required'
        ],
        'e_visa': [
            'Valid passport (6+ months validity)',
            'Digital passport photo',
            'Online application completion',
            'Credit card for payment',
            'Email for approval receipt'
        ],
        'visa_on_arrival': [
            'Valid passport (6+ months validity)',
            'Passport photos',
            'Visa fee (cash)',
            'Return ticket',
            'Proof of accommodation'
        ],
        'unknown': [
            'Valid passport',
            'Check embassy requirements',
            'Contact consulate for guidance'
        ]
    };
    return requirementsMap[visaStatus] || requirementsMap['unknown'];
}
