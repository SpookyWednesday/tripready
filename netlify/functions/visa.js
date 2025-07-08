const axios = require('axios');

// In-memory cache for API responses only
const apiCache = new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Rate limiting tracking
const rateLimitTracker = {
  lastCall: 0,
  callCount: 0,
  resetTime: 0,
  minInterval: 1000 // Minimum 1 second between API calls
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
    
    console.log('========== API-ONLY VISA CHECK ==========');
    console.log(`Request: ${nationality} → ${destination}`);

    if (!nationality || !destination) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nationality and destination parameters are required' }),
      };
    }

    const cleanNationality = cleanCountryName(nationality);
    const cleanDestination = cleanCountryName(destination);
    const cacheKey = `${cleanNationality}-${cleanDestination}`;
    
    console.log(`Cleaned: ${cleanNationality} → ${cleanDestination}`);

    // STEP 1: Check cache first
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('✅ Returning cached API result');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...cachedResult,
          cached: true,
          timestamp: new Date().toISOString()
        }),
      };
    }

    // STEP 2: API-ONLY - No database fallbacks
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    if (!RAPIDAPI_KEY) {
      throw new Error('RapidAPI key not configured');
    }

    if (!canMakeAPICall()) {
      console.log('⏱️ Rate limited - temporary delay');
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          nationality: nationality,
          destination: destination,
          visaStatus: 'rate_limited',
          visaMessage: 'Service temporarily busy - please try again in a moment',
          additionalInfo: 'API rate limit reached. Please wait before making another request.',
          stayDuration: 'Please retry',
          requirements: ['Wait and retry'],
          cached: false,
          timestamp: new Date().toISOString(),
          source: 'rate_limit'
        }),
      };
    }

    console.log('🚀 Making API call to RapidAPI...');
    
    // Update rate limit tracker
    updateRateLimitTracker();
    
    // Try multiple API parameter formats for better compatibility
    const apiFormats = [
      { from: cleanNationality, to: cleanDestination },
      { from: getAPICountryName(cleanNationality), to: getAPICountryName(cleanDestination) },
      { from: getAlternateCountryName(cleanNationality), to: getAlternateCountryName(cleanDestination) }
    ];
    
    let lastError = null;
    
    for (const [index, format] of apiFormats.entries()) {
      try {
        console.log(`API attempt ${index + 1}: ${format.from} → ${format.to}`);
        
        const visaResponse = await axios.get(
          'https://visa-requirements.p.rapidapi.com/visa-requirements',
          {
            params: format,
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'visa-requirements.p.rapidapi.com'
            },
            timeout: 15000
          }
        );

        console.log('✅ API call successful:', visaResponse.status);
        console.log('API Response:', JSON.stringify(visaResponse.data, null, 2));
        
        const processedVisa = processRapidAPIResponse(visaResponse.data);
        
        const result = {
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
          apiFormat: `${format.from} → ${format.to}`
        };
        
        // Cache successful API result
        setCacheResult(cacheKey, result);
        return { statusCode: 200, headers, body: JSON.stringify(result) };
        
      } catch (apiError) {
        console.log(`API format ${index + 1} failed:`, apiError.response?.status, apiError.message);
        lastError = apiError;
        
        // If this is a 404, try next format
        if (apiError.response?.status === 404) {
          continue;
        }
        
        // If it's a rate limit error, stop trying
        if (apiError.response?.status === 429) {
          rateLimitTracker.resetTime = Date.now() + (60 * 1000);
          break;
        }
        
        // For other errors, continue to next format
        continue;
      }
    }
    
    // All API formats failed
    console.error('❌ All API formats failed. Last error:', lastError?.response?.status, lastError?.message);
    
    // Return proper error response
    const errorStatus = lastError?.response?.status;
    let errorMessage = 'Unable to retrieve visa information';
    let errorInfo = 'Please check with embassy for current requirements.';
    
    if (errorStatus === 404) {
      errorMessage = 'Country combination not supported by visa service';
      errorInfo = 'This nationality or destination may not be supported by our visa information service.';
    } else if (errorStatus === 401) {
      errorMessage = 'Visa service authentication failed';
      errorInfo = 'There is an issue with our visa information service.';
    } else if (errorStatus === 429) {
      errorMessage = 'Visa service temporarily busy';
      errorInfo = 'Please try again in a few minutes.';
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        nationality: nationality,
        destination: destination,
        visaStatus: 'api_error',
        visaMessage: errorMessage,
        additionalInfo: errorInfo,
        stayDuration: 'Contact embassy',
        requirements: ['Check embassy website', 'Verify current requirements'],
        cached: false,
        timestamp: new Date().toISOString(),
        source: 'api_error',
        errorCode: errorStatus
      }),
    };

  } catch (error) {
    console.error('Fatal error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        nationality: event.queryStringParameters?.nationality || 'Unknown',
        destination: event.queryStringParameters?.destination || 'Unknown',
        visaStatus: 'service_error',
        visaMessage: 'Visa service temporarily unavailable',
        additionalInfo: 'Our visa information service is currently unavailable. Please try again later.',
        stayDuration: 'Contact embassy',
        requirements: ['Check embassy website'],
        cached: false,
        timestamp: new Date().toISOString(),
        source: 'service_error'
      }),
    };
  }
};

// Enhanced country cleaning for new format
function cleanCountryName(country) {
  if (!country) return '';
  
  let cleaned = country.trim();
  
  // Handle "Country, City" format - extract country
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(part => part.trim());
    cleaned = parts[0]; // Take first part (country) in new format
    console.log(`Extracted country from "${country}": "${cleaned}"`);
  }
  
  return cleaned;
}

// Convert country names to API-friendly format
function getAPICountryName(country) {
  const apiMappings = {
    'Hong Kong': 'Hong Kong SAR China',
    'Macao': 'Macao SAR China',
    'United States': 'United States of America',
    'United Kingdom': 'United Kingdom',
    'South Korea': 'Korea, South',
    'North Korea': 'Korea, North',
    'Czech Republic': 'Czechia',
    'UAE': 'United Arab Emirates'
  };
  
  return apiMappings[country] || country;
}

// Alternative country names for API compatibility
function getAlternateCountryName(country) {
  const alternateMappings = {
    'Hong Kong': 'Hong Kong',
    'Macao': 'Macau',
    'United States': 'USA',
    'United Kingdom': 'UK',
    'South Korea': 'South Korea',
    'Czech Republic': 'Czech Republic',
    'UAE': 'UAE'
  };
  
  return alternateMappings[country] || country;
}

// Cache management functions
function getCachedResult(cacheKey) {
  const cached = apiCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  if (cached) {
    apiCache.delete(cacheKey);
  }
  return null;
}

function setCacheResult(cacheKey, data) {
  apiCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  
  // Prevent memory leaks
  if (apiCache.size > 200) {
    const firstKey = apiCache.keys().next().value;
    apiCache.delete(firstKey);
  }
}

// Rate limiting functions
function canMakeAPICall() {
  const now = Date.now();
  
  if (rateLimitTracker.resetTime > now) {
    return false;
  }
  
  if ((now - rateLimitTracker.lastCall) < rateLimitTracker.minInterval) {
    return false;
  }
  
  return true;
}

function updateRateLimitTracker() {
  const now = Date.now();
  rateLimitTracker.lastCall = now;
  rateLimitTracker.callCount++;
  
  // Reset counters every hour
  if (rateLimitTracker.callCount > 100) {
    rateLimitTracker.resetTime = now + (60 * 60 * 1000);
    rateLimitTracker.callCount = 0;
  }
}

function processRapidAPIResponse(visaData) {
  let status = 'unknown';
  let message = 'Check visa requirements with embassy';
  let duration = 'Varies';
  let additionalInfo = '';

  // Handle different response formats from RapidAPI
  const visaRequirement = visaData.visa_requirement || visaData.status || visaData.result || visaData.visa_status;
  
  if (typeof visaRequirement === 'string') {
    const requirement = visaRequirement.toLowerCase().trim();
    
    if (requirement.includes('visa free') || requirement.includes('no visa required') || requirement.includes('visa not required')) {
      status = 'visa_free';
      message = 'No visa required for tourism/business';
      duration = visaData.max_stay || visaData.duration || '90 days';
      additionalInfo = 'Visa-free entry for short-term visits.';
    } else if (requirement.includes('visa required') || requirement.includes('visa is required')) {
      status = 'visa_required';
      message = 'Tourist visa required before travel';
      duration = visaData.max_stay || visaData.duration || 'Varies';
      additionalInfo = 'Apply for tourist visa at embassy/consulate before departure.';
    } else if (requirement.includes('e-visa') || requirement.includes('electronic visa') || requirement.includes('evisa')) {
      status = 'e_visa';
      message = 'Electronic visa required (apply online)';
      duration = visaData.max_stay || visaData.duration || '30 days';
      additionalInfo = 'Apply for e-visa online before travel.';
    } else if (requirement.includes('visa on arrival') || requirement.includes('arrival visa')) {
      status = 'visa_on_arrival';
      message = 'Visa available on arrival';
      duration = visaData.max_stay || visaData.duration || '30 days';
      additionalInfo = 'Visa can be obtained at port of entry.';
    } else if (requirement.includes('covid') || requirement.includes('suspended') || requirement.includes('restricted')) {
      status = 'restricted';
      message = 'Travel restrictions in place';
      duration = 'Check current status';
      additionalInfo = 'Special restrictions may apply. Check latest travel advisories.';
    }
  }

  return { 
    status, 
    message, 
    duration, 
    additionalInfo: additionalInfo || getAdditionalInfo(status) 
  };
}

function getAdditionalInfo(visaStatus) {
  const infoMap = {
    'visa_free': 'No visa required for short-term tourism or business visits. Ensure passport validity of at least 6 months.',
    'visa_required': 'Tourist visa must be obtained before travel. Apply at embassy/consulate with sufficient processing time.',
    'e_visa': 'Electronic visa can be applied for online. Print approval and carry during travel.',
    'visa_on_arrival': 'Visa can be obtained at the port of entry. Have required documents and fees ready.',
    'restricted': 'Travel may be restricted or suspended. Check latest travel advisories.',
    'unknown': 'Visa requirements could not be determined. Please verify with official sources.'
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
      'Completed visa application form',
      'Recent passport photos',
      'Visa application fee',
      'Supporting documents (bank statements, etc.)'
    ],
    'e_visa': [
      'Valid passport (6+ months validity)',
      'Digital passport photo',
      'Online application',
      'Credit card for payment',
      'Email for approval receipt'
    ],
    'visa_on_arrival': [
      'Valid passport (6+ months validity)',
      'Passport photos (2-3 pieces)',
      'Visa fee (cash in local currency)',
      'Return ticket',
      'Proof of accommodation'
    ],
    'restricted': [
      'Check latest travel advisories',
      'Contact embassy for current status',
      'May require special permissions'
    ],
    'unknown': [
      'Valid passport',
      'Check embassy requirements',
      'Verify current travel restrictions'
    ]
  };
  
  return requirementsMap[visaStatus] || requirementsMap['unknown'];
}