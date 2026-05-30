const logger = require('../utils/logger');
const { isDbConnected } = require('../database/mongoConnection');

exports.pushToQueue = (url) => {
  logger.info(`[KAFKA/QUEUE MOCK] Pushed ${url} to frontier.`);
  if (!isDbConnected()) {
    global.MOCK_DB.queue.push(url);
  }
};