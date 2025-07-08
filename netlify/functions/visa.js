const axios = require('axios');

// Fallback database - only used when API is unavailable
const FALLBACK_VISA_DATABASE = {
  // Most common travel combinations for emergency fallback
  'United States': {
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' }
  },
  'United Kingdom': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit, 90 days per 180)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit, 90 days per 180)' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' }
  },
  'Canada': {
    'United States': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'United Kingdom': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' }
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
    
    console.log('========== API-FIRST VISA CHECK ==========');
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

    // PRIORITY 1: TRY RAPIDAPI FIRST (Real-time data)
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    console.log('RapidAPI Key available:', !!RAPIDAPI_KEY);
    
    if (RAPIDAPI_KEY) {
      console.log('🚀 Attempting RapidAPI call (Priority 1)...');
      
      try {
        const visaResponse = await axios.get(
          'https://visa-requirements.p.rapidapi.com/visa-requirements',
          {
            params: {
              from: cleanNationality,
              to: cleanDestination
            },
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'visa-requirements.p.rapidapi.com'
            },
            timeout: 15000
          }
        );

        console.log('✅ RapidAPI Response Status:', visaResponse.status);
        console.log('✅ RapidAPI Data:', JSON.stringify(visaResponse.data, null, 2));

        const visaData = visaResponse.data;
        if (visaData && (visaData.status || visaData.visa_requirement)) {
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
              source: 'rapidapi_live',
              note: 'Real-time visa requirements from API'
            }),
          };
        } else {
          console.log('⚠️ RapidAPI returned empty/invalid response');
        }
      } catch (apiError) {
        console.error('❌ RapidAPI Error:');
        console.error('- Status:', apiError.response?.status);
        console.error('- Message:', apiError.message);
        console.error('- Data:', apiError.response?.data);
        
        // Log specific error types
        if (apiError.response?.status === 429) {
          console.log('Rate limit exceeded, falling back...');
        } else if (apiError.response?.status === 401) {
          console.log('Authentication failed, check API key');
        } else if (apiError.code === 'ECONNABORTED') {
          console.log('Request timeout, falling back...');
        }
      }
    } else {
      console.log('⚠️ No RapidAPI key configured, skipping API call');
    }

    // PRIORITY 2: TRY ALTERNATIVE APIs
    console.log('🔄 Trying alternative API sources...');
    
    // Try alternative visa API (example - add your preferred backup API)
    try {
      console.log('Attempting backup API call...');
      // You can add other visa APIs here
      // const backupResponse = await axios.get('alternative-visa-api-url');
    } catch (backupError) {
      console.log('❌ Backup API also failed:', backupError.message);
    }

    // PRIORITY 3: Enhanced Smart Estimation
    console.log('🧠 Using enhanced smart estimation...');
    const smartResult = getEnhancedSmartEstimation(cleanNationality, cleanDestination);
    
    if (smartResult.confidence > 0.7) {
      console.log('✅ High-confidence estimation:', smartResult);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          nationality: nationality,
          destination: destination,
          visaStatus: smartResult.status,
          visaMessage: smartResult.message,
          additionalInfo: smartResult.additionalInfo,
          stayDuration: smartResult.duration,
          requirements: getRequirements(smartResult.status),
          cached: false,
          timestamp: new Date().toISOString(),
          source: 'smart_estimation',
          confidence: smartResult.confidence,
          note: 'Estimated based on country relationships and visa policies'
        }),
      };
    }

    // PRIORITY 4: Fallback Database (Emergency only)
    console.log('📚 Checking emergency fallback database...');
    const normalizedNationality = normalizeCountryName(cleanNationality);
    const normalizedDestination = normalizeCountryName(cleanDestination);
    
    const fallbackInfo = getFallbackData(normalizedNationality, normalizedDestination);
    
    if (fallbackInfo) {
      console.log('✅ Found emergency fallback data:', fallbackInfo);
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
          source: 'emergency_fallback',
          note: 'Service temporarily unavailable - showing cached data'
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

function normalizeCountryName(country) {
  const normalizations = {
    'usa': 'United States',
    'us': 'United States',
    'america': 'United States',
    'uk': 'United Kingdom',
    'britain': 'United Kingdom',
    'england': 'United Kingdom'
  };
  
  return normalizations[country.toLowerCase()] || country;
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
    } else if (requirement.includes('esta') || requirement.includes('authorization')) {
      status = 'e_visa';
      message = 'Electronic authorization required';
      duration = '90 days';
      additionalInfo = 'ESTA or similar electronic authorization required.';
    }
  }

  // Handle additional data
  if (visaData.note) {
    additionalInfo += ` ${visaData.note}`;
  }

  return {
    status,
    message,
    duration,
    additionalInfo: additionalInfo || getAdditionalInfo(status)
  };
}

function getEnhancedSmartEstimation(nationality, destination) {
  console.log(`Smart estimation for: ${nationality} → ${destination}`);
  
  // High-confidence rules based on international agreements
  const euCountries = ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Austria', 'Belgium', 'Portugal', 'Sweden', 'Denmark'];
  const schengenCountries = [...euCountries, 'Switzerland', 'Norway', 'Iceland'];
  const powerfulPassports = ['United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'Japan', 'Singapore', 'South Korea'];
  const commonwealthCountries = ['United Kingdom', 'Canada', 'Australia', 'New Zealand', 'South Africa'];
  
  // EU/Schengen travel
  if (euCountries.includes(nationality) && schengenCountries.includes(destination)) {
    return {
      status: 'visa_free',
      message: 'No visa required (EU/Schengen area)',
      duration: 'Indefinite',
      additionalInfo: 'Free movement within EU/Schengen area.',
      confidence: 0.95
    };
  }
  
  // Commonwealth countries often have favorable arrangements
  if (commonwealthCountries.includes(nationality) && commonwealthCountries.includes(destination)) {
    return {
      status: 'visa_free',
      message: 'No visa required (Commonwealth arrangement)',
      duration: '180 days',
      additionalInfo: 'Favorable visa arrangements between Commonwealth countries.',
      confidence: 0.8
    };
  }
  
  // Powerful passport estimation
  if (powerfulPassports.includes(nationality)) {
    return {
      status: 'visa_free',
      message: 'Likely no visa required for short stays',
      duration: '30-90 days',
      additionalInfo: 'Strong passport typically allows visa-free travel.',
      confidence: 0.75
    };
  }
  
  // Default low-confidence
  return {
    status: 'unknown',
    message: 'Visa requirements vary - check with embassy',
    duration: 'Check embassy guidelines',
    additionalInfo: 'Unable to determine requirements reliably.',
    confidence: 0.3
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