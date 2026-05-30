const cron = require('node-cron');
const FailedUrl = require('../models/FailedUrlModel');
const logger = require('../utils/logger');

// Run every Sunday at 3:00 AM
const initCleanupCron = () => {
  cron.schedule('0 3 * * 0', async () => {
    logger.info('[CRON] Starting weekly database cleanup...');
    try {
      // Delete failed URLs that are older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await FailedUrl.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });
      
      logger.info(`[CRON] Cleanup complete. Removed ${result.deletedCount} old failed URL logs.`);
    } catch (err) {
      logger.error('[CRON] Database cleanup failed: ' + err.message);
    }
  });
};

module.exports = { initCleanupCron };
