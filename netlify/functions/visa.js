const axios = require('axios');

// In-memory cache for API responses only
const apiCache = new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// FIXED: Proper rate limiting tracking
const rateLimitTracker = {
  lastCall: 0,
  callCount: 0,
  resetTime: 0,
  minInterval: 500, // 500ms between calls
  maxCallsPerHour: 100
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
    
    console.log('========== VISA API FUNCTION CALLED ==========');
    console.log(`Request: ${nationality} → ${destination}`);
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Rate tracker:`, {
      lastCall: rateLimitTracker.lastCall,
      callCount: rateLimitTracker.callCount,
      resetTime: rateLimitTracker.resetTime
    });

    if (!nationality || !destination) {
      console.log('❌ Missing parameters');
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
    console.log(`Cache key: ${cacheKey}`);

    // STEP 1: Check cache first
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('✅ Cache hit - returning cached result');
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
    console.log('💾 No cache hit');

    // STEP 2: Check API key
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    if (!RAPIDAPI_KEY) {
      console.error('❌ RapidAPI key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          nationality: nationality,
          destination: destination,
          visaStatus: 'configuration_error',
          visaMessage: 'Visa service configuration error',
          additionalInfo: 'Service temporarily unavailable due to configuration issue.',
          stayDuration: 'Contact embassy',
          requirements: ['Check embassy website'],
          cached: false,
          timestamp: new Date().toISOString(),
          source: 'config_error'
        }),
      };
    }
    console.log('✅ RapidAPI key found');

    // STEP 3: FIXED rate limiting check
    const canMakeCall = canMakeAPICall();
    console.log(`Rate limit check result: ${canMakeCall}`);
    
    if (!canMakeCall) {
      console.log('⏱️ Rate limited');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          nationality: nationality,
          destination: destination,
          visaStatus: 'rate_limited',
          visaMessage: 'Too many requests - please wait',
          additionalInfo: 'API rate limit reached. Please wait before trying again.',
          stayDuration: 'Please retry',
          requirements: ['Wait and retry'],
          cached: false,
          timestamp: new Date().toISOString(),
          source: 'rate_limit'
        }),
      };
    }

    console.log('🚀 Making API call to RapidAPI...');
    
    // Update rate limit tracker BEFORE API call
    updateRateLimitTracker();
    
    // Try multiple API parameter formats
    const apiFormats = [
      { from: cleanNationality, to: cleanDestination },
      { from: getAPICountryName(cleanNationality), to: getAPICountryName(cleanDestination) },
      { from: getAlternateCountryName(cleanNationality), to: getAlternateCountryName(cleanDestination) }
    ];
    
    let lastError = null;
    
    for (const [index, format] of apiFormats.entries()) {
      try {
        console.log(`🔄 API attempt ${index + 1}: ${format.from} → ${format.to}`);
        
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

        console.log('✅ API call successful!');
        console.log('📊 Response status:', visaResponse.status);
        console.log('📋 Response data:', JSON.stringify(visaResponse.data, null, 2));
        
        const processedVisa = processRapidAPIResponse(visaResponse.data);
        console.log('🔄 Processed visa:', processedVisa);
        
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
          apiFormat: `${format.from} → ${format.to}`,
          success: true
        };
        
        console.log('✅ Final result:', result);
        
        // Cache successful result
        setCacheResult(cacheKey, result);
        
        return { 
          statusCode: 200, 
          headers, 
          body: JSON.stringify(result) 
        };
        
      } catch (apiError) {
        console.log(`❌ API attempt ${index + 1} failed:`, {
          status: apiError.response?.status,
          message: apiError.message,
          data: apiError.response?.data
        });
        
        lastError = apiError;
        
        // Handle specific error cases
        if (apiError.response?.status === 404) {
          console.log('404 - Trying next format...');
          continue;
        }
        
        if (apiError.response?.status === 429) {
          console.log('429 - Rate limited by API');
          rateLimitTracker.resetTime = Date.now() + (60 * 1000);
          break;
        }
        
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          console.log('Auth error - stopping attempts');
          break;
        }
        
        continue;
      }
    }
    
    // All API attempts failed
    console.error('💥 All API attempts failed');
    console.error('Last error details:', {
      status: lastError?.response?.status,
      message: lastError?.message,
      data: lastError?.response?.data
    });
    
    const errorStatus = lastError?.response?.status;
    let errorMessage = 'Unable to retrieve visa information';
    let errorInfo = 'Please check with embassy for current requirements.';
    let visaStatus = 'api_error';
    
    if (errorStatus === 404) {
      errorMessage = 'Country combination not supported';
      errorInfo = 'This nationality/destination combination may not be supported.';
      visaStatus = 'unsupported';
    } else if (errorStatus === 401 || errorStatus === 403) {
      errorMessage = 'API authentication failed';
      errorInfo = 'There is an issue with the visa service authentication.';
      visaStatus = 'auth_error';
    } else if (errorStatus === 429) {
      errorMessage = 'API rate limited';
      errorInfo = 'Too many requests to the visa service.';
      visaStatus = 'api_rate_limited';
    }
    
    const errorResult = {
      nationality: nationality,
      destination: destination,
      visaStatus: visaStatus,
      visaMessage: errorMessage,
      additionalInfo: errorInfo,
      stayDuration: 'Contact embassy',
      requirements: ['Check embassy website'],
      cached: false,
      timestamp: new Date().toISOString(),
      source: 'api_error',
      errorCode: errorStatus,
      success: false
    };
    
    console.log('📤 Returning error result:', errorResult);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(errorResult),
    };

  } catch (error) {
    console.error('💥 Fatal function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        nationality: event.queryStringParameters?.nationality || 'Unknown',
        destination: event.queryStringParameters?.destination || 'Unknown',
        visaStatus: 'service_error',
        visaMessage: 'Visa service temporarily unavailable',
        additionalInfo: 'Internal service error occurred.',
        stayDuration: 'Contact embassy',
        requirements: ['Check embassy website'],
        cached: false,
        timestamp: new Date().toISOString(),
        source: 'fatal_error',
        error: error.message
      }),
    };
  }
};

// Enhanced country cleaning
function cleanCountryName(country) {
  if (!country) return '';
  
  let cleaned = country.trim();
  
  // Handle "Country, City" format - extract country
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(part => part.trim());
    cleaned = parts[0]; // Take first part (country)
    console.log(`🔄 Extracted country from "${country}": "${cleaned}"`);
  }
  
  return cleaned;
}

// API country name mappings
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

// Alternative country names
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

// Cache functions
function getCachedResult(cacheKey) {
  const cached = apiCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`📦 Cache hit for: ${cacheKey}`);
    return cached.data;
  }
  if (cached) {
    console.log(`🗑️ Cache expired for: ${cacheKey}`);
    apiCache.delete(cacheKey);
  }
  return null;
}

function setCacheResult(cacheKey, data) {
  apiCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached result for: ${cacheKey}`);
  
  // Prevent memory leaks
  if (apiCache.size > 100) {
    const firstKey = apiCache.keys().next().value;
    apiCache.delete(firstKey);
  }
}

// FIXED: Proper rate limiting logic
function canMakeAPICall() {
  const now = Date.now();
  
  console.log('🔍 Rate limit check:', {
    now,
    lastCall: rateLimitTracker.lastCall,
    resetTime: rateLimitTracker.resetTime,
    timeSinceLastCall: now - rateLimitTracker.lastCall,
    minInterval: rateLimitTracker.minInterval
  });
  
  // Check if we're in a timeout period
  if (rateLimitTracker.resetTime > 0 && rateLimitTracker.resetTime > now) {
    console.log('❌ In timeout period');
    return false;
  }
  
  // Reset timeout if it has passed
  if (rateLimitTracker.resetTime > 0 && rateLimitTracker.resetTime <= now) {
    console.log('✅ Timeout period ended, resetting');
    rateLimitTracker.resetTime = 0;
    rateLimitTracker.callCount = 0;
  }
  
  // FIXED: Check minimum interval (only if we've made a call before)
  if (rateLimitTracker.lastCall > 0 && (now - rateLimitTracker.lastCall) < rateLimitTracker.minInterval) {
    console.log('❌ Too soon since last call');
    return false;
  }
  
  // Check maximum calls per hour
  if (rateLimitTracker.callCount >= rateLimitTracker.maxCallsPerHour) {
    console.log('❌ Max calls per hour exceeded');
    rateLimitTracker.resetTime = now + (60 * 60 * 1000); // 1 hour timeout
    return false;
  }
  
  console.log('✅ Rate limit check passed');
  return true;
}

function updateRateLimitTracker() {
  const now = Date.now();
  rateLimitTracker.lastCall = now;
  rateLimitTracker.callCount++;
  
  console.log('📊 Rate limit updated:', {
    lastCall: now,
    callCount: rateLimitTracker.callCount,
    maxCalls: rateLimitTracker.maxCallsPerHour
  });
}

function processRapidAPIResponse(visaData) {
  console.log('🔄 Processing API response:', visaData);
  
  let status = 'unknown';
  let message = 'Check visa requirements';
  let duration = 'Varies';
  let additionalInfo = '';

  // Handle different response formats
  const visaRequirement = visaData.visa_requirement || 
                          visaData.status || 
                          visaData.result || 
                          visaData.visa_status || 
                          visaData.requirement;
  
  console.log('📋 Visa requirement found:', visaRequirement);
  
  if (typeof visaRequirement === 'string') {
    const requirement = visaRequirement.toLowerCase().trim();
    
    if (requirement.includes('visa free') || requirement.includes('no visa required')) {
      status = 'visa_free';
      message = 'No visa required for tourism/business';
      duration = visaData.max_stay || visaData.duration || '90 days';
      additionalInfo = 'Visa-free entry for short-term visits.';
    } else if (requirement.includes('visa required') || requirement.includes('visa is required')) {
      status = 'visa_required';
      message = 'Tourist visa required before travel';
      duration = visaData.max_stay || visaData.duration || 'Varies';
      additionalInfo = 'Apply for tourist visa at embassy/consulate before departure.';
    } else if (requirement.includes('e-visa') || requirement.includes('electronic visa')) {
      status = 'e_visa';
      message = 'Electronic visa required (apply online)';
      duration = visaData.max_stay || visaData.duration || '30 days';
      additionalInfo = 'Apply for e-visa online before travel.';
    } else if (requirement.includes('visa on arrival')) {
      status = 'visa_on_arrival';
      message = 'Visa available on arrival';
      duration = visaData.max_stay || visaData.duration || '30 days';
      additionalInfo = 'Visa can be obtained at port of entry.';
    }
  }

  const result = { 
    status, 
    message, 
    duration, 
    additionalInfo: additionalInfo || getAdditionalInfo(status) 
  };
  
  console.log('✅ Processed result:', result);
  return result;
}

function getAdditionalInfo(visaStatus) {
  const infoMap = {
    'visa_free': 'No visa required for short-term tourism or business visits.',
    'visa_required': 'Tourist visa must be obtained before travel.',
    'e_visa': 'Electronic visa can be applied for online.',
    'visa_on_arrival': 'Visa can be obtained at the port of entry.',
    'unknown': 'Visa requirements could not be determined.'
  };
  
  return infoMap[visaStatus] || infoMap['unknown'];
}

function getRequirements(visaStatus) {
  const requirementsMap = {
    'visa_free': [
      'Valid passport (6+ months validity)',
      'Return/onward ticket',
      'Proof of accommodation'
    ],
    'visa_required': [
      'Valid passport (6+ months validity)',
      'Completed visa application',
      'Visa application fee',
      'Supporting documents'
    ],
    'e_visa': [
      'Valid passport (6+ months validity)',
      'Online application',
      'Digital passport photo',
      'Credit card for payment'
    ],
    'visa_on_arrival': [
      'Valid passport (6+ months validity)',
      'Visa fee (cash)',
      'Return ticket'
    ],
    'unknown': [
      'Valid passport',
      'Check embassy requirements'
    ]
  };
  
  return requirementsMap[visaStatus] || requirementsMap['unknown'];
}