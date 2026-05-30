const mongoose = require('mongoose');

async function resetDB() {
  await mongoose.connect('mongodb://127.0.0.1:27017/crawlerdb');
  console.log('Connected to DB');
  
  const CrawledPage = require('./models/CrawledPageModel');
  const UrlQueue = require('./models/UrlQueueModel');
  
  await CrawledPage.deleteMany({});
  await UrlQueue.deleteMany({});
  
  console.log('Cleared CrawledPage and UrlQueue collections');
  process.exit(0);
}

resetDB();
