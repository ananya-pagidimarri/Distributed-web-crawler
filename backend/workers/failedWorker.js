const { kafka } = require('../events/kafkaClient');
const FailedUrl = require('../models/FailedUrlModel');
const WorkerNode = require('../models/WorkerNodeModel');
const logger = require('../utils/logger');
const os = require('os');

const runFailedWorker = async () => {
  const consumer = kafka.consumer({ groupId: 'dead-letter-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'failed-urls', fromBeginning: false });

  logger.info('[WORKER] FailedWorker connected to Kafka. Listening for dead letters...');

  let currentActiveUrl = '';
  let processedCount = 0;

  // Telemetry Heartbeat Ping (Every 5 seconds)
  setInterval(async () => {
    try {
      const cpu = os.loadavg()[0]; // 1-minute load avg
      const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
      
      await WorkerNode.findOneAndUpdate(
        { workerId: 'fail-node-beta' },
        {
          name: 'Dead Letter Queue Beta',
          ip: '10.0.1.16',
          type: 'FailedHandler',
          status: currentActiveUrl ? 'running' : 'idle',
          cpu: cpu,
          memory: memUsage,
          rate: currentActiveUrl ? Math.floor(Math.random() * 10) + 1 : 0,
          processedCount: processedCount,
          currentUrl: currentActiveUrl,
          lastHeartbeat: new Date()
        },
        { upsert: true }
      );
    } catch (err) {
      // fail silently
    }
  }, 5000);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        const { url, reason, statusCode, attemptCount } = payload;

        currentActiveUrl = url;

        // Save to Database so we can review later or run a retry queue
        await FailedUrl.findOneAndUpdate(
          { url },
          { 
            reason, 
            statusCode, 
            attemptCount: attemptCount || 1,
            lastAttemptedAt: new Date() 
          },
          { upsert: true }
        );

        logger.info(`[WORKER] Logged dead letter for URL: ${url}`);
        processedCount++;
        currentActiveUrl = ''; // reset after done
      } catch (err) {
        logger.error(`[WORKER] Failed to process dead letter: ${err.message}`);
        currentActiveUrl = ''; // reset after failure
      }
    },
  });
};

module.exports = { runFailedWorker };
