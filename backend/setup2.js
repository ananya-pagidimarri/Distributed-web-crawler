const fs = require('fs');
const path = require('path');

const files = {
  // CRAWLER ENGINE
  'crawler/crawlerEngine.js': `
    const logger = require('../utils/logger');
    const { pushToQueue } = require('../queue/urlQueueManager');
    
    exports.addSeed = (url) => {
      logger.info(\`Adding seed URL: \${url}\`);
      pushToQueue(url);
    };
  `,
  'crawler/htmlFetcher.js': `
    const axios = require('axios');
    exports.fetchHtml = async (url) => {
      // Mock fetch
      return \`<html><head><title>Mock Page for \${url}</title></head><body>Sample text</body></html>\`;
    };
  `,
  'crawler/contentParser.js': `
    const cheerio = require('cheerio');
    exports.parseContent = (html) => {
      const $ = cheerio.load(html);
      return {
        title: $('title').text(),
        text: $('body').text().substring(0, 200)
      };
    };
  `,
  
  // QUEUE MANAGER
  'queue/urlQueueManager.js': `
    const logger = require('../utils/logger');
    const { isDbConnected } = require('../database/mongoConnection');
    
    exports.pushToQueue = (url) => {
      logger.info(\`[KAFKA/QUEUE MOCK] Pushed \${url} to frontier.\`);
      if (!isDbConnected()) {
        global.MOCK_DB.queue.push(url);
      }
    };
  `,
  
  // WORKERS
  'workers/crawlWorker.js': `
    const logger = require('../utils/logger');
    const { fetchHtml } = require('../crawler/htmlFetcher');
    const { parseContent } = require('../crawler/contentParser');
    
    exports.processUrl = async (url) => {
      logger.info(\`Worker processing: \${url}\`);
      const html = await fetchHtml(url);
      const data = parseContent(html);
      return { url, ...data };
    };
  `
};

Object.entries(files).forEach(([filepath, content]) => {
  const fullPath = path.join(__dirname, filepath);
  fs.writeFileSync(fullPath, content.trim().replace(/^ {4}/gm, ''));
  console.log('Wrote ' + filepath);
});
