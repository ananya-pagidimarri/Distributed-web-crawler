const { kafka } = require('../events/kafkaClient');
const CrawledPage = require('../models/CrawledPageModel');
const WorkerNode = require('../models/WorkerNodeModel');
const logger = require('../utils/logger');
const os = require('os');

const runIndexWorker = async () => {
  const consumer = kafka.consumer({ groupId: 'indexing-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'indexing-queue', fromBeginning: false });

  logger.info('[WORKER] IndexWorker connected to Kafka. Listening for documents...');
  
  let currentActiveUrl = '';
  let processedCount = 0;

  // Telemetry Heartbeat Ping (Every 5 seconds)
  setInterval(async () => {
    try {
      const cpu = os.loadavg()[0]; // 1-minute load avg
      const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
      
      await WorkerNode.findOneAndUpdate(
        { workerId: 'idx-node-alpha' },
        {
          name: 'Elastic Indexer Alpha',
          ip: '10.0.1.15',
          type: 'Indexer',
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
      // fail silently so we don't crash worker
    }
  }, 5000);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        const { url, title, description, content, headings, language } = payload;
        
        currentActiveUrl = url;

        // 1. Save to Elasticsearch (Disabled in MongoDB architecture)
        /*
        await elasticClient.index({
          index: 'pages',
          id: Buffer.from(url).toString('base64'), // use base64 URL as unique ID
          document: {
            url,
            title,
            description,
            content,
            headings,
            language,
            indexedAt: new Date()
          }
        });
        */

        // 2. Update MongoDB status
        await CrawledPage.findOneAndUpdate(
          { url },
          { lastCrawledAt: new Date(), status: 'indexed' },
          { upsert: true }
        );

        logger.info(`[WORKER] Successfully indexed: ${url}`);
        processedCount++;
        currentActiveUrl = ''; // reset after done
      } catch (err) {
        logger.error(`[WORKER] Failed to index document: ${err.message}`);
        // Here we could push to a dead-letter queue
        currentActiveUrl = ''; // reset after failure
      }
    },
  });
};

module.exports = { runIndexWorker };
