/**
 * kafkaClient.js
 * Configures Kafka producer for streaming crawler events to the Socket.IO server.
 */

const { Kafka } = require('kafkajs');
const { KAFKA_BROKER, KAFKA_CLIENT_ID } = require('../config/envConfig');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID || 'crawlx-engine',
  brokers: [KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 5
  }
});

const producer = kafka.producer();

let isConnected = false;

async function connectKafka() {
  try {
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
      topics: [{ topic: 'crawler-events' }],
      waitForLeaders: true,
    });
    await admin.disconnect();

    await producer.connect();
    isConnected = true;
    logger.info('[Kafka] Producer connected successfully and topic ensured.');
  } catch (err) {
    logger.error(`[Kafka] Connection failed: ${err.message}`);
  }
}

/**
 * Broadcast an event to a Kafka topic.
 * @param {string} topic - The topic name (e.g., 'crawler-events')
 * @param {string} event - The event type
 * @param {Object} data - The payload
 */
async function emitEvent(topic, event, data) {
  if (!isConnected) return;
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: event,
          value: JSON.stringify({ event, data, timestamp: new Date() })
        }
      ]
    });
  } catch (err) {
    logger.error(`[Kafka] Failed to emit event ${event}: ${err.message}`);
  }
}

module.exports = {
  kafka,
  producer,
  connectKafka,
  emitEvent
};
