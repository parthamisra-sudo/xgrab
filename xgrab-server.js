const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple rate limiting (in-memory)
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 450; // Twitter API limit

const checkRateLimit = (identifier) => {
    const now = Date.now();
    const userRequests = rateLimiter.get(identifier) || [];
    
    const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= MAX_REQUESTS) {
        const oldestRequest = Math.min(...validRequests);
        const resetTime = new Date(oldestRequest + RATE_LIMIT_WINDOW);
        return {
            allowed: false,
            resetTime
        };
    }
    
    validRequests.push(now);
    rateLimiter.set(identifier, validRequests);
    
    return {
        allowed: true,
        remaining: MAX_REQUESTS - validRequests.length
    };
};

// Twitter API v2 base URL
const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * Helper function to make Twitter API requests
 */
const makeTwitterRequest = async (url, bearerToken, params = {}) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'User-Agent': 'XGrab/1.0'
            },
            params,
            timeout: 30000
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Twitter API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        let errorMessage = 'Unknown error occurred';
        let errorCode = error.response?.status;

        if (error.response?.data) {
            const errorData = error.response.data;
            if (errorData.errors && errorData.errors.length > 0) {
                errorMessage = errorData.errors[0].message || errorData.title;
            } else if (errorData.detail) {
                errorMessage = errorData.detail;
            } else if (errorData.title) {
                errorMessage = errorData.title;
            }
        }

        // Map common errors
        switch (errorCode) {
            case 401:
                errorMessage = 'Invalid or expired Bearer Token. Please regenerate your token.';
                break;
            case 403:
                errorMessage = 'Access forbidden. Your app may not have the required permissions.';
                break;
            case 404:
                errorMessage = 'Resource not found. Please check the username.';
                break;
            case 429:
                errorMessage = 'Rate limit exceeded. Please wait 15 minutes before trying again.';
                break;
            case 503:
                errorMessage = 'Twitter API is temporarily unavailable. Please try again later.';
                break;
        }

        return {
            success: false,
            error: errorMessage,
            errorCode
        };
    }
};

/**
 * Enhanced health check endpoint with detailed diagnostics
 */
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
            percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100) + '%'
        },
        server: {
            port: PORT,
            platform: process.platform,
            nodeVersion: process.version
        },
        endpoints: {
            health: '✓ Available',
            test: '✓ Available',
            tweets: '✓ Available',
            searchUsers: '✓ Available',
            user: '✓ Available',
            myTweets: '✓ Available',
            deleteTweet: '✓ Available'
        }
    };

    res.json(health);
});

/**
 * Test endpoint to verify Twitter API connection
 */
app.post('/api/test', async (req, res) => {
    try {
        const { bearerToken } = req.body;

        if (!bearerToken) {
            return res.json({
                success: false,
                error: 'Bearer token is required'
            });
        }

        // Check rate limit
        const rateLimit = checkRateLimit(bearerToken.substring(0, 20));
        if (!rateLimit.allowed) {
            return res.json({
                success: false,
                error: `Rate limit exceeded. Resets at ${rateLimit.resetTime.toLocaleTimeString()}`
            });
        }

        // Test with a simple API call to get Twitter's official account
        const result = await makeTwitterRequest(
            `${TWITTER_API_BASE}/users/by/username/twitter`,
            bearerToken,
            {
                'user.fields': 'verified,public_metrics'
            }
        );

        if (result.success) {
            res.json({
                success: true,
                message: 'Connection successful! Twitter API is working.',
                remaining: rateLimit.remaining,
                testData: {
                    testedWith: '@twitter account',
                    apiVersion: 'v2',
                    authenticated: true
                }
            });
        } else {
            res.json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Test connection error:', error);
        res.json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
});

/**
 * NEW: Search for Twitter users (for autocomplete/suggestions)
 * This is a lightweight endpoint that searches for users by username
 */
app.post('/api/search-users', async (req, res) => {
    try {
        const { bearerToken, query, maxResults = 5 } = req.body;

        if (!bearerToken || !query) {
            return res.json({
                success: false,
                error: 'Bearer token and query are required'
            });
        }

        // Rate limiting
        const rateLimit = checkRateLimit(bearerToken.substring(0, 20));
        if (!rateLimit.allowed) {
            return res.json({
                success: false,
                error: `Rate limit exceeded. Resets at ${rateLimit.resetTime.toLocaleTimeString()}`
            });
        }

        console.log(`Searching for users matching: ${query}`);

        // Use Twitter's user lookup endpoint to search
        // Note: This searches for exact username matches and similar ones
        const result = await makeTwitterRequest(
            `${TWITTER_API_BASE}/users/by`,
            bearerToken,
            {
                'usernames': query, // This will search for exact match
                'user.fields': 'created_at,description,public_metrics,verified,profile_image_url'
            }
        );

        if (result.success && result.data.data) {
            res.json({
                success: true,
                users: result.data.data,
                count: result.data.data.length
            });
        } else if (result.success && !result.data.data) {
            // No exact match found, try a different approach
            // For now, return empty results
            // In production, you might want to use Twitter's search API
            res.json({
                success: true,
                users: [],
                count: 0,
                message: 'No exact matches found. Try typing the complete username.'
            });
        } else {
            res.json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Search users error:', error);
        res.json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
});

/**
 * Fetch tweets for a given username
 */
app.post('/api/tweets', async (req, res) => {
    try {
        const { bearerToken, username, startDate, endDate, maxResults = 100 } = req.body;

        // Validation
        if (!bearerToken || !username) {
            return res.json({
                success: false,
                error: 'Bearer token and username are required'
            });
        }

        // Check rate limit
        const rateLimit = checkRateLimit(bearerToken.substring(0, 20));
        if (!rateLimit.allowed) {
            return res.json({
                success: false,
                error: `Rate limit exceeded. Resets at ${rateLimit.resetTime.toLocaleTimeString()}`
            });
        }

        const cleanUsername = username.replace('@', '').trim().toLowerCase();

        console.log(`Fetching tweets for @${cleanUsername}...`);

        // Step 1: Get user ID from username
        const userResult = await makeTwitterRequest(
            `${TWITTER_API_BASE}/users/by/username/${cleanUsername}`,
            bearerToken
        );

        if (!userResult.success) {
            return res.json({
                success: false,
                error: userResult.error
            });
        }

        const userId = userResult.data.data.id;
        console.log(`Found user ID: ${userId}`);

        // Step 2: Fetch tweets with pagination
        const tweets = [];
        let paginationToken = null;
        const limit = Math.min(maxResults, 3200); // Twitter API hard limit
        let requestCount = 0;
        const MAX_REQUESTS = 32; // Max 32 requests (32 * 100 = 3200 tweets)

        do {
            const params = {
                max_results: Math.max(5, Math.min(100, limit - tweets.length)),
                'tweet.fields': 'created_at,public_metrics,author_id,lang,possibly_sensitive,in_reply_to_user_id,referenced_tweets',
                'user.fields': 'username,name,verified',
                exclude: 'retweets'
            };

            // Add date filters if provided
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                params.start_time = start.toISOString();
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                params.end_time = end.toISOString();
            }

            // Add pagination token
            if (paginationToken) {
                params.pagination_token = paginationToken;
            }

            console.log(`Request ${requestCount + 1}: Fetching up to ${params.max_results} tweets...`);

            const result = await makeTwitterRequest(
                `${TWITTER_API_BASE}/users/${userId}/tweets`,
                bearerToken,
                params
            );

            if (!result.success) {
                // Return partial data if we have some
                if (tweets.length > 0) {
                    return res.json({
                        success: true,
                        tweets: tweets,
                        count: tweets.length,
                        warning: `Partial data: ${result.error}`,
                        hasMore: false
                    });
                }
                return res.json({
                    success: false,
                    error: result.error
                });
            }

            if (result.data.data && result.data.data.length > 0) {
                // Format tweets
                const formattedTweets = result.data.data.map(tweet => ({
                    id: tweet.id,
                    author: cleanUsername,
                    handle: cleanUsername,
                    date: tweet.created_at,
                    content: tweet.text,
                    likes: tweet.public_metrics?.like_count || 0,
                    retweets: tweet.public_metrics?.retweet_count || 0,
                    replies: tweet.public_metrics?.reply_count || 0,
                    quotes: tweet.public_metrics?.quote_count || 0,
                    impressions: tweet.public_metrics?.impression_count || 0,
                    language: tweet.lang,
                    in_reply_to_user_id: tweet.in_reply_to_user_id || null,
                    url: `https://twitter.com/${cleanUsername}/status/${tweet.id}`
                }));

                // Only add tweets up to the limit we need
                const tweetsNeeded = limit - tweets.length;
                const tweetsToAdd = formattedTweets.slice(0, tweetsNeeded);
                tweets.push(...tweetsToAdd);
                console.log(`Total tweets collected: ${tweets.length}`);
            }

            // Check for more pages
            paginationToken = result.data.meta?.next_token;
            requestCount++;

            // Safety limits
            if (tweets.length >= limit || !paginationToken || requestCount >= MAX_REQUESTS) {
                break;
            }

            // Small delay to be respectful to API
            await new Promise(resolve => setTimeout(resolve, 100));

        } while (paginationToken && tweets.length < limit);

        console.log(`Successfully fetched ${tweets.length} tweets for @${cleanUsername}`);

        res.json({
            success: true,
            tweets: tweets,
            count: tweets.length,
            username: cleanUsername,
            hasMore: !!paginationToken,
            remaining: rateLimit.remaining
        });

    } catch (error) {
        console.error('Fetch tweets error:', error);
        res.json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
});

/**
 * Get user information
 */
app.post('/api/user', async (req, res) => {
    try {
        const { bearerToken, username } = req.body;

        if (!bearerToken || !username) {
            return res.json({
                success: false,
                error: 'Bearer token and username are required'
            });
        }

        const cleanUsername = username.replace('@', '').trim().toLowerCase();

        const result = await makeTwitterRequest(
            `${TWITTER_API_BASE}/users/by/username/${cleanUsername}`,
            bearerToken,
            {
                'user.fields': 'created_at,description,public_metrics,verified,profile_image_url'
            }
        );

        if (result.success) {
            res.json({
                success: true,
                user: result.data.data
            });
        } else {
            res.json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('Get user error:', error);
        res.json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
});

// ==================== OAUTH 1.0A HELPERS ====================

function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
    // Sort parameters
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    
    // Create signature base string
    const signatureBaseString = [
        method.toUpperCase(),
        encodeURIComponent(url),
        encodeURIComponent(sortedParams)
    ].join('&');
    
    // Create signing key
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret || '')}`;
    
    // Generate signature
    const signature = crypto
        .createHmac('sha1', signingKey)
        .update(signatureBaseString)
        .digest('base64');
    
    return signature;
}

function generateOAuthHeader(method, url, consumerKey, consumerSecret, accessToken, accessTokenSecret, queryParams = {}) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(32).toString('base64').replace(/\W/g, '');

    const oauthParams = {
        oauth_consumer_key: consumerKey,
        oauth_token: accessToken,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: timestamp,
        oauth_nonce: nonce,
        oauth_version: '1.0'
    };

    // Merge OAuth params with query params for signature calculation
    // Twitter requires ALL parameters (oauth + query) to be signed together
    const allParams = { ...oauthParams, ...queryParams };

    // Generate signature using all parameters
    const signature = generateOAuthSignature(method, url, allParams, consumerSecret, accessTokenSecret);
    oauthParams.oauth_signature = signature;

    // Build OAuth header (only oauth_ params go in the header, not query params)
    const headerValue = Object.keys(oauthParams)
        .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
        .join(', ');

    return `OAuth ${headerValue}`;
}

// ==================== MY TWEETS ENDPOINT ====================

app.post('/api/my-tweets', async (req, res) => {
    try {
        const { accessToken, accessTokenSecret, consumerKey, consumerSecret, startDate, endDate, page = 1, perPage = 20 } = req.body;
        
        if (!accessToken || !accessTokenSecret || !consumerKey || !consumerSecret) {
            return res.json({
                success: false,
                error: 'OAuth credentials required'
            });
        }
        
        // First, get user's own info to get their user ID
        const meUrl = 'https://api.twitter.com/2/users/me';
        const meAuthHeader = generateOAuthHeader('GET', meUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret);
        
        const meResponse = await axios.get(meUrl, {
            headers: {
                'Authorization': meAuthHeader
            }
        });
        
        const userId = meResponse.data.data.id;
        const username = meResponse.data.data.username;
        
        // Now fetch user's tweets
        const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets`;

        const params = {
            max_results: String(perPage),
            'tweet.fields': 'created_at,public_metrics,author_id,in_reply_to_user_id,referenced_tweets',
            exclude: 'retweets'
        };

        // Add date filters
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            params.start_time = start.toISOString();
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            params.end_time = end.toISOString();
        }

        // Pass query params into signature so Twitter can validate them
        const authHeader = generateOAuthHeader('GET', tweetsUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret, params);

        // Build the query string manually to ensure it matches exactly what was signed
        const queryString = Object.keys(params)
            .sort()
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        const response = await axios.get(`${tweetsUrl}?${queryString}`, {
            headers: {
                'Authorization': authHeader
            }
        });
        
        const tweets = response.data.data ? response.data.data.map(tweet => ({
            id: tweet.id,
            author: username,
            handle: username,
            date: tweet.created_at,
            content: tweet.text,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            in_reply_to_user_id: tweet.in_reply_to_user_id || null,
            isReply: !!tweet.in_reply_to_user_id,
            url: `https://twitter.com/${username}/status/${tweet.id}`
        })) : [];
        
        res.json({
            success: true,
            tweets,
            handle: username,
            totalCount: response.data.meta?.result_count || tweets.length
        });
        
    } catch (error) {
        console.error('Error fetching my tweets:', error.response?.data || error.message);
        res.json({
            success: false,
            error: error.response?.data?.detail || error.message
        });
    }
});

// ==================== DELETE TWEET ENDPOINT ====================

app.post('/api/delete-tweet', async (req, res) => {
    try {
        const { tweetId, accessToken, accessTokenSecret, consumerKey, consumerSecret } = req.body;
        
        if (!tweetId || !accessToken || !accessTokenSecret || !consumerKey || !consumerSecret) {
            return res.json({
                success: false,
                error: 'Missing required parameters'
            });
        }
        
        const url = `https://api.twitter.com/2/tweets/${tweetId}`;
        const authHeader = generateOAuthHeader('DELETE', url, consumerKey, consumerSecret, accessToken, accessTokenSecret);
        
        await axios.delete(url, {
            headers: {
                'Authorization': authHeader
            }
        });
        
        res.json({
            success: true,
            tweetId
        });
        
    } catch (error) {
        console.error('Error deleting tweet:', error.response?.data || error.message);
        res.json({
            success: false,
            error: error.response?.data?.detail || error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET  /health',
            'POST /api/test',
            'POST /api/tweets',
            'POST /api/search-users',
            'POST /api/user',
            'POST /api/my-tweets',
            'POST /api/delete-tweet'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║         XGrab Backend Server v1.0          ║
╠════════════════════════════════════════════╣
║  Status: ✅ Running                        ║
║  Port: ${PORT.toString().padEnd(37)}║
║  URL: http://localhost:${PORT.toString().padEnd(22)}║
╠════════════════════════════════════════════╣
║  Endpoints:                                ║
║  • GET  /health           - Health check  ║
║  • POST /api/test         - Test API      ║
║  • POST /api/tweets       - Fetch tweets  ║
║  • POST /api/search-users - Search users  ║
║  • POST /api/user         - Get user info ║
║  • POST /api/my-tweets    - My tweets     ║
║  • POST /api/delete-tweet - Delete tweet  ║
╠════════════════════════════════════════════╣
║  Ready to accept requests! 🚀             ║
╚════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Unhandled rejection handler
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

module.exports = app;