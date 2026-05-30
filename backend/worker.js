require('dotenv').config();
const mongoose = require('mongoose');
const crawlerEngine = require('./crawler/crawlerEngine');
const WorkerNode = require('./models/WorkerNodeModel');
const os = require('os');
const crypto = require('crypto');

// Generate a unique ID for this worker process
const workerId = `worker-${crypto.randomBytes(4).toString('hex')}`;

async function startWorker() {
  console.log(`[Worker Boot] Initializing Crawler Node: ${workerId}`);
  
  // 1. Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crawler');
  console.log(`[Worker Boot] Connected to MongoDB`);

  // 2. Register node in telemetry database
  await WorkerNode.create({
    workerId,
    name: `Node-${os.hostname()}-${workerId.split('-')[1]}`,
    ip: '127.0.0.1',
    type: 'Indexer',
    status: 'running',
    lastHeartbeat: new Date()
  });

  // 3. Heartbeat & Telemetry Loop
  setInterval(async () => {
    try {
      const cpuUsage = Math.floor(Math.random() * 40) + 10; // Simulated CPU%
      const memUsage = Math.floor((os.freemem() / os.totalmem()) * 100);
      
      await WorkerNode.findOneAndUpdate(
        { workerId },
        { 
          lastHeartbeat: new Date(), 
          status: crawlerEngine.isRunning() ? 'running' : 'idle',
          cpu: cpuUsage,
          memory: memUsage,
          processedCount: crawlerEngine.getVisitedCount()
        }
      );
    } catch (err) {
      console.error(`[Telemetry Error] ${err.message}`);
    }
  }, 5000);

  // 4. Start the infinite crawl loop
  console.log(`[Worker Boot] Starting crawler engine loop...`);
  
  // Auto-restart loop if it drains the queue
  setInterval(async () => {
    if (!crawlerEngine.isRunning()) {
      try {
        await crawlerEngine.startCrawling();
      } catch (err) {
        console.error(`[Engine Error] ${err.message}`);
      }
    }
  }, 10000);

  // Initial kick
  crawlerEngine.startCrawling().catch(err => console.error(err));

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n[Worker Node] Shutting down gracefully...`);
    crawlerEngine.stopCrawling();
    await WorkerNode.deleteOne({ workerId });
    process.exit(0);
  });
}

startWorker();
