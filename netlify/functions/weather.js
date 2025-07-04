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
    const { destination, departureDate, returnDate } = event.queryStringParameters || {};
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    if (!API_KEY) {
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
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${API_KEY}`
    );

    if (!geoResponse.data || geoResponse.data.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Location not found' }),
      };
    }

    const { lat, lon } = geoResponse.data[0];

    // Get current weather
    const currentWeatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    // Get 5-day forecast
    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    const weatherData = {
      location: {
        name: geoResponse.data[0].name,
        country: geoResponse.data[0].country,
        lat: lat,
        lon: lon
      },
      current: {
        temperature: Math.round(currentWeatherResponse.data.main.temp),
        description: currentWeatherResponse.data.weather[0].description,
        humidity: currentWeatherResponse.data.main.humidity,
        windSpeed: currentWeatherResponse.data.wind.speed,
        icon: currentWeatherResponse.data.weather[0].icon
      },
      forecast: forecastResponse.data.list.slice(0, 5).map(item => ({
        date: new Date(item.dt * 1000).toLocaleDateString(),
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon
      })),
      cached: false,
      timestamp: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(weatherData),
    };

  } catch (error) {
    console.error('Weather API Error:', error);

    // Return fallback data if API fails
    const fallbackData = {
      location: { name: destination, country: 'Unknown' },
      current: {
        temperature: 20,
        description: 'Weather data unavailable',
        humidity: 50,
        windSpeed: 5,
        icon: '01d'
      },
      forecast: Array(5).fill(null).map((_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        temperature: 20,
        description: 'Weather data unavailable',
        icon: '01d'
      })),
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
