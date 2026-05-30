const mongoose = require('mongoose');

// Failed URL — matches failedUrls shape in crawlerSlice
const failedUrlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  error: { type: String, default: 'Unknown error' },
  code: { type: Number, default: 0 },
  workerId: { type: String, default: 'System' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FailedUrl', failedUrlSchema);
