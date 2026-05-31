const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDB } = require('./database/mongoConnection');
const { subscriber } = require('./events/redisPubSub');
const { PORT, FRONTEND_URL } = require('./config/envConfig');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const verifyToken = require('./middlewares/verifyToken');
const verifyAdmin = require('./middlewares/verifyAdmin');

// Import Background Jobs
const { initAnalyticsCron } = require('./crons/analyticsCron');
const { initCleanupCron } = require('./crons/cleanupCron');
const { initRecrawlCron } = require('./crons/recrawlCron');
const WorkerNode = require('./models/WorkerNodeModel');
const crawlerEngine = require('./crawler/crawlerEngine');
const os = require('os');
const crypto = require('crypto');

// Kafka Workers Removed

const app = express();

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'https://distributed-web-crawler-one.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.set('trust proxy', 1); // Trust first proxy (Render)
app.use(apiLimiter);

// Create HTTP server and wrap express
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:5173', 'https://distributed-web-crawler-one.vercel.app'],
    methods: ['GET', 'POST']
  }
});

// Broadcast Socket Connections
io.on('connection', (socket) => {
  logger.info(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Connect Databases & Services
// Connect Databases & Services
connectDB();

// Subscribe to Redis PubSub for Socket.IO
try {
  subscriber.subscribe('crawler-events', (err, count) => {
    if (err) {
      logger.error(`[Redis PubSub] Failed to subscribe: ${err.message}`);
    } else {
      logger.info(`[Redis PubSub] Subscribed to ${count} channel(s).`);
    }
  });

  subscriber.on('message', (channel, message) => {
    if (channel === 'crawler-events') {
      try {
        const payload = JSON.parse(message);
        // Broadcast to all connected clients
        io.emit('crawler.event', payload);
      } catch (e) {
        // parse error
      }
    }
  });
} catch (err) {
  logger.error(`[Redis PubSub] Subscription error: ${err.message}`);
}

// ─── Routes ─────────────────────────────────────────────
app.use('/api/user', require('./APIs/AuthAPI'));         
app.use('/api/search', require('./APIs/SearchAPI'));     
app.use('/api/crawler', verifyToken, verifyAdmin, require('./APIs/CrawlerAPI'));   
app.use('/api/admin', verifyToken, verifyAdmin, require('./APIs/AdminAPI'));       

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'CrawlX Backend API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/user/login | /api/user/admin/login | /api/user/register',
      search: '/api/search?q=...',
      crawler: '/api/crawler/add-url | /api/crawler/start | /api/crawler/stop | /api/crawler/status',
      admin: '/api/admin/dashboard-stats | /api/admin/indexed-pages | /api/admin/queue | /api/admin/logs | /api/admin/analytics'
    }
  });
});

// 404 fallback
// Add dummy routes for simulated AI APIs
// Disabled: AI Summary and Trending APIs using Elasticsearch were removed in Option A.

app.use((err, req, res, next) => {
  logger.error(`[Express] Error: ${err.message}`);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Initialize Background Cron Jobs
initAnalyticsCron();
initCleanupCron();
initRecrawlCron();

// Kafka worker threads removed

// Start the server
const workerId = `worker-${crypto.randomBytes(4).toString('hex')}`;
WorkerNode.create({
  workerId,
  name: `Node-${os.hostname()}-Master`,
  ip: '127.0.0.1',
  type: 'Indexer',
  status: 'idle',
  lastHeartbeat: new Date()
}).catch(() => {});

let lastCpuUsage = process.cpuUsage();
let lastTime = process.hrtime.bigint();

setInterval(async () => {
  try {
    const currentCpuUsage = process.cpuUsage();
    const currentTime = process.hrtime.bigint();
    
    // Calculate CPU usage percentage natively
    const elapsedTime = Number(currentTime - lastTime) / 1000; // microseconds
    const cpuTime = (currentCpuUsage.user - lastCpuUsage.user) + (currentCpuUsage.system - lastCpuUsage.system);
    const cpuUsage = Math.min(100, Math.max(1, Math.floor((cpuTime / elapsedTime) * 100)));
    
    lastCpuUsage = currentCpuUsage;
    lastTime = currentTime;
    
    // Real RAM usage of the Node process
    const memUsage = Math.floor((process.memoryUsage().rss / os.totalmem()) * 100);
    
    await WorkerNode.findOneAndUpdate(
      { workerId },
      { 
        lastHeartbeat: new Date(), 
        status: crawlerEngine.isRunning() ? 'running' : 'idle',
        cpu: cpuUsage,
        memory: memUsage,
        processedCount: crawlerEngine.getVisitedCount() || 0
      }
    );
  } catch (err) {}
}, 5000);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});