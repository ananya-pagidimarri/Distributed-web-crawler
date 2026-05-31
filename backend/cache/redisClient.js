/**
 * redisClient.js
 * Configures and provides the Redis client for distributed caching.
 */

const Redis = require('ioredis');
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_URL } = require('../config/envConfig');
const logger = require('../utils/logger');

// Connection options
const getRedisOptions = () => {
  if (REDIS_URL) {
    // Note: Upstash requires tls object if using rediss://
    return REDIS_URL;
  }
  const options = {
    host: REDIS_HOST || '127.0.0.1',
    port: REDIS_PORT || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };
  if (REDIS_PASSWORD) {
    options.password = REDIS_PASSWORD;
  }
  return options;
};

const redisClient = new Redis(getRedisOptions());

redisClient.on('connect', () => {
  logger.info('[Redis] Connected to distributed cache.');
});

redisClient.on('error', (err) => {
  logger.error(`[Redis] Connection error: ${err.message}`);
});

module.exports = redisClient;
