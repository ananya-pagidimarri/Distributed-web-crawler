/**
 * redisClient.js
 * Configures and provides the Redis client for distributed caching.
 */

const Redis = require('ioredis');
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = require('../config/envConfig');
const logger = require('../utils/logger');

// Connection options
const redisOptions = {
  host: REDIS_HOST || '127.0.0.1',
  port: REDIS_PORT || 6379,
  retryStrategy: (times) => {
    // Reconnect after
    return Math.min(times * 50, 2000);
  }
};

if (REDIS_PASSWORD) {
  redisOptions.password = REDIS_PASSWORD;
}

const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => {
  logger.info('[Redis] Connected to distributed cache.');
});

redisClient.on('error', (err) => {
  logger.error(`[Redis] Connection error: ${err.message}`);
});

module.exports = redisClient;
