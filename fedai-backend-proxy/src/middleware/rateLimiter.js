// fedai-backend-proxy/src/middleware/rateLimiter.js
// Endpoint-specific rate limiting configuration

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for AI/Gemini endpoints
 * Most expensive operations, strictest limits
 */
const geminiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour per IP
  message: {
    error: 'Too many AI analysis requests. Please try again in an hour.',
    retryAfter: '1 hour',
    limit: 10,
    window: '1 hour'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many AI analysis requests from this IP. Please try again later.',
      errorKey: 'RATE_LIMIT_ERROR',
      retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000 / 60 + ' minutes',
      limit: 10,
      window: '1 hour'
    });
  }
});

/**
 * Rate limiter for data endpoints (weather, soil, elevation)
 * Moderate limits for external API calls
 */
const dataLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 requests per hour per IP
  message: {
    error: 'Too many data requests. Please try again later.',
    retryAfter: '1 hour',
    limit: 30,
    window: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many data requests from this IP. Please try again later.',
      errorKey: 'RATE_LIMIT_ERROR',
      retryAfter: Math.ceil(req.rateLimit.resetTime - Date.now()) / 1000 / 60 + ' minutes',
      limit: 30,
      window: '1 hour'
    });
  }
});

/**
 * Rate limiter for status/health check endpoints
 * Generous limits for monitoring
 */
const statusLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour per IP
  message: {
    error: 'Too many status check requests.',
    retryAfter: '1 hour',
    limit: 100,
    window: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Global rate limiter for all other endpoints
 * Fallback protection
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
    retryAfter: '15 minutes',
    limit: 100,
    window: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict limiter for IP location lookups
 * Prevents abuse of geolocation services
 */
const ipLocationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour per IP
  message: {
    error: 'Too many location lookup requests.',
    retryAfter: '1 hour',
    limit: 20,
    window: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  geminiLimiter,
  dataLimiter,
  statusLimiter,
  globalLimiter,
  ipLocationLimiter
};
