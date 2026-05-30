const { isDbConnected } = require('../database/mongoConnection');
const logger = require('../utils/logger');

exports.addSeedUrl = async (url) => {
  logger.info(`Seed URL added to queue: ${url}`);
  if (!isDbConnected()) {
    global.MOCK_DB.queue.push(url);
    return { success: true, url };
  }
  // Real DB logic would go here
  return { success: true, url };
};

exports.startCrawler = async () => {
  logger.info('Crawler Engine Started');
  return { status: 'crawling' };
};

exports.stopCrawler = async () => {
  logger.info('Crawler Engine Stopped');
  return { status: 'paused' };
};