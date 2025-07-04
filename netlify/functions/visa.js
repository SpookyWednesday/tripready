const axios = require('axios');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    if (!RAPIDAPI_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'RapidAPI key not configured' }),
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

    // Normalize the visa status
    let visaStatus = 'unknown';
    let visaMessage = 'Check with embassy';

    if (visaData && visaData.status) {
      const status = visaData.status.toLowerCase();

      if (status.includes('visa free') || status.includes('no visa required')) {
        visaStatus = 'visa_free';
        visaMessage = 'No visa required';
      } else if (status.includes('visa required')) {
        visaStatus = 'visa_required';
        visaMessage = 'Visa required';
      } else if (status.includes('e-visa') || status.includes('evisa')) {
        visaStatus = 'e_visa';
        visaMessage = 'Electronic visa required';
      } else if (status.includes('visa on arrival')) {
        visaStatus = 'visa_on_arrival';
        visaMessage = 'Visa on arrival available';
      }
    }

    const result = {
      nationality: nationality,
      destination: destination,
      visaStatus: visaStatus,
      visaMessage: visaMessage,
      additionalInfo: visaData?.additional_info || 'Please verify requirements with the embassy',
      stayDuration: visaData?.stay_duration || 'Check embassy guidelines',
      cached: false,
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Visa API Error:', error);

    // Return fallback data if API fails
    const fallbackData = {
      nationality: event.queryStringParameters?.nationality || 'Unknown',
      destination: event.queryStringParameters?.destination || 'Unknown',
      visaStatus: 'unknown',
      visaMessage: 'Check with embassy - service temporarily unavailable',
      additionalInfo: 'Please verify visa requirements with the embassy or consulate',
      stayDuration: 'Check embassy guidelines',
      cached: false,
      timestamp: new Date().toISOString(),
      error: 'Visa service temporarily unavailable'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackData),
    };
  }
};
