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
    const { destination, departureDate, returnDate } = event.queryStringParameters || {};
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    console.log('Weather request for:', destination);
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('WEATHER') || key.includes('OPENWEATHER')));
    console.log('API_KEY value:', API_KEY ? 'Present' : 'Missing');

    if (!API_KEY) {
      console.error('OpenWeatherMap API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenWeatherMap API key not configured' }),
      };
    }

    if (!destination) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Destination parameter is required' }),
      };
    }

    // Get coordinates for the destination
    console.log('Getting coordinates for:', destination);
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${API_KEY}`,
      { timeout: 10000 }
    );

    if (!geoResponse.data || geoResponse.data.length === 0) {
      console.error('Location not found:', destination);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Location not found' }),
      };
    }

    const { lat, lon, name, country } = geoResponse.data[0];
    console.log(`Found location: ${name}, ${country} (${lat}, ${lon})`);

    // Get current weather
    const currentWeatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      { timeout: 10000 }
    );

    // Get 5-day forecast
    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      { timeout: 10000 }
    );

    // Format the response
    const weatherData = {
      location: {
        name: name,
        country: country,
        lat: lat,
        lon: lon
      },
      current: {
        temperature: Math.round(currentWeatherResponse.data.main.temp),
        description: currentWeatherResponse.data.weather[0].description,
        humidity: currentWeatherResponse.data.main.humidity,
        windSpeed: Math.round(currentWeatherResponse.data.wind.speed),
        icon: currentWeatherResponse.data.weather[0].icon,
        feelsLike: Math.round(currentWeatherResponse.data.main.feels_like)
      },
      forecast: forecastResponse.data.list
        .filter((item, index) => index % 8 === 0) // Get one forecast per day
        .slice(0, 5)
        .map(item => ({
          date: new Date(item.dt * 1000).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          temperature: Math.round(item.main.temp),
          description: item.weather[0].description,
          icon: item.weather[0].icon
        })),
      cached: false,
      timestamp: new Date().toISOString()
    };

    console.log('Weather data retrieved successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(weatherData),
    };

  } catch (error) {
    console.error('Weather API Error:', error.message);

    // Return fallback data if API fails
    const fallbackData = {
      location: { 
        name: event.queryStringParameters?.destination || 'Unknown', 
        country: 'Unknown',
        lat: 0,
        lon: 0
      },
      current: {
        temperature: 20,
        description: 'Weather data unavailable',
        humidity: 50,
        windSpeed: 5,
        icon: '01d',
        feelsLike: 20
      },
      forecast: Array(5).fill(null).map((_, i) => {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        return {
          date: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          temperature: 20,
          description: 'Weather data unavailable',
          icon: '01d'
        };
      }),
      cached: false,
      timestamp: new Date().toISOString(),
      error: 'Weather service temporarily unavailable'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackData),
    };
  }
};