const mongoose = require('mongoose');

const RobotsTxtSchema = new mongoose.Schema({
  domain: { type: String, required: true, unique: true },
  rawText: { type: String, default: '' },
  crawlDelay: { type: Number, default: 0 },
  fetchedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RobotsTxt', RobotsTxtSchema);
