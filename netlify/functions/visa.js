// MINIMAL: Only basic caching, NO FALLBACK DATABASE
const apiCache = new Map();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// MINIMAL: Basic rate limiting
const rateLimitTracker = {
    lastCall: 0,
    minInterval: 500 // 0.5 seconds between calls
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
        console.log(`🎯 Request: ${nationality} → ${destination}`);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

        if (!nationality || !destination) {
            console.log('❌ Missing required parameters');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nationality and destination parameters are required' }),
            };
        }

        // SIMPLE: Direct string handling
        const cleanNationality = nationality.trim();
        const cleanDestination = destination.trim();
        const cacheKey = `${cleanNationality}-${cleanDestination}`;

        console.log(`🔍 Parameters: "${cleanNationality}" → "${cleanDestination}"`);

        // Check environment variables
        const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
        console.log('🔐 Environment Check:');
        console.log('  - RAPIDAPI_KEY exists:', !!RAPIDAPI_KEY);
        console.log('  - RAPIDAPI_KEY length:', RAPIDAPI_KEY ? RAPIDAPI_KEY.length : 0);

        if (!RAPIDAPI_KEY) {
            console.error('❌ RapidAPI key not found');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    nationality: nationality,
                    destination: destination,
                    visaStatus: 'config_error',
                    visaMessage: 'Visa service not configured',
                    additionalInfo: 'API key is missing. Please contact support.',
                    stayDuration: 'Contact embassy',
                    cached: false,
                    timestamp: new Date().toISOString(),
                    source: 'config_error'
                }),
            };
        }

        // Check cache
        const cachedResult = getCachedResult(cacheKey);
        if (cachedResult) {
            console.log('💾 Cache hit - returning cached result');
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
        console.log('💾 No cache - proceeding to API');

        // Basic rate limiting
        const now = Date.now();
        if (rateLimitTracker.lastCall > 0 && (now - rateLimitTracker.lastCall) < rateLimitTracker.minInterval) {
            console.log('⏱️ Rate limited');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    nationality: nationality,
                    destination: destination,
                    visaStatus: 'rate_limited',
                    visaMessage: 'Too many requests - please wait',
                    additionalInfo: 'Please wait a moment before trying again.',
                    stayDuration: 'Please retry',
                    cached: false,
                    timestamp: new Date().toISOString(),
                    source: 'rate_limit'
                }),
            };
        }

        console.log('🚀 ===== CALLING RAPIDAPI (NO FALLBACK) =====');
        console.log('📞 API Details:');
        console.log('  - URL: https://visa-requirements.p.rapidapi.com/visa-requirements');
        console.log('  - From:', cleanNationality);
        console.log('  - To:', cleanDestination);

        // Update rate limit tracker
        rateLimitTracker.lastCall = now;

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
                    timeout: 20000, // 20 seconds timeout
                    validateStatus: function (status) {
                        return status < 600; // Don't throw for any HTTP status < 600
                    }
                }
            );

            console.log('📊 ===== RAPIDAPI RESPONSE =====');
            console.log('  - Status:', visaResponse.status);
            console.log('  - Status Text:', visaResponse.statusText);
            console.log('  - Headers:', visaResponse.headers);
            console.log('  - Data Type:', typeof visaResponse.data);
            console.log('  - Data:', JSON.stringify(visaResponse.data, null, 2));

            if (visaResponse.status === 200) {
                console.log('✅ ===== API CALL SUCCESSFUL =====');
                
                const processedVisa = processAPIResponse(visaResponse.data);
                console.log('🔄 Processed visa result:', processedVisa);
                
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
                    apiSuccess: true,
                    apiStatus: visaResponse.status,
                    rawApiData: visaResponse.data
                };
                
                // Cache successful result
                setCacheResult(cacheKey, result);
                
                console.log('✅ ===== RETURNING SUCCESS RESULT =====');
                return { statusCode: 200, headers, body: JSON.stringify(result) };
                
            } else {
                console.error(`❌ ===== API ERROR STATUS ${visaResponse.status} =====`);
                console.error('Response:', visaResponse.data);
                
                // Handle specific API error statuses
                let errorMessage = 'API request failed';
                let errorInfo = 'The visa API returned an error.';
                let visaStatus = 'api_error';
                
                if (visaResponse.status === 400) {
                    errorMessage = 'Invalid country names';
                    errorInfo = `The API doesn't recognize "${cleanNationality}" or "${cleanDestination}". Please check country names.`;
                    visaStatus = 'invalid_countries';
                } else if (visaResponse.status === 401) {
                    errorMessage = 'API authentication failed';
                    errorInfo = 'API key is invalid or expired.';
                    visaStatus = 'auth_failed';
                } else if (visaResponse.status === 403) {
                    errorMessage = 'API access denied';
                    errorInfo = 'Your API subscription doesn\'t include this service.';
                    visaStatus = 'access_denied';
                } else if (visaResponse.status === 404) {
                    errorMessage = 'API endpoint not found';
                    errorInfo = 'The visa API endpoint was not found.';
                    visaStatus = 'endpoint_missing';
                } else if (visaResponse.status === 429) {
                    errorMessage = 'API rate limit exceeded';
                    errorInfo = 'Too many API requests. Your plan limit may be reached.';
                    visaStatus = 'rate_limited_api';
                } else {
                    errorMessage = `API error ${visaResponse.status}`;
                    errorInfo = `HTTP ${visaResponse.status}: ${visaResponse.statusText}`;
                    visaStatus = 'api_error';
                }
                
                console.log('📤 ===== RETURNING API ERROR =====');
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        nationality: nationality,
                        destination: destination,
                        visaStatus: visaStatus,
                        visaMessage: errorMessage,
                        additionalInfo: errorInfo,
                        stayDuration: 'Contact embassy',
                        requirements: ['Check embassy website', 'Contact consulate', 'Verify requirements'],
                        cached: false,
                        timestamp: new Date().toISOString(),
                        source: 'api_error',
                        apiSuccess: false,
                        apiStatus: visaResponse.status,
                        apiResponseData: visaResponse.data
                    }),
                };
            }
            
        } catch (apiError) {
            console.error('💥 ===== API REQUEST EXCEPTION =====');
            console.error('  - Error Type:', apiError.constructor.name);
            console.error('  - Error Message:', apiError.message);
            console.error('  - Error Code:', apiError.code);
            console.error('  - Response Status:', apiError.response?.status);
            console.error('  - Response Data:', apiError.response?.data);
            console.error('  - Request Config:', {
                url: apiError.config?.url,
                method: apiError.config?.method,
                params: apiError.config?.params
            });
            
            let errorMessage = 'Network error';
            let errorInfo = 'Failed to connect to visa API.';
            let visaStatus = 'network_error';
            
            if (apiError.code === 'ENOTFOUND') {
                errorMessage = 'DNS resolution failed';
                errorInfo = 'Could not resolve visa API hostname.';
                visaStatus = 'dns_error';
            } else if (apiError.code === 'ECONNREFUSED') {
                errorMessage = 'Connection refused';
                errorInfo = 'Visa API server refused connection.';
                visaStatus = 'connection_refused';
            } else if (apiError.code === 'ETIMEDOUT') {
                errorMessage = 'Request timeout';
                errorInfo = 'Visa API request timed out after 20 seconds.';
                visaStatus = 'timeout';
            } else if (apiError.response?.status) {
                errorMessage = `HTTP ${apiError.response.status} error`;
                errorInfo = `API returned ${apiError.response.status}`;
                visaStatus = 'http_error';
            }
            
            console.log('📤 ===== RETURNING NETWORK ERROR =====');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    nationality: nationality,
                    destination: destination,
                    visaStatus: visaStatus,
                    visaMessage: errorMessage,
                    additionalInfo: errorInfo,
                    stayDuration: 'Contact embassy',
                    requirements: ['Check embassy website', 'Contact consulate'],
                    cached: false,
                    timestamp: new Date().toISOString(),
                    source: 'network_error',
                    apiSuccess: false,
                    errorCode: apiError.code,
                    errorMessage: apiError.message
                }),
            };
        }
    } catch (error) {
        console.error('💥 ===== FATAL FUNCTION ERROR =====');
        console.error(error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                nationality: event.queryStringParameters?.nationality || 'Unknown',
                destination: event.queryStringParameters?.destination || 'Unknown',
                visaStatus: 'fatal_error',
                visaMessage: 'Internal service error',
                additionalInfo: 'An unexpected error occurred in the visa service.',
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

// Helper functions - MINIMAL IMPLEMENTATION
function getCachedResult(cacheKey) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`💾 Cache hit for: ${cacheKey}`);
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
    if (apiCache.size > 10) {
        const firstKey = apiCache.keys().next().value;
        apiCache.delete(firstKey);
    }
}

function processAPIResponse(visaData) {
    console.log('🔄 ===== PROCESSING API RESPONSE =====');
    console.log('Raw data:', visaData);

    let status = 'unknown';
    let message = 'Check visa requirements';
    let duration = 'Varies';
    let additionalInfo = '';

    // Try different possible field names from RapidAPI
    const visaRequirement = visaData.visa_requirement ||
        visaData.status ||
        visaData.result ||
        visaData.visa_status ||
        visaData.requirement ||
        visaData.visa_type ||
        visaData.travel_requirement;

    console.log('🔍 Found visa requirement field:', visaRequirement);

    if (typeof visaRequirement === 'string') {
        const requirement = visaRequirement.toLowerCase().trim();

        if (requirement.includes('visa free') || 
            requirement.includes('no visa required') || 
            requirement.includes('visa not required') ||
            requirement.includes('visa-free')) {
            status = 'visa_free';
            message = 'No visa required';
            duration = visaData.max_stay || visaData.duration || visaData.stay_duration || '90 days';
            additionalInfo = 'Visa-free entry for tourism/business.';
        } else if (requirement.includes('visa required') || 
                   requirement.includes('visa is required') ||
                   requirement.includes('tourist visa required')) {
            status = 'visa_required';
            message = 'Visa required before travel';
            duration = visaData.max_stay || visaData.duration || 'Varies';
            additionalInfo = 'Tourist visa must be obtained before travel.';
        } else if (requirement.includes('e-visa') || 
                   requirement.includes('electronic visa') || 
                   requirement.includes('evisa') ||
                   requirement.includes('e-tourist visa')) {
            status = 'e_visa';
            message = 'Electronic visa required';
            duration = visaData.max_stay || visaData.duration || '30 days';
            additionalInfo = 'Apply for electronic visa online.';
        } else if (requirement.includes('visa on arrival') ||
                   requirement.includes('arrival visa')) {
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
        'visa_free': 'No visa required for short-term visits.',
        'visa_required': 'Visa must be obtained before travel.',
        'e_visa': 'Electronic visa can be applied online.',
        'visa_on_arrival': 'Visa available at port of entry.',
        'unknown': 'Visa requirements could not be determined from API.'
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
            'Visa application form',
            'Visa fee payment',
            'Supporting documents'
        ],
        'e_visa': [
            'Valid passport (6+ months validity)',
            'Online application',
            'Digital passport photo',
            'Payment card'
        ],
        'visa_on_arrival': [
            'Valid passport (6+ months validity)',
            'Visa fee (cash)',
            'Return ticket',
            'Passport photos'
        ],
        'unknown': [
            'Valid passport',
            'Check embassy requirements'
        ]
    };

    return requirementsMap[visaStatus] || requirementsMap['unknown'];
}
