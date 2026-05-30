const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDB } = require('./database/mongoConnection');
const { kafka, connectKafka } = require('./events/kafkaClient');
const { PORT, FRONTEND_URL } = require('./config/envConfig');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const verifyToken = require('./middlewares/verifyToken');
const verifyAdmin = require('./middlewares/verifyAdmin');

// Import Background Jobs
const { initAnalyticsCron } = require('./crons/analyticsCron');
const { initCleanupCron } = require('./crons/cleanupCron');
const { initRecrawlCron } = require('./crons/recrawlCron');

// Import Kafka Workers
const { runIndexWorker } = require('./workers/indexWorker');
const { runFailedWorker } = require('./workers/failedWorker');

const app = express();

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'https://distributed-web-crawler-one.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
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
connectDB();
connectKafka().then(async () => {
  // Set up Kafka Consumer for Socket.IO
  try {
    const consumer = kafka.consumer({ groupId: 'dashboard-group' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'crawler-events', fromBeginning: false });
    logger.info('[Kafka] Consumer attached to topic: crawler-events');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const eventStr = message.value.toString();
        try {
          const payload = JSON.parse(eventStr);
          // Broadcast to all connected clients
          io.emit('crawler.event', payload);
        } catch (e) {
          // parse error
        }
      }
    });
  } catch (err) {
    logger.error(`[Kafka] Consumer error: ${err.message}`);
  }
});

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

// Start Kafka Worker Threads
runIndexWorker().catch(err => logger.error('IndexWorker failed to start: ' + err.message));
runFailedWorker().catch(err => logger.error('FailedWorker failed to start: ' + err.message));

// Start the server
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});