const axios = require('axios');

// COMPLETE Country code mapping for RapidAPI (All 190+ countries)
function getCountryCode(countryName) {
    const countryCodes = {
        'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Andorra': 'AD', 'Angola': 'AO',
        'Antigua and Barbuda': 'AG', 'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ',
        'Bahamas': 'BS', 'Bahrain': 'BH', 'Bangladesh': 'BD', 'Barbados': 'BB', 'Belarus': 'BY', 'Belgium': 'BE',
        'Belize': 'BZ', 'Benin': 'BJ', 'Bhutan': 'BT', 'Bolivia': 'BO', 'Bosnia and Herzegovina': 'BA', 'Botswana': 'BW',
        'Brazil': 'BR', 'Brunei': 'BN', 'Bulgaria': 'BG', 'Burkina Faso': 'BF', 'Burundi': 'BI',
        'Cambodia': 'KH', 'Cameroon': 'CM', 'Canada': 'CA', 'Cape Verde': 'CV', 'Central African Republic': 'CF',
        'Chad': 'TD', 'Chile': 'CL', 'China': 'CN', 'Colombia': 'CO', 'Comoros': 'KM', 'Congo': 'CG',
        'Costa Rica': 'CR', 'Croatia': 'HR', 'Cuba': 'CU', 'Cyprus': 'CY', 'Czech Republic': 'CZ',
        'Denmark': 'DK', 'Djibouti': 'DJ', 'Dominica': 'DM', 'Dominican Republic': 'DO',
        'Ecuador': 'EC', 'Egypt': 'EG', 'El Salvador': 'SV', 'Equatorial Guinea': 'GQ', 'Eritrea': 'ER',
        'Estonia': 'EE', 'Eswatini': 'SZ', 'Ethiopia': 'ET',
        'Fiji': 'FJ', 'Finland': 'FI', 'France': 'FR',
        'Gabon': 'GA', 'Gambia': 'GM', 'Georgia': 'GE', 'Germany': 'DE', 'Ghana': 'GH', 'Greece': 'GR',
        'Grenada': 'GD', 'Guatemala': 'GT', 'Guinea': 'GN', 'Guinea-Bissau': 'GW', 'Guyana': 'GY',
        'Haiti': 'HT', 'Honduras': 'HN', 'Hong Kong': 'HK', 'Hungary': 'HU',
        'Iceland': 'IS', 'India': 'IN', 'Indonesia': 'ID', 'Iran': 'IR', 'Iraq': 'IQ', 'Ireland': 'IE',
        'Israel': 'IL', 'Italy': 'IT', 'Ivory Coast': 'CI',
        'Jamaica': 'JM', 'Japan': 'JP', 'Jordan': 'JO',
        'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Kiribati': 'KI', 'Kuwait': 'KW', 'Kyrgyzstan': 'KG',
        'Laos': 'LA', 'Latvia': 'LV', 'Lebanon': 'LB', 'Lesotho': 'LS', 'Liberia': 'LR', 'Libya': 'LY',
        'Liechtenstein': 'LI', 'Lithuania': 'LT', 'Luxembourg': 'LU',
        'Macao': 'MO', 'Madagascar': 'MG', 'Malawi': 'MW', 'Malaysia': 'MY', 'Maldives': 'MV', 'Mali': 'ML',
        'Malta': 'MT', 'Marshall Islands': 'MH', 'Mauritania': 'MR', 'Mauritius': 'MU', 'Mexico': 'MX',
        'Micronesia': 'FM', 'Moldova': 'MD', 'Monaco': 'MC', 'Mongolia': 'MN', 'Montenegro': 'ME',
        'Morocco': 'MA', 'Mozambique': 'MZ', 'Myanmar': 'MM',
        'Namibia': 'NA', 'Nauru': 'NR', 'Nepal': 'NP', 'Netherlands': 'NL', 'New Zealand': 'NZ',
        'Nicaragua': 'NI', 'Niger': 'NE', 'Nigeria': 'NG', 'North Korea': 'KP', 'North Macedonia': 'MK', 'Norway': 'NO',
        'Oman': 'OM',
        'Pakistan': 'PK', 'Palau': 'PW', 'Palestine': 'PS', 'Panama': 'PA', 'Papua New Guinea': 'PG',
        'Paraguay': 'PY', 'Peru': 'PE', 'Philippines': 'PH', 'Poland': 'PL', 'Portugal': 'PT',
        'Qatar': 'QA',
        'Romania': 'RO', 'Russia': 'RU', 'Rwanda': 'RW',
        'Saint Kitts and Nevis': 'KN', 'Saint Lucia': 'LC', 'Saint Vincent and the Grenadines': 'VC',
        'Samoa': 'WS', 'San Marino': 'SM', 'Sao Tome and Principe': 'ST', 'Saudi Arabia': 'SA',
        'Senegal': 'SN', 'Serbia': 'RS', 'Seychelles': 'SC', 'Sierra Leone': 'SL', 'Singapore': 'SG',
        'Slovakia': 'SK', 'Slovenia': 'SI', 'Solomon Islands': 'SB', 'Somalia': 'SO', 'South Africa': 'ZA',
        'South Korea': 'KR', 'South Sudan': 'SS', 'Spain': 'ES', 'Sri Lanka': 'LK', 'Sudan': 'SD',
        'Suriname': 'SR', 'Sweden': 'SE', 'Switzerland': 'CH', 'Syria': 'SY',
        'Taiwan': 'TW', 'Tajikistan': 'TJ', 'Tanzania': 'TZ', 'Thailand': 'TH', 'Timor-Leste': 'TL',
        'Togo': 'TG', 'Tonga': 'TO', 'Trinidad and Tobago': 'TT', 'Tunisia': 'TN', 'Turkey': 'TR',
        'Turkmenistan': 'TM', 'Tuvalu': 'TV',
        'UAE': 'AE', 'Uganda': 'UG', 'Ukraine': 'UA', 'United Kingdom': 'GB', 'United States': 'US',
        'Uruguay': 'UY', 'Uzbekistan': 'UZ',
        'Vanuatu': 'VU', 'Vatican City': 'VA', 'Venezuela': 'VE', 'Vietnam': 'VN',
        'Yemen': 'YE',
        'Zambia': 'ZM', 'Zimbabwe': 'ZW'
    };
    
    const code = countryCodes[countryName];
    if (!code) {
        console.log(`⚠️ Warning: No country code found for "${countryName}", using fallback`);
        return countryName.substring(0, 2).toUpperCase();
    }
    return code;
}

// Enhanced fallback database with more combinations
const FALLBACK_VISA_DATABASE = {
    'United States': {
        'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
        'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
        'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
        'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
        'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
        'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
        'Hong Kong': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' }
    },
    'China': {
        'Japan': { status: 'visa_free', duration: '15 days', message: 'No visa required for short stays' },
        'United States': { status: 'visa_required', duration: '90 days', message: 'Visa required before travel' },
        'United Kingdom': { status: 'visa_required', duration: '90 days', message: 'Visa required before travel' },
        'Hong Kong': { status: 'visa_free', duration: '7 days', message: 'No visa required for short stays' }
    },
    'Hong Kong': {
        'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
        'United States': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
        'United Kingdom': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
        'China': { status: 'special', duration: 'No limit', message: 'Hong Kong residents have special status' }
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

        console.log('========== ENHANCED VISA API CALL ==========');
        console.log(`🛂 Request: ${nationality} → ${destination}`);

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
        console.log(`🧹 Cleaned: ${cleanNationality} → ${cleanDestination}`);

        // Get environment variables
        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
        console.log('🔑 RapidAPI Key available:', !!RAPIDAPI_KEY);

        if (RAPIDAPI_KEY) {
            console.log('🚀 Attempting RapidAPI call with correct format...');
            try {
                // Convert country names to proper country codes
                const passportCode = getCountryCode(cleanNationality);
                const destinationCode = getCountryCode(cleanDestination);
                
                console.log(`🏷️ Country codes: ${passportCode} → ${destinationCode}`);

                const visaResponse = await axios.post(
                    'https://visa-requirement.p.rapidapi.com/',  // Correct singular endpoint
                    // Form data in request body (RapidAPI expects this format)
                    `passport=${passportCode}&destination=${destinationCode}`,
                    {
                        headers: {
                            'X-RapidAPI-Key': RAPIDAPI_KEY,
                            'X-RapidAPI-Host': 'visa-requirement.p.rapidapi.com',  // Correct singular host
                            'Content-Type': 'application/x-www-form-urlencoded'     // Required content type
                        },
                        timeout: 15000
                    }
                );

                console.log('✅ RapidAPI Response Status:', visaResponse.status);
                console.log('📝 RapidAPI Data:', JSON.stringify(visaResponse.data, null, 2));

                const visaData = visaResponse.data;
                
                // Process the response if successful
                if (visaData && !visaData.error) {
                    const processedVisa = processRapidAPIResponse(visaData);
                    console.log('🎯 Processed API Result:', processedVisa);

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
                            source: 'rapidapi_live',
                            note: 'Real-time visa requirements from RapidAPI'
                        }),
                    };
                } else {
                    console.log('⚠️ RapidAPI returned error:', visaData?.message || 'Unknown error');
                }

            } catch (apiError) {
                console.error('❌ RapidAPI Error Details:');
                console.error('- Status:', apiError.response?.status);
                console.error('- Status Text:', apiError.response?.statusText);
                console.error('- Message:', apiError.message);
                console.error('- Response Data:', apiError.response?.data);
            }
        } else {
            console.log('⚠️ No RapidAPI key found in environment variables');
        }

        // FALLBACK: Use fallback database
        console.log('📚 Checking fallback database...');
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
                    additionalInfo: 'This is cached data. Please verify with official sources.',
                    stayDuration: fallbackInfo.duration,
                    requirements: getRequirements(fallbackInfo.status),
                    cached: true,
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
        console.error('Fatal Error:', error);
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
    console.log('🔄 Processing RapidAPI response:', visaData);
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
