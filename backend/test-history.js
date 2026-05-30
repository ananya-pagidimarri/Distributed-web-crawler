const mongoose = require('mongoose');
const CrawledPage = require('./models/CrawledPageModel');

mongoose.connect('mongodb://localhost:27017/crawler')
  .then(async () => {
    const count = await CrawledPage.countDocuments();
    console.log('Total Crawled Pages:', count);
    process.exit(0);
  });
