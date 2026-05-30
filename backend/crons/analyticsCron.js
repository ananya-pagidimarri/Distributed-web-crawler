const cron = require('node-cron');
const SearchHistory = require('../models/SearchHistoryModel');
const Analytics = require('../models/AnalyticsModel');
const logger = require('../utils/logger');

// Run every night at midnight to aggregate search data
const initAnalyticsCron = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Starting daily search analytics aggregation...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const topQueries = await SearchHistory.aggregate([
        { $match: { timestamp: { $gte: yesterday, $lt: today } } },
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 }
      ]);

      const analyticsEntry = new Analytics({
        date: yesterday,
        topQueries: topQueries.map(q => ({ query: q._id, count: q.count })),
        totalSearches: topQueries.reduce((acc, curr) => acc + curr.count, 0)
      });

      await analyticsEntry.save();
      logger.info(`[CRON] Analytics aggregation complete. Saved ${topQueries.length} trending queries.`);
    } catch (err) {
      logger.error('[CRON] Failed to aggregate analytics: ' + err.message);
    }
  });
};

module.exports = { initAnalyticsCron };
