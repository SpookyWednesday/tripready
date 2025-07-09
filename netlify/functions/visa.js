const apiCache = new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// SIMPLIFIED: Basic rate limiting - prevent hammering
const rateLimitTracker = {
    lastCall: 0,
    callCount: 0,
    resetTime: 0,
    minInterval: 1000 // 1 second between calls
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

        console.log('========== SIMPLIFIED VISA CHECK ==========');
        console.log(`🎯 Direct request: ${nationality} → ${destination}`);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

        if (!nationality || !destination) {
            console.log('❌ Missing parameters');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nationality and destination parameters are required' }),
            };
        }

        // SIMPLIFIED: Direct country names, no complex parsing
        const cleanNationality = nationality.trim();
        const cleanDestination = destination.trim();
        const cacheKey = `${cleanNationality}-${cleanDestination}`;

        console.log(`🔍 Cache key: ${cacheKey}`);

        // STEP 1: Check cache first
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
        console.log('💾 No cache hit');

        // STEP 2: Check API availability
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
                    cached: false,
                    timestamp: new Date().toISOString(),
                    source: 'config_error'
                }),
            };
        }
        console.log('✅ RapidAPI key found');

        // STEP 3: SIMPLIFIED rate limiting check
        if (!canMakeAPICall()) {
            console.log('⏱️ Rate limited - too soon since last call');
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
                    cached: false,
                    timestamp: new Date().toISOString(),
                    source: 'rate_limit'
                }),
            };
        }

        console.log('🚀 Making RapidAPI call...');
        console.log(`📞 API call: ${cleanNationality} → ${cleanDestination}`);

        // Update rate limit tracker BEFORE API call
        updateRateLimitTracker();

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
                    timeout: 15000
                }
            );

            console.log('✅ RapidAPI call successful!');
            console.log('📊 Response status:', visaResponse.status);
            console.log('📋 Response data:', JSON.stringify(visaResponse.data, null, 2));
            
            const processedVisa = processRapidAPIResponse(visaResponse.data);
            console.log('🔄 Processed visa data:', processedVisa);
            
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
                apiSuccess: true
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
            console.error('❌ RapidAPI call failed:', {
                status: apiError.response?.status,
                message: apiError.message,
                data: apiError.response?.data
            });
            
            // Handle specific API errors
            let errorMessage = 'Unable to retrieve visa information';
            let errorInfo = 'Please check with embassy for current requirements.';
            let visaStatus = 'api_error';
            
            if (apiError.response?.status === 404) {
                errorMessage = 'Country combination not supported';
                errorInfo = 'This nationality/destination combination may not be supported by the visa service.';
                visaStatus = 'unsupported';
            } else if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                errorMessage = 'API authentication failed';
                errorInfo = 'There is an issue with the visa service authentication.';
                visaStatus = 'auth_error';
            } else if (apiError.response?.status === 429) {
                errorMessage = 'API rate limited';
                errorInfo = 'Too many requests to the visa service. Please try again later.';
                visaStatus = 'api_rate_limited';
                rateLimitTracker.resetTime = Date.now() + (60 * 1000); // Block for 1 minute
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
                errorCode: apiError.response?.status,
                apiSuccess: false
            };
            
            console.log('📤 Returning error result:', errorResult);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(errorResult),
            };
        }
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

// SIMPLIFIED: Cache functions
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
    if (apiCache.size > 50) {
        const firstKey = apiCache.keys().next().value;
        apiCache.delete(firstKey);
    }
}

// SIMPLIFIED: Rate limiting functions
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

    // SIMPLIFIED: Check minimum interval (only if we've made a call before)
    if (rateLimitTracker.lastCall > 0 && (now - rateLimitTracker.lastCall) < rateLimitTracker.minInterval) {
        console.log('❌ Too soon since last call');
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
        callCount: rateLimitTracker.callCount
    });

    // Simple protection: if too many calls, set a reset time
    if (rateLimitTracker.callCount > 20) {
        rateLimitTracker.resetTime = now + (10 * 60 * 1000); // 10 minutes
        rateLimitTracker.callCount = 0;
        console.log('⏰ Too many calls - setting 10 minute timeout');
    }
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
