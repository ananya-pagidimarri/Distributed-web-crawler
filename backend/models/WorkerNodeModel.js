const mongoose = require('mongoose');

const WorkerNodeSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ip: { type: String, required: true },
  type: { type: String, required: true }, // e.g. 'Indexer', 'FailedHandler'
  status: { type: String, default: 'idle' }, // 'running', 'idle', 'offline'
  cpu: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  rate: { type: Number, default: 0 }, // tasks per second (optional)
  processedCount: { type: Number, default: 0 },
  currentUrl: { type: String, default: '' },
  lastHeartbeat: { type: Date, default: Date.now }
});

// Index for quickly finding dead nodes
WorkerNodeSchema.index({ lastHeartbeat: -1 });

module.exports = mongoose.model('WorkerNode', WorkerNodeSchema);
