const rateLimit = require('express-rate-limit');

/**
 * SECURITY CONTROL: Rate Limiting
 * Mitigates credential stuffing, brute force attacks, and DoS against authentication endpoints.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * General API rate limiter for non-auth endpoints
 */
const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // Limit each IP to 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = {
  loginRateLimiter,
  apiRateLimiter,
};
