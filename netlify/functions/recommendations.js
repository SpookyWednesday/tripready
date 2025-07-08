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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { destination, weather, tripType, duration, activities } = JSON.parse(event.body || '{}');
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

    if (!HUGGINGFACE_API_KEY) {
      console.log('No HuggingFace API key found, using fallback recommendations');
      return getFallbackRecommendations(destination, weather, tripType, duration, activities, headers);
    }

    // Create a prompt for the AI model
    const prompt = `Create a packing list for a ${duration}-day ${tripType} trip to ${destination}. 
    Weather: ${weather?.current?.description || 'unknown'}, ${weather?.current?.temperature || 'unknown'}°C.
    Activities: ${activities || 'general tourism'}.

    Please suggest specific items organized by category (documents, clothing, electronics, toiletries, accessories).
    Focus on practical, essential items for this specific trip.`;

    // Try primary model first
    let aiResponse;
    try {
      aiResponse = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
        { inputs: prompt },
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000
        }
      );
    } catch (primaryError) {
      console.log('Primary AI model failed, trying backup model');
      // Try backup model
      aiResponse = await axios.post(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        { inputs: prompt },
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000
        }
      );
    }

    // Process AI response and enhance with our structured data
    const aiSuggestions = aiResponse.data?.[0]?.generated_text || '';
    const enhancedRecommendations = enhanceWithStructuredData(destination, weather, tripType, duration, aiSuggestions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(enhancedRecommendations),
    };

  } catch (error) {
    console.error('AI Recommendations Error:', error);

    // Return fallback recommendations if AI fails
    const fallbackData = getFallbackRecommendations(
      JSON.parse(event.body || '{}').destination,
      JSON.parse(event.body || '{}').weather,
      JSON.parse(event.body || '{}').tripType,
      JSON.parse(event.body || '{}').duration,
      JSON.parse(event.body || '{}').activities,
      headers
    );

    return fallbackData;
  }
};

function getFallbackRecommendations(destination, weather, tripType, duration, activities, headers) {
  const baseCategories = {
    documents: {
      name: "📄 Essential Documents",
      items: [
        { name: "Passport", description: "Valid for at least 6 months", essential: true },
        { name: "Travel Insurance", description: "Comprehensive coverage recommended", essential: true },
        { name: "Flight Tickets", description: "Print and digital copies", essential: true },
        { name: "Hotel Reservations", description: "Booking confirmations", essential: false },
        { name: "Emergency Contacts", description: "Important phone numbers", essential: true }
      ]
    },
    clothing: {
      name: "👕 Clothing & Accessories",
      items: [
        { name: "Shirts", description: "Based on weather forecast", essential: true },
        { name: "Pants", description: "Comfortable and weather-appropriate", essential: true },
        { name: "Underwear", description: "Pack extra pairs", essential: true },
        { name: "Socks", description: "Comfortable walking socks", essential: true },
        { name: "Shoes", description: "Comfortable walking shoes", essential: true }
      ]
    },
    electronics: {
      name: "🔌 Electronics & Gadgets",
      items: [
        { name: "Phone Charger", description: "Don't forget!", essential: true },
        { name: "Camera", description: "Capture memories", essential: false },
        { name: "Power Adapter", description: "Universal adapter recommended", essential: true },
        { name: "Headphones", description: "For travel entertainment", essential: false }
      ]
    },
    toiletries: {
      name: "🧴 Toiletries & Health",
      items: [
        { name: "Toothbrush", description: "Essential hygiene", essential: true },
        { name: "Toothpaste", description: "Travel-sized", essential: true },
        { name: "Medications", description: "Prescription and over-the-counter", essential: true },
        { name: "Sunscreen", description: "SPF 30+ recommended", essential: false }
      ]
    },
    accessories: {
      name: "🎒 Travel Accessories",
      items: [
        { name: "Travel Pillow", description: "For comfortable flights", essential: false },
        { name: "Umbrella", description: "Weather protection", essential: false },
        { name: "Sunglasses", description: "Eye protection", essential: false }
      ]
    }
  };

  // Add weather-specific items
  if (weather?.current?.temperature) {
    const temp = weather.current.temperature;
    if (temp < 10) {
      baseCategories.clothing.items.push({ name: "Warm Jacket", description: "For cold weather", essential: true });
      baseCategories.clothing.items.push({ name: "Warm Hat", description: "Keep head warm", essential: false });
    } else if (temp > 25) {
      baseCategories.clothing.items.push({ name: "Light Clothing", description: "For hot weather", essential: true });
      baseCategories.clothing.items.push({ name: "Hat", description: "Sun protection", essential: false });
    }
  }

  // Add trip-specific items
  if (tripType === 'business') {
    baseCategories.clothing.items.push({ name: "Business Attire", description: "Professional clothing", essential: true });
    baseCategories.electronics.items.push({ name: "Laptop", description: "For work", essential: true });
  }

  const result = {
    destination: destination,
    tripType: tripType,
    duration: duration,
    categories: baseCategories,
    aiGenerated: false,
    cached: false,
    timestamp: new Date().toISOString(),
    note: "AI service temporarily unavailable - showing standard recommendations"
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result),
  };
}

function enhanceWithStructuredData(destination, weather, tripType, duration, aiSuggestions) {
  // This function would process the AI response and structure it
  // For now, we'll return a structured format
  const categories = {
    documents: {
      name: "📄 Essential Documents",
      items: [
        { name: "Passport", description: "Valid for at least 6 months", essential: true },
        { name: "Travel Insurance", description: "Comprehensive coverage", essential: true },
        { name: "Flight Tickets", description: "Print and digital copies", essential: true }
      ]
    },
    clothing: {
      name: "👕 Clothing & Accessories",
      items: [
        { name: "Weather-appropriate clothing", description: "Based on forecast", essential: true },
        { name: "Comfortable shoes", description: "For walking", essential: true },
        { name: "Underwear & socks", description: "Pack extras", essential: true }
      ]
    },
    electronics: {
      name: "🔌 Electronics & Gadgets",
      items: [
        { name: "Phone charger", description: "Essential", essential: true },
        { name: "Camera", description: "Capture memories", essential: false },
        { name: "Power adapter", description: "Universal recommended", essential: true }
      ]
    },
    toiletries: {
      name: "🧴 Toiletries & Health",
      items: [
        { name: "Toothbrush & toothpaste", description: "Essential hygiene", essential: true },
        { name: "Medications", description: "Prescription & OTC", essential: true },
        { name: "Sunscreen", description: "SPF 30+", essential: false }
      ]
    },
    accessories: {
      name: "🎒 Travel Accessories",
      items: [
        { name: "Travel pillow", description: "Comfortable flights", essential: false },
        { name: "Umbrella", description: "Weather protection", essential: false }
      ]
    }
  };

  return {
    destination: destination,
    tripType: tripType,
    duration: duration,
    categories: categories,
    aiGenerated: true,
    aiSuggestions: aiSuggestions,
    cached: false,
    timestamp: new Date().toISOString()
  };
}
