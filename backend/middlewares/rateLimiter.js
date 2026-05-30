const rateLimit = require('express-rate-limit');

// General API rate limiter (100 requests per 1 hour)
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10000, 
  message: { success: false, message: 'Too many requests from this IP, please try again after 1HR' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Stricter rate limiter for authentication routes (10 requests per hour)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 1000, 
  message: { success: false, message: 'Too many login attempts from this IP, please try again after an hour' },
  standardHeaders: true, 
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter
};
