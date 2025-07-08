const axios = require('axios');

// Comprehensive visa requirements database
const VISA_DATABASE = {
  // US Citizens
  'United States': {
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Mexico': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Italy': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Spain': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Netherlands': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'New Zealand': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (NZeTA) required' },
    'China': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'India': { status: 'e_visa', duration: '30 days', message: 'e-Tourist visa available online' },
    'Russia': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'Brazil': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'UAE': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Turkey': { status: 'e_visa', duration: '90 days', message: 'e-Visa required (apply online)' }
  },
  
  // UK Citizens
  'United Kingdom': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'New Zealand': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit rules apply)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit rules apply)' },
    'Italy': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit rules apply)' },
    'Spain': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit rules apply)' },
    'Netherlands': { status: 'visa_free', duration: '90 days', message: 'No visa required (post-Brexit rules apply)' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'China': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'India': { status: 'e_visa', duration: '30 days', message: 'e-Tourist visa available online' },
    'Russia': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'Brazil': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'UAE': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Turkey': { status: 'e_visa', duration: '90 days', message: 'e-Visa required (apply online)' }
  },
  
  // Canadian Citizens
  'Canada': {
    'United States': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'United Kingdom': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Mexico': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Italy': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Spain': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Netherlands': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'New Zealand': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'China': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'India': { status: 'e_visa', duration: '30 days', message: 'e-Tourist visa available online' },
    'Russia': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'Brazil': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'UAE': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Turkey': { status: 'e_visa', duration: '90 days', message: 'e-Visa required (apply online)' }
  },
  
  // Australian Citizens
  'Australia': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'New Zealand': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (Trans-Tasman agreement)' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Italy': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Spain': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Netherlands': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'China': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'India': { status: 'e_visa', duration: '30 days', message: 'e-Tourist visa available online' },
    'Russia': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'Brazil': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'UAE': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Turkey': { status: 'e_visa', duration: '90 days', message: 'e-Visa required (apply online)' }
  },
  
  // German Citizens (EU/Schengen)
  'Germany': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'New Zealand': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'France': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (EU citizen)' },
    'Italy': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (EU citizen)' },
    'Spain': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (EU citizen)' },
    'Netherlands': { status: 'visa_free', duration: 'Indefinite', message: 'No visa required (EU citizen)' },
    'Japan': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'China': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'India': { status: 'e_visa', duration: '30 days', message: 'e-Tourist visa available online' },
    'Russia': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'Brazil': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'UAE': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Turkey': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism' }
  },
  
  // Japanese Citizens
  'Japan': {
    'United States': { status: 'e_visa', duration: '90 days', message: 'ESTA authorization required' },
    'United Kingdom': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'Canada': { status: 'visa_free', duration: '180 days', message: 'No visa required for tourism/business' },
    'Australia': { status: 'e_visa', duration: '90 days', message: 'Electronic Travel Authority (ETA) required' },
    'Germany': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'France': { status: 'visa_free', duration: '90 days', message: 'No visa required (Schengen area)' },
    'South Korea': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' },
    'China': { status: 'visa_required', duration: 'Varies', message: 'Tourist visa required before travel' },
    'India': { status: 'e_visa', duration: '30 days', message: 'e-Tourist visa available online' },
    'Thailand': { status: 'visa_free', duration: '30 days', message: 'No visa required for tourism' },
    'Singapore': { status: 'visa_free', duration: '90 days', message: 'No visa required for tourism/business' }
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
    
    console.log(`Visa check request: ${nationality} to ${destination}`);

    if (!nationality || !destination) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nationality and destination parameters are required' }),
      };
    }

    // FIXED: Improved country name normalization
    const normalizedNationality = normalizeCountryName(nationality);
    const normalizedDestination = normalizeCountryName(destination);
    
    console.log(`Normalized: "${normalizedNationality}" to "${normalizedDestination}"`);

    // FIXED: Enhanced database lookup with better matching
    const visaInfo = getVisaFromDatabase(normalizedNationality, normalizedDestination);
    
    if (visaInfo) {
      console.log('✅ Found visa info in database:', visaInfo);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          nationality: nationality,
          destination: destination,
          visaStatus: visaInfo.status,
          visaMessage: visaInfo.message,
          additionalInfo: getAdditionalInfo(visaInfo.status),
          stayDuration: visaInfo.duration,
          requirements: getRequirements(visaInfo.status),
          cached: false,
          timestamp: new Date().toISOString(),
          source: 'comprehensive_database'
        }),
      };
    }

    console.log('❌ No match found in database, trying fallbacks...');

    // Try RapidAPI as fallback (if API key available)
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    if (RAPIDAPI_KEY) {
      try {
        console.log('Trying RapidAPI as fallback...');
        const visaResponse = await axios.get(
          'https://visa-requirements.p.rapidapi.com/visa-requirements',
          {
            params: {
              from: nationality,
              to: destination
            },
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'visa-requirements.p.rapidapi.com'
            },
            timeout: 10000
          }
        );

        const visaData = visaResponse.data;
        if (visaData && visaData.status) {
          const processedVisa = processRapidAPIResponse(visaData);
          console.log('RapidAPI success:', processedVisa);
          
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
              source: 'rapidapi'
            }),
          };
        }
      } catch (apiError) {
        console.error('RapidAPI failed:', apiError.message);
      }
    }

    // Final fallback with smart estimation
    console.log('Using smart fallback...');
    const smartFallback = getSmartFallback(normalizedNationality, normalizedDestination);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        nationality: nationality,
        destination: destination,
        visaStatus: smartFallback.status,
        visaMessage: smartFallback.message,
        additionalInfo: 'This is an estimated requirement. Please verify with official sources.',
        stayDuration: smartFallback.duration,
        requirements: getRequirements(smartFallback.status),
        cached: false,
        timestamp: new Date().toISOString(),
        source: 'smart_fallback',
        note: 'Please verify with embassy or official sources'
      }),
    };

  } catch (error) {
    console.error('Visa handler error:', error);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        nationality: event.queryStringParameters?.nationality || 'Unknown',
        destination: event.queryStringParameters?.destination || 'Unknown',
        visaStatus: 'unknown',
        visaMessage: 'Unable to determine visa requirements',
        additionalInfo: 'Please check with embassy for current requirements.',
        stayDuration: 'Check embassy guidelines',
        requirements: ['Valid passport', 'Check embassy website'],
        cached: false,
        timestamp: new Date().toISOString(),
        source: 'error_fallback',
        error: 'Service temporarily unavailable'
      }),
    };
  }
};

// FIXED: Improved normalization function
function normalizeCountryName(country) {
  if (!country) return '';
  
  // Remove extra whitespace and convert to proper case
  country = country.trim();
  
  // Handle destination formats like "Paris, France" or "Tokyo, Japan"
  if (country.includes(',')) {
    const parts = country.split(',').map(part => part.trim());
    // Take the last part (usually the country)
    country = parts[parts.length - 1];
  }
  
  // Normalize common country name variations
  const normalizations = {
    // US variations
    'usa': 'United States',
    'us': 'United States',
    'america': 'United States',
    'united states of america': 'United States',
    
    // UK variations
    'uk': 'United Kingdom',
    'britain': 'United Kingdom',
    'great britain': 'United Kingdom',
    'england': 'United Kingdom',
    'scotland': 'United Kingdom',
    'wales': 'United Kingdom',
    
    // Other common variations
    'korea': 'South Korea',
    'south korea': 'South Korea',
    'uae': 'UAE',
    'emirates': 'UAE',
    'united arab emirates': 'UAE',
    
    // European countries
    'deutschland': 'Germany',
    'holland': 'Netherlands',
    
    // Asian countries
    'nippon': 'Japan',
    'nihon': 'Japan'
  };
  
  const lowerCountry = country.toLowerCase();
  const normalized = normalizations[lowerCountry] || country;
  
  // Convert to proper case (capitalize first letter of each word)
  return normalized.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

// FIXED: Enhanced database lookup with better matching logic
function getVisaFromDatabase(nationality, destination) {
  console.log(`🔍 Looking up: "${nationality}" → "${destination}"`);
  
  // Direct exact match first
  if (VISA_DATABASE[nationality] && VISA_DATABASE[nationality][destination]) {
    console.log('✅ Found exact match');
    return VISA_DATABASE[nationality][destination];
  }
  
  // Check all possible nationality variations
  for (const [dbNationality, destinations] of Object.entries(VISA_DATABASE)) {
    if (nationality.toLowerCase() === dbNationality.toLowerCase()) {
      console.log(`🔍 Found nationality match: ${dbNationality}`);
      
      // Check exact destination match
      if (destinations[destination]) {
        console.log('✅ Found exact destination match');
        return destinations[destination];
      }
      
      // Check partial destination matches
      for (const [dbDestination, info] of Object.entries(destinations)) {
        if (destination.toLowerCase().includes(dbDestination.toLowerCase()) || 
            dbDestination.toLowerCase().includes(destination.toLowerCase())) {
          console.log(`✅ Found partial destination match: ${dbDestination}`);
          return info;
        }
      }
    }
  }
  
  // Check partial nationality matches
  for (const [dbNationality, destinations] of Object.entries(VISA_DATABASE)) {
    if (nationality.toLowerCase().includes(dbNationality.toLowerCase()) || 
        dbNationality.toLowerCase().includes(nationality.toLowerCase())) {
      console.log(`🔍 Found partial nationality match: ${dbNationality}`);
      
      // Check destination matches for this nationality
      for (const [dbDestination, info] of Object.entries(destinations)) {
        if (destination.toLowerCase() === dbDestination.toLowerCase() ||
            destination.toLowerCase().includes(dbDestination.toLowerCase()) || 
            dbDestination.toLowerCase().includes(destination.toLowerCase())) {
          console.log(`✅ Found destination match: ${dbDestination}`);
          return info;
        }
      }
    }
  }
  
  console.log('❌ No match found in database');
  return null;
}

function getSmartFallback(nationality, destination) {
  // EU/Schengen logic
  const euCountries = ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Austria', 'Belgium', 'Portugal'];
  const powerfulPassports = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'Japan', 'Singapore'];
  
  if (euCountries.includes(nationality) && euCountries.includes(destination)) {
    return {
      status: 'visa_free',
      message: 'No visa required (EU/Schengen area)',
      duration: 'Indefinite'
    };
  }
  
  if (powerfulPassports.includes(nationality)) {
    return {
      status: 'visa_free',
      message: 'Likely no visa required for short stays (estimated)',
      duration: '30-90 days (estimated)'
    };
  }
  
  return {
    status: 'unknown',
    message: 'Visa requirements vary - check with embassy',
    duration: 'Check embassy guidelines'
  };
}

function processRapidAPIResponse(visaData) {
  let status = 'unknown';
  let message = 'Check with embassy';
  let duration = 'Check embassy guidelines';

  if (visaData && visaData.status) {
    const statusText = visaData.status.toLowerCase();

    if (statusText.includes('visa free') || statusText.includes('no visa')) {
      status = 'visa_free';
      message = 'No visa required';
      duration = visaData.stay_duration || '90 days';
    } else if (statusText.includes('visa required')) {
      status = 'visa_required';
      message = 'Visa required before travel';
    } else if (statusText.includes('e-visa') || statusText.includes('electronic')) {
      status = 'e_visa';
      message = 'Electronic visa (e-Visa) available';
    } else if (statusText.includes('visa on arrival')) {
      status = 'visa_on_arrival';
      message = 'Visa on arrival available';
      duration = visaData.stay_duration || '30 days';
    }
  }

  return {
    status,
    message,
    duration,
    additionalInfo: visaData?.additional_info || getAdditionalInfo(status)
  };
}

function getAdditionalInfo(visaStatus) {
  const infoMap = {
    'visa_free': 'You can enter without a visa for tourism or business for a limited period. Ensure your passport is valid for at least 6 months.',
    'visa_required': 'You must obtain a visa before traveling. Apply at the embassy or consulate with sufficient time for processing.',
    'e_visa': 'Apply online for an electronic visa. Processing usually takes 3-7 days. Print the approval before travel.',
    'visa_on_arrival': 'You can obtain a visa at the port of entry. Have documents, photos, and fees ready.',
    'unknown': 'Visa requirements can change frequently. Please verify current requirements with the embassy or official government sources.'
  };
  
  return infoMap[visaStatus] || infoMap['unknown'];
}

function getRequirements(visaStatus) {
  const requirementsMap = {
    'visa_free': [
      'Valid passport (6+ months validity)',
      'Return/onward ticket',
      'Proof of accommodation',
      'Sufficient funds for stay',
      'No criminal record'
    ],
    'visa_required': [
      'Valid passport (6+ months validity)',
      'Completed visa application form',
      'Recent passport photos',
      'Visa fee payment',
      'Travel itinerary',
      'Proof of accommodation',
      'Financial statements',
      'Travel insurance (recommended)'
    ],
    'e_visa': [
      'Valid passport (6+ months validity)',
      'Digital passport photo',
      'Credit/debit card for payment',
      'Email address for approval',
      'Travel dates and itinerary',
      'Proof of accommodation'
    ],
    'visa_on_arrival': [
      'Valid passport (6+ months validity)',
      'Recent passport photos',
      'Visa fee in cash (USD/local currency)',
      'Return/onward ticket',
      'Hotel booking confirmation',
      'Sufficient funds proof'
    ],
    'unknown': [
      'Valid passport (6+ months validity)',
      'Check embassy website for specific requirements',
      'Contact nearest consulate for guidance'
    ]
  };
  
  return requirementsMap[visaStatus] || requirementsMap['unknown'];
}