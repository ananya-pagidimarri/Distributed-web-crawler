const mongoose = require('mongoose');

// Crawl log entry — matches logs shape in crawlerSlice
const crawlLogSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'success', 'warn', 'error'], default: 'info' },
  message: { type: String, required: true },
  workerId: { type: mongoose.Schema.Types.Mixed, default: 'System' }, // can be Number or String
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CrawlLog', crawlLogSchema);
