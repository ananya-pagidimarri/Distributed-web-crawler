/**
 * redisPubSub.js
 * Configures Redis Pub/Sub for broadcasting crawler events to Socket.IO.
 */

const Redis = require('ioredis');
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_URL } = require('../config/envConfig');
const logger = require('../utils/logger');

// Options builder to support either REDIS_URL or standard host/port config
const getRedisOptions = () => {
  if (REDIS_URL) {
    return REDIS_URL; // ioredis accepts connection string directly
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

// We need two distinct clients: one for publishing, one for subscribing
const publisher = new Redis(getRedisOptions());
const subscriber = new Redis(getRedisOptions());

let isConnected = false;

publisher.on('connect', () => {
  isConnected = true;
  logger.info('[Redis PubSub] Publisher connected.');
});

subscriber.on('connect', () => {
  logger.info('[Redis PubSub] Subscriber connected.');
});

publisher.on('error', (err) => logger.error(`[Redis PubSub] Publisher Error: ${err.message}`));
subscriber.on('error', (err) => logger.error(`[Redis PubSub] Subscriber Error: ${err.message}`));

/**
 * Broadcast an event to a Redis Pub/Sub channel.
 * @param {string} channel - The channel name (e.g., 'crawler-events')
 * @param {string} event - The event type
 * @param {Object} data - The payload
 */
async function emitEvent(channel, event, data) {
  if (!isConnected) return;
  try {
    const payload = JSON.stringify({ event, data, timestamp: new Date() });
    await publisher.publish(channel, payload);
  } catch (err) {
    logger.error(`[Redis PubSub] Failed to emit event ${event}: ${err.message}`);
  }
}

module.exports = {
  publisher,
  subscriber,
  emitEvent
};
