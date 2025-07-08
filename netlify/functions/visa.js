const axios = require('axios');

// In-memory cache for API responses (survives for function lifetime)
const apiCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting tracking
const rateLimitTracker = {
  lastCall: 0,
  callCount: 0,
  resetTime: 0,
  minInterval: 2000 // Minimum 2 seconds between API calls
};

// ENHANCED fallback database with Hong Kong support
const COMPREHENSIVE_FALLBACK_DATABASE = {
  'United States': {
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Italy': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Spain': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Netherlands': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'New Zealand': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (NZeTA) required' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Hong Kong': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Macao': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Brazil': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'Mexico': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'China': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'India': { status: 'e_visa', duration: '30 days', message: 'e-Tourist visa available online' },
    'Russia': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'UAE': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Turkey': { status: 'e_visa', duration: '90 days', message: 'e-Visa required (apply online)' }
  },
  
  'United Kingdom': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Hong Kong': { status: 'visa_free', duration: '180 days', message: 'No visa required (British National connection)' },
    'Macao': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit, 90 days per 180)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit, 90 days per 180)' },
    'Italy': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit, 90 days per 180)' },
    'Spain': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit, 90 days per 180)' },
    'Netherlands': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit, 90 days per 180)' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'New Zealand': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Brazil': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'China': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'India': { status: 'e_visa', duration: '30 days', message: 'e-Tourist visa available online' },
    'Russia': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'UAE': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Turkey': { status: 'e_visa', duration: '90 days', message: 'e-Visa required (apply online)' }
  },
  
  'Canada': {
    'United States': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'United Kingdom': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Hong Kong': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'New Zealand': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'Mexico': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' }
  },
  
  'Australia': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'New Zealand': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (Trans-Tasman agreement)' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Hong Kong': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' }
  },
  
  'Germany': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Hong Kong': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'France': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (EU citizen)' },
    'Italy': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (EU citizen)' },
    'Spain': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (EU citizen)' },
    'Netherlands': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (EU citizen)' }
  },
  
  'Japan': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Hong Kong': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' }
  },

  // ADDED: Hong Kong as nationality
  'Hong Kong': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '180 days', message: 'No visa required (British National connection)' },
    'Canada': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Italy': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Spain': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Netherlands': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'China': { status: 'visa_free', duration: '7 days', message: 'No visa required for short visits (Hong Kong SAR passport)' },
    'Macao': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (Special Administrative Region)' },
    'Taiwan': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' }
  },

  // ADDED: Macao as nationality
  'Macao': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Canada': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Hong Kong': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (Special Administrative Region)' },
    'China': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (Special Administrative Region)' },
    'Singapore': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' }
  },

  // ADDED: Singapore with Hong Kong
  'Singapore': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Hong Kong': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' }
  }
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
    
    console.log('========== SMART VISA CHECK ==========');
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
    console.log(`Cache key: ${cacheKey}`);

    // STEP 1: Check cache first
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('✅ Returning cached result');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ...cachedResult,
          cached: true,
          timestamp: new Date().toISOString(),
          note: 'Cached result to avoid rate limits'
        }),
      };
    }

    // STEP 2: Check comprehensive fallback database
    console.log('🗄️ Checking comprehensive database...');
    const normalizedNationality = normalizeCountryName(cleanNationality);
    const normalizedDestination = normalizeCountryName(cleanDestination);
    
    console.log(`Normalized: ${normalizedNationality} → ${normalizedDestination}`);
    
    const databaseResult = getFallbackData(normalizedNationality, normalizedDestination);
    if (databaseResult) {
      console.log('✅ Found in comprehensive database:', databaseResult);
      const result = {
        nationality: nationality,
        destination: destination,
        visaStatus: databaseResult.status,
        visaMessage: databaseResult.message,
        additionalInfo: getAdditionalInfo(databaseResult.status),
        stayDuration: databaseResult.duration,
        requirements: getRequirements(databaseResult.status),
        cached: false,
        timestamp: new Date().toISOString(),
        source: 'comprehensive_database'
      };
      
      // Cache the result
      setCacheResult(cacheKey, result);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    } else {
      console.log('❌ Not found in database');
    }

    // STEP 3: Try API if rate limits allow (with better error handling)
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    if (RAPIDAPI_KEY && canMakeAPICall()) {
      console.log('🚀 Attempting rate-limited API call...');
      
      try {
        // Update rate limit tracker
        updateRateLimitTracker();
        
        // Try different API parameter formats for special territories
        const apiNationality = getAPICountryName(cleanNationality);
        const apiDestination = getAPICountryName(cleanDestination);
        
        console.log(`API call with: ${apiNationality} → ${apiDestination}`);
        
        const visaResponse = await axios.get(
          'https://visa-requirements.p.rapidapi.com/visa-requirements',
          {
            params: {
              from: apiNationality,
              to: apiDestination
            },
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'visa-requirements.p.rapidapi.com'
            },
            timeout: 10000
          }
        );

        console.log('✅ API call successful:', visaResponse.status);
        console.log('API Response:', JSON.stringify(visaResponse.data, null, 2));
        
        const processedVisa = processRapidAPIResponse(visaResponse.data);
        
        if (processedVisa.status !== 'unknown') {
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
            source: 'rapidapi_live'
          };
          
          // Cache successful API result
          setCacheResult(cacheKey, result);
          return { statusCode: 200, headers, body: JSON.stringify(result) };
        }
        
      } catch (apiError) {
        console.error('❌ API Error:', apiError.response?.status, apiError.message);
        console.error('API Error Details:', apiError.response?.data);
        
        // Handle specific rate limit errors
        if (apiError.response?.status === 429) {
          console.log('⏱️ Rate limited - using database fallback');
          rateLimitTracker.resetTime = Date.now() + (60 * 1000); // Block for 1 minute
        } else if (apiError.response?.status === 404) {
          console.log('🔍 404 Error - API doesn\'t recognize country combination');
        } else if (apiError.response?.status === 401) {
          console.log('🔑 401 Error - API authentication failed');
        }
      }
    } else {
      console.log('⏸️ Skipping API call due to rate limits or missing key');
    }

    // STEP 4: Enhanced smart estimation
    console.log('🧠 Using enhanced smart estimation...');
    const smartResult = getEnhancedSmartEstimation(normalizedNationality, normalizedDestination);
    
    const result = {
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
      confidence: smartResult.confidence
    };
    
    // Cache smart estimation if high confidence
    if (smartResult.confidence > 0.8) {
      setCacheResult(cacheKey, result);
    }
    
    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (error) {
    console.error('Fatal error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        nationality: event.queryStringParameters?.nationality || 'Unknown',
        destination: event.queryStringParameters?.destination || 'Unknown',
        visaStatus: 'unknown',
        visaMessage: 'Service temporarily unavailable',
        additionalInfo: 'Please check with embassy for current requirements.',
        stayDuration: 'Contact embassy',
        requirements: ['Check embassy website'],
        cached: false,
        timestamp: new Date().toISOString(),
        source: 'error_fallback'
      }),
    };
  }
};

// Enhanced country cleaning for city/country combinations
function cleanCountryName(country) {
  if (!country) return '';
  
  let cleaned = country.trim();
  
  // Handle "City, Country" format - extract country
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(part => part.trim());
    cleaned = parts[parts.length - 1];
    console.log(`Extracted country from "${country}": "${cleaned}"`);
  }
  
  return cleaned;
}

function normalizeCountryName(country) {
  const normalizations = {
    'usa': 'United States',
    'us': 'United States', 
    'america': 'United States',
    'uk': 'United Kingdom',
    'britain': 'United Kingdom',
    'england': 'United Kingdom',
    'korea': 'South Korea',
    'south korea': 'South Korea',
    'hk': 'Hong Kong',
    'hong kong sar': 'Hong Kong',
    'macau': 'Macao',
    'macao sar': 'Macao'
  };
  
  const result = normalizations[country.toLowerCase()] || country;
  console.log(`Normalized "${country}" → "${result}"`);
  return result;
}

// Convert country names to API-friendly format
function getAPICountryName(country) {
  const apiMappings = {
    'Hong Kong': 'Hong Kong SAR China',
    'Macao': 'Macao SAR China',
    'United States': 'United States',
    'United Kingdom': 'United Kingdom', 
    'South Korea': 'South Korea'
  };
  
  return apiMappings[country] || country;
}

// Cache management functions
function getCachedResult(cacheKey) {
  const cached = apiCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  if (cached) {
    apiCache.delete(cacheKey); // Remove expired cache
  }
  return null;
}

function setCacheResult(cacheKey, data) {
  apiCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  
  // Prevent memory leaks - limit cache size
  if (apiCache.size > 100) {
    const firstKey = apiCache.keys().next().value;
    apiCache.delete(firstKey);
  }
}

// Rate limiting functions
function canMakeAPICall() {
  const now = Date.now();
  
  // Check if we're in a rate limit timeout
  if (rateLimitTracker.resetTime > now) {
    return false;
  }
  
  // Check minimum interval between calls
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
  if (rateLimitTracker.callCount > 50) {
    rateLimitTracker.resetTime = now + (60 * 60 * 1000); // Block for 1 hour
    rateLimitTracker.callCount = 0;
  }
}

function getFallbackData(nationality, destination) {
  // Direct exact match
  if (COMPREHENSIVE_FALLBACK_DATABASE[nationality] && COMPREHENSIVE_FALLBACK_DATABASE[nationality][destination]) {
    console.log(`✅ Direct match: ${nationality} → ${destination}`);
    return COMPREHENSIVE_FALLBACK_DATABASE[nationality][destination];
  }
  
  // Try case-insensitive matches
  for (const [dbNationality, destinations] of Object.entries(COMPREHENSIVE_FALLBACK_DATABASE)) {
    if (nationality.toLowerCase() === dbNationality.toLowerCase()) {
      console.log(`Found nationality match: ${dbNationality}`);
      for (const [dbDestination, info] of Object.entries(destinations)) {
        if (destination.toLowerCase() === dbDestination.toLowerCase()) {
          console.log(`✅ Case-insensitive match: ${dbDestination}`);
          return info;
        }
      }
    }
  }
  
  console.log(`❌ No database match for: ${nationality} → ${destination}`);
  return null;
}

function processRapidAPIResponse(visaData) {
  let status = 'unknown';
  let message = 'Check with embassy';
  let duration = 'Varies';
  let additionalInfo = '';

  const visaRequirement = visaData.visa_requirement || visaData.status || visaData.result;
  
  if (typeof visaRequirement === 'string') {
    const requirement = visaRequirement.toLowerCase();
    
    if (requirement.includes('visa free') || requirement.includes('no visa required')) {
      status = 'visa_free';
      message = 'No visa required for short stays';
      duration = visaData.max_stay || '90 days';
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

  return { status, message, duration, additionalInfo: additionalInfo || getAdditionalInfo(status) };
}

function getEnhancedSmartEstimation(nationality, destination) {
  const euCountries = ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Austria', 'Belgium', 'Portugal'];
  const powerfulPassports = ['United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'Japan', 'Singapore', 'Hong Kong'];
  
  // Special case: Hong Kong
  if (nationality === 'Hong Kong') {
    return {
      status: 'visa_free',
      message: 'Likely no visa required (Hong Kong SAR passport)',
      duration: '30-90 days',
      additionalInfo: 'Hong Kong SAR passport typically allows visa-free travel to many destinations.',
      confidence: 0.85
    };
  }
  
  if (euCountries.includes(nationality) && euCountries.includes(destination)) {
    return {
      status: 'visa_free',
      message: 'No visa required (EU/Schengen area)',
      duration: 'Indefinite',
      additionalInfo: 'Free movement within EU/Schengen area.',
      confidence: 0.95
    };
  }
  
  if (powerfulPassports.includes(nationality)) {
    return {
      status: 'visa_free',
      message: 'Likely no visa required for short stays',
      duration: '30-90 days',
      additionalInfo: 'Strong passport typically allows visa-free travel.',
      confidence: 0.8
    };
  }
  
  return {
    status: 'unknown',
    message: 'Visa requirements vary - check with embassy',
    duration: 'Check embassy guidelines',
    additionalInfo: 'Unable to determine requirements reliably. Please verify with official sources.',
    confidence: 0.4
  };
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
      'Supporting documents'
    ],
    'e_visa': [
      'Valid passport (6+ months validity)',
      'Digital passport photo',
      'Online application',
      'Credit card for payment'
    ],
    'visa_on_arrival': [
      'Valid passport (6+ months validity)',
      'Passport photos',
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