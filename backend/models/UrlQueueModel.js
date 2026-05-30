const mongoose = require('mongoose');

// URL Queue entry — matches frontierQueue shape in crawlerSlice
const urlQueueSchema = new mongoose.Schema({
  url: { type: String, required: true },
  priority: { type: Number, enum: [1, 2, 3], default: 1 }, // 1=High, 2=Medium, 3=Low
  priorityLabel: { type: String, enum: ['High', 'Medium', 'Low'], default: 'High' },
  depth: { type: Number, default: 1 },
  graphDepth: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
  parentUrl: { type: String, default: null },
  bypassRobots: { type: Boolean, default: false },
  extractSitemaps: { type: Boolean, default: true },
  retryCount: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('UrlQueue', urlQueueSchema);
