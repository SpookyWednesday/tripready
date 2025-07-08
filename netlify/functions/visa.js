const axios = require('axios');

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
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

    console.log(`Visa check: ${nationality} to ${destination}`);

    if (!RAPIDAPI_KEY) {
      console.error('RapidAPI key not configured');
      // Return a helpful default response
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(getDefaultVisaInfo(nationality, destination)),
      };
    }

    if (!nationality || !destination) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nationality and destination parameters are required' }),
      };
    }

    // Try to get visa information from RapidAPI
    try {
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
      console.log('Visa API response received');

      // Normalize the visa status
      let visaStatus = 'unknown';
      let visaMessage = 'Check with embassy';
      let stayDuration = 'Check embassy guidelines';

      if (visaData && visaData.status) {
        const status = visaData.status.toLowerCase();

        if (status.includes('visa free') || status.includes('no visa') || status.includes('visa not required')) {
          visaStatus = 'visa_free';
          visaMessage = 'No visa required';
          stayDuration = visaData.stay_duration || '90 days';
        } else if (status.includes('visa required')) {
          visaStatus = 'visa_required';
          visaMessage = 'Visa required before travel';
        } else if (status.includes('e-visa') || status.includes('evisa') || status.includes('electronic')) {
          visaStatus = 'e_visa';
          visaMessage = 'Electronic visa (e-Visa) available';
        } else if (status.includes('visa on arrival') || status.includes('arrival')) {
          visaStatus = 'visa_on_arrival';
          visaMessage = 'Visa on arrival available';
          stayDuration = visaData.stay_duration || '30 days';
        }
      }

      const result = {
        nationality: nationality,
        destination: destination,
        visaStatus: visaStatus,
        visaMessage: visaMessage,
        additionalInfo: visaData?.additional_info || getAdditionalInfo(visaStatus),
        stayDuration: stayDuration,
        requirements: visaData?.requirements || getBasicRequirements(visaStatus),
        cached: false,
        timestamp: new Date().toISOString()
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };

    } catch (apiError) {
      console.error('Visa API call failed:', apiError.message);
      // Return default visa info if API fails
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(getDefaultVisaInfo(nationality, destination)),
      };
    }

  } catch (error) {
    console.error('Visa handler error:', error);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(getDefaultVisaInfo(
        event.queryStringParameters?.nationality || 'Unknown',
        event.queryStringParameters?.destination || 'Unknown'
      )),
    };
  }
};

function getDefaultVisaInfo(nationality, destination) {
  // Common visa-free combinations
  const visaFreeRoutes = {
    'United States': ['Canada', 'Mexico', 'United Kingdom'],
    'Canada': ['United States', 'Mexico', 'United Kingdom'],
    'United Kingdom': ['United States', 'Canada', 'Australia'],
    'Australia': ['New Zealand', 'United Kingdom'],
    'Germany': ['France', 'Italy', 'Spain', 'Netherlands'],
    'France': ['Germany', 'Italy', 'Spain', 'Netherlands'],
  };

  let visaStatus = 'unknown';
  let visaMessage = 'Please check with embassy for current requirements';
  
  // Check if visa-free
  if (visaFreeRoutes[nationality]?.some(country => destination.includes(country))) {
    visaStatus = 'visa_free';
    visaMessage = 'Likely no visa required for short stays';
  }

  return {
    nationality: nationality,
    destination: destination,
    visaStatus: visaStatus,
    visaMessage: visaMessage,
    additionalInfo: 'Visa requirements can change. Always verify with official sources before travel.',
    stayDuration: 'Varies by country - typically 30-90 days for visa-free travel',
    requirements: getBasicRequirements(visaStatus),
    cached: false,
    timestamp: new Date().toISOString(),
    note: 'This is general guidance only. Please verify with embassy.'
  };
}

function getAdditionalInfo(visaStatus) {
  const infoMap = {
    'visa_free': 'You can enter without a visa for tourism or business for a limited period.',
    'visa_required': 'You must obtain a visa before traveling. Apply at the embassy or consulate.',
    'e_visa': 'Apply online for an electronic visa. Processing usually takes 3-7 days.',
    'visa_on_arrival': 'You can obtain a visa at the port of entry. Have documents and fees ready.',
    'unknown': 'Visa requirements vary. Please check with the embassy for accurate information.'
  };
  
  return infoMap[visaStatus] || infoMap['unknown'];
}

function getBasicRequirements(visaStatus) {
  const requirementsMap = {
    'visa_free': [
      'Valid passport (6+ months validity)',
      'Return ticket',
      'Proof of accommodation',
      'Sufficient funds'
    ],
    'visa_required': [
      'Valid passport (6+ months validity)',
      'Completed visa application',
      'Passport photos',
      'Visa fee payment',
      'Travel itinerary',
      'Proof of accommodation',
      'Financial statements'
    ],
    'e_visa': [
      'Valid passport (6+ months validity)',
      'Digital passport photo',
      'Credit card for payment',
      'Email address',
      'Travel dates'
    ],
    'visa_on_arrival': [
      'Valid passport (6+ months validity)',
      'Passport photos',
      'Visa fee in cash',
      'Return ticket',
      'Hotel booking'
    ],
    'unknown': [
      'Valid passport',
      'Check embassy website for requirements'
    ]
  };
  
  return requirementsMap[visaStatus] || requirementsMap['unknown'];
}