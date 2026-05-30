const mongoose = require('mongoose');

const sitemapTreeSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  sitemapUrl: { type: String, required: true },
  tree: { type: Object, required: true },
  totalUrls: { type: Number, default: 0 },
  crawledAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SitemapTree', sitemapTreeSchema);
