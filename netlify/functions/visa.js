const axios = require('axios');

// COMPLETE Country code mapping for RapidAPI (ALL 190+ countries including Hong Kong)
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
    
    return countryCodes[countryName] || countryName.substring(0, 2).toUpperCase();
}

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

        // ENHANCED RAPIDAPI CALL WITH COMPLETE COUNTRY SUPPORT
        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
        console.log('RapidAPI Key available:', !!RAPIDAPI_KEY);

        if (!RAPIDAPI_KEY) {
            console.log('❌ No RapidAPI key found');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    nationality: nationality,
                    destination: destination,
                    visaStatus: 'unknown',
                    visaMessage: 'Unable to obtain visa information',
                    additionalInfo: 'Visa service temporarily unavailable. Please check with embassy.',
                    stayDuration: 'Contact embassy for guidance',
                    requirements: ['Check embassy website', 'Contact consulate'],
                    links: [],
                    cached: false,
                    timestamp: new Date().toISOString(),
                    source: 'no_api_key',
                    error: 'Service configuration error'
                }),
            };
        }

        console.log('🚀 Attempting RapidAPI call with enhanced country support...');
        try {
            // Convert country names to proper country codes
            const passportCode = getCountryCode(cleanNationality);
            const destinationCode = getCountryCode(cleanDestination);
            
            console.log(`Country codes: ${cleanNationality} (${passportCode}) → ${cleanDestination} (${destinationCode})`);

            const visaResponse = await axios.post(
                'https://visa-requirement.p.rapidapi.com/',
                `passport=${passportCode}&destination=${destinationCode}`,
                {
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': 'visa-requirement.p.rapidapi.com',
                        'Content-Type': 'application/x-www-form-urlencoded'
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
                        links: processedVisa.links || [],
                        cached: false,
                        timestamp: new Date().toISOString(),
                        source: 'rapidapi_enhanced',
                        note: 'Real-time visa requirements with complete country support'
                    }),
                };
            } else {
                console.log('⚠️ RapidAPI returned error:', visaData.message || visaData.error);
                throw new Error('RapidAPI returned error response');
            }

        } catch (apiError) {
            console.error('❌ RapidAPI Error:');
            console.error('- Status:', apiError.response?.status);
            console.error('- Message:', apiError.message);
            console.error('- Data:', apiError.response?.data);
            throw apiError; // Re-throw to be caught by outer try-catch
        }

    } catch (error) {
        console.error('========== VISA API FATAL ERROR ==========');
        console.error('Error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                nationality: event.queryStringParameters?.nationality || 'Unknown',
                destination: event.queryStringParameters?.destination || 'Unknown',
                visaStatus: 'unknown',
                visaMessage: 'Unable to obtain visa information',
                additionalInfo: 'Visa service temporarily unavailable. Please check with embassy.',
                stayDuration: 'Contact embassy for guidance',
                requirements: ['Check embassy website', 'Contact consulate'],
                links: [],
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
    
    // Extract the key fields from RapidAPI response
    const visaRequirement = visaData.visa || '';
    const stayDuration = visaData.stay_of || 'Varies';
    const exceptionText = visaData.except_text || '';
    const rapidApiLink = visaData.link || '';
    
    // Dynamic mapping based on RapidAPI visa field
    let status = 'unknown';
    let message = 'Unable to obtain visa information';
    let additionalInfo = '';
    let links = [];
    
    // FIXED: Direct mapping of RapidAPI visa values to categories
    switch (visaRequirement.toLowerCase().trim()) {
        case 'visa not required':
            status = 'visa_free';
            message = 'No visa required for short stays';
            additionalInfo = 'Visa-free entry for tourism/business purposes.';
            break;
            
        case 'eta':
            status = 'eta';
            message = 'Electronic Travel Authorization (ETA) required';
            additionalInfo = 'Apply for ETA online before travel.';
            break;
            
        case 'esta':
            status = 'esta';
            message = 'Electronic System for Travel Authorization (ESTA) required';
            additionalInfo = 'Apply for ESTA online before travel.';
            break;
            
        case 'visa required':
            status = 'visa_required';
            message = 'Visa required before travel';
            additionalInfo = 'Apply for visa at embassy/consulate before departure.';
            break;
            
        case 'e-visa':
        case 'evisa':
        case 'electronic visa':
            status = 'e_visa';
            message = 'Electronic visa available online';
            additionalInfo = 'Apply online for e-visa before travel.';
            break;
            
        case 'visa on arrival':
        case 'on arrival':
            status = 'visa_on_arrival';
            message = 'Visa available on arrival';
            additionalInfo = 'Visa can be obtained at port of entry.';
            break;
            
        default:
            // Try partial matching for edge cases
            const visaText = visaRequirement.toLowerCase();
            if (visaText.includes('not required') || visaText.includes('visa free') || visaText.includes('exempt')) {
                status = 'visa_free';
                message = 'No visa required for short stays';
                additionalInfo = 'Visa-free entry for tourism/business purposes.';
            } else if (visaText.includes('eta')) {
                status = 'eta';
                message = 'Electronic Travel Authorization (ETA) required';
                additionalInfo = 'Apply for ETA online before travel.';
            } else if (visaText.includes('esta')) {
                status = 'esta';
                message = 'Electronic System for Travel Authorization (ESTA) required';
                additionalInfo = 'Apply for ESTA online before travel.';
            } else if (visaText.includes('required')) {
                status = 'visa_required';
                message = 'Visa required before travel';
                additionalInfo = 'Apply for visa at embassy/consulate before departure.';
            } else if (visaText.includes('e-visa') || visaText.includes('electronic')) {
                status = 'e_visa';
                message = 'Electronic visa available online';
                additionalInfo = 'Apply online for e-visa before travel.';
            } else if (visaText.includes('on arrival')) {
                status = 'visa_on_arrival';
                message = 'Visa available on arrival';
                additionalInfo = 'Visa can be obtained at port of entry.';
            } else {
                console.log('⚠️ Unrecognized visa requirement:', visaRequirement);
                status = 'unknown';
                message = 'Unable to obtain visa information';
                additionalInfo = 'Please check with embassy for current requirements.';
            }
            break;
    }
    
    // Handle RapidAPI's direct link field
    if (rapidApiLink && rapidApiLink.trim() && rapidApiLink !== '') {
        links.push({
            text: 'Apply Online',
            url: rapidApiLink.trim()
        });
    }
    
    // Handle exception text with existing HTML entity decoding logic
    if (exceptionText) {
        // Decode HTML entities first
        const decodedHtml = exceptionText
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&'); // Do this last
            
        const extractedData = extractLinksAndText(decodedHtml);
        if (extractedData.cleanText) {
            additionalInfo += ` ${extractedData.cleanText}`;
        }
        // Add extracted links to existing links array
        if (extractedData.links && extractedData.links.length > 0) {
            links = links.concat(extractedData.links);
        }
    }
    
    return {
        status: status,
        message: message,
        duration: stayDuration,
        additionalInfo: additionalInfo.trim(),
        links: links
    };
}

// Improved function to properly extract links and clean text
function extractLinksAndText(htmlText) {
    if (!htmlText) return { cleanText: '', links: [] };
    
    const links = [];
    let cleanText = htmlText;
    
    // Extract all links with proper URL handling
    const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
    let match;
    
    while ((match = linkRegex.exec(htmlText)) !== null) {
        let url = match[1];
        const linkText = match[2].replace(/<[^>]*>/g, '').trim();
        
        // CRITICAL FIX: Clean the URL of any surrounding quotes or escape characters
        url = url.replace(/^["']+|["']+$/g, ''); // Remove leading/trailing quotes
        url = url.replace(/\\"/g, '"'); // Unescape quotes
        url = url.trim(); // Remove whitespace
        
        // Ensure URL is absolute
        if (url.startsWith('//')) {
            url = 'https:' + url;
        } else if (url.startsWith('/') && !url.startsWith('//')) {
            url = 'https://www.mofa.go.jp' + url;
        } else if (!url.startsWith('http') && !url.startsWith('//')) {
            url = 'https://' + url;
        }
        
        // Additional validation: Only add if URL looks valid
        if (url && url.length > 3 && !url.includes('"')) {
            links.push({
                text: linkText || 'Apply Online',
                url: url
            });
        }
        
        // Replace the link in the text with just the link text
        cleanText = cleanText.replace(match[0], linkText);
    }
    
    // Clean up remaining HTML
    cleanText = cleanText
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    
    return {
        cleanText: cleanText,
        links: links
    };
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
        'eta': [
            'Valid passport (6+ months validity)',
            'Online ETA application',
            'Credit card for payment',
            'Email for approval receipt'
        ],
        'esta': [
            'Valid passport (6+ months validity)',
            'Online ESTA application',
            'Credit card for payment',
            'Travel authorization approval'
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