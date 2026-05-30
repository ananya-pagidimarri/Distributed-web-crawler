const cron = require('node-cron');
const CrawledPage = require('../models/CrawledPageModel');
const { kafka } = require('../events/kafkaClient');
const logger = require('../utils/logger');

const initRecrawlCron = () => {
  // Run every 12 hours to find stale pages and queue them for a recrawl
  cron.schedule('0 */12 * * *', async () => {
    logger.info('[CRON] Starting stale page recrawl routine...');
    try {
      // Find pages that haven't been crawled in 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const stalePages = await CrawledPage.find({
        lastCrawledAt: { $lt: sevenDaysAgo }
      }).limit(1000).select('url');

      if (stalePages.length === 0) {
        logger.info('[CRON] No stale pages found for recrawling.');
        return;
      }

      const producer = kafka.producer();
      await producer.connect();

      const messages = stalePages.map(page => ({
        value: JSON.stringify({ url: page.url, depth: 0, priority: 'low' })
      }));

      await producer.send({
        topic: 'url-queue',
        messages: messages
      });

      await producer.disconnect();
      logger.info(`[CRON] Queued ${stalePages.length} stale pages for recrawling.`);
    } catch (err) {
      logger.error('[CRON] Recrawl routine failed: ' + err.message);
    }
  });
};

module.exports = { initRecrawlCron };
