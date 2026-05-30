const logger = require('../utils/logger');
const { fetchHtml } = require('../crawler/htmlFetcher');
const { parseContent } = require('../crawler/contentParser');

exports.processUrl = async (url) => {
  logger.info(`Worker processing: ${url}`);
  const html = await fetchHtml(url);
  const data = parseContent(html);
  return { url, ...data };
};