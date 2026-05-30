const mongoose = require('mongoose');
const CrawledPage = require('./models/CrawledPageModel');
require('dotenv').config({ path: './.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const pages = await CrawledPage.find({ url: { $regex: 'wikipedia' } }, 'url CrawledAt crawledAt createdAt').limit(5).lean();
  console.log(pages);
  
  process.exit(0);
}
check();
