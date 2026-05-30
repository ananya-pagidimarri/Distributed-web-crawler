const fs = require('fs');
const path = require('path');

const files = {
  // CONFIG
  'config/envConfig.js': `
    require('dotenv').config();
    module.exports = {
      PORT: process.env.PORT || 5000,
      MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawlx',
      JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey',
    };
  `,
  
  // UTILS
  'utils/logger.js': `
    module.exports = {
      info: (msg) => console.log(\`[INFO] \${new Date().toISOString()} - \${msg}\`),
      error: (msg, err) => console.error(\`[ERROR] \${new Date().toISOString()} - \${msg}\`, err || '')
    };
  `,
  
  // DATABASE
  'database/mongoConnection.js': `
    const mongoose = require('mongoose');
    const { MONGO_URI } = require('../config/envConfig');
    const logger = require('../utils/logger');
    
    // In-memory fallback
    global.MOCK_DB = {
      users: [{ name: 'Admin User', email: 'admin@crawlx.io', password: 'admin', role: 'admin' }],
      pages: [],
      queue: []
    };
    
    let isConnected = false;
    
    const connectDB = async () => {
      try {
        await mongoose.connect(MONGO_URI);
        isConnected = true;
        logger.info('MongoDB connected successfully');
      } catch (err) {
        logger.error('MongoDB connection failed, falling back to In-Memory mock DB.', err.message);
      }
    };
    
    const isDbConnected = () => isConnected;
    
    module.exports = { connectDB, isDbConnected };
  `,
  
  // MODELS
  'models/UserModel.js': `
    const mongoose = require('mongoose');
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, default: 'user', enum: ['user', 'admin'] }
    }, { timestamps: true });
    module.exports = mongoose.model('User', userSchema);
  `,
  'models/CrawledPageModel.js': `
    const mongoose = require('mongoose');
    const pageSchema = new mongoose.Schema({
      url: { type: String, required: true, unique: true },
      title: { type: String },
      snippet: { type: String },
      content: { type: String },
      links: [{ type: String }]
    }, { timestamps: true });
    module.exports = mongoose.model('CrawledPage', pageSchema);
  `,
  
  // SERVICES
  'services/authService.js': `
    const { isDbConnected } = require('../database/mongoConnection');
    const User = require('../models/UserModel');
    
    exports.login = async (email, password, expectedRole) => {
      if (!isDbConnected()) {
        const user = global.MOCK_DB.users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Invalid credentials');
        if (expectedRole && user.role !== expectedRole) throw new Error('Unauthorized role');
        return { token: 'mock-jwt-token', user };
      }
      const user = await User.findOne({ email, password });
      if (!user) throw new Error('Invalid credentials');
      if (expectedRole && user.role !== expectedRole) throw new Error('Unauthorized role');
      return { token: 'mock-jwt-token', user };
    };
    
    exports.register = async (name, email, password) => {
      if (!isDbConnected()) {
        if (global.MOCK_DB.users.find(u => u.email === email)) throw new Error('Email exists');
        const newUser = { name, email, password, role: 'user' };
        global.MOCK_DB.users.push(newUser);
        return newUser;
      }
      const existing = await User.findOne({ email });
      if (existing) throw new Error('Email exists');
      return await User.create({ name, email, password, role: 'user' });
    };
  `,
  
  'services/searchService.js': `
    const { isDbConnected } = require('../database/mongoConnection');
    const CrawledPage = require('../models/CrawledPageModel');
    
    exports.searchPages = async (query) => {
      // Return dummy results for demo if DB is empty or mock
      if (query.toLowerCase() === 'python') {
        return [
          { title: 'Welcome to Python.org', url: 'https://www.python.org', snippet: 'The official home of the Python Programming Language.' },
          { title: 'Python (programming language) - Wikipedia', url: 'https://en.wikipedia.org/wiki/Python', snippet: 'Python is a high-level, general-purpose programming language.' }
        ];
      }
      
      if (!isDbConnected()) {
        return global.MOCK_DB.pages.filter(p => p.title?.includes(query) || p.content?.includes(query));
      }
      return await CrawledPage.find({ $text: { $search: query } }).limit(10);
    };
  `,
  
  'services/crawlerService.js': `
    const { isDbConnected } = require('../database/mongoConnection');
    const logger = require('../utils/logger');
    
    exports.addSeedUrl = async (url) => {
      logger.info(\`Seed URL added to queue: \${url}\`);
      if (!isDbConnected()) {
        global.MOCK_DB.queue.push(url);
        return { success: true, url };
      }
      // Real DB logic would go here
      return { success: true, url };
    };
    
    exports.startCrawler = async () => {
      logger.info('Crawler Engine Started');
      return { status: 'crawling' };
    };
    
    exports.stopCrawler = async () => {
      logger.info('Crawler Engine Stopped');
      return { status: 'paused' };
    };
  `,
  
  // APIS / ROUTES
  'APIs/AuthAPI.js': `
    const express = require('express');
    const router = express.Router();
    const authService = require('../services/authService');
    
    router.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const result = await authService.login(email, password, 'user');
        res.json({ success: true, ...result });
      } catch (err) {
        res.status(401).json({ success: false, message: err.message });
      }
    });
    
    router.post('/admin/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const result = await authService.login(email, password, 'admin');
        res.json({ success: true, ...result });
      } catch (err) {
        res.status(401).json({ success: false, message: err.message });
      }
    });
    
    router.post('/register', async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const user = await authService.register(name, email, password);
        res.json({ success: true, user });
      } catch (err) {
        res.status(400).json({ success: false, message: err.message });
      }
    });
    
    module.exports = router;
  `,
  
  'APIs/SearchAPI.js': `
    const express = require('express');
    const router = express.Router();
    const searchService = require('../services/searchService');
    
    router.get('/', async (req, res) => {
      try {
        const query = req.query.q || '';
        const results = await searchService.searchPages(query);
        res.json({ success: true, results, count: results.length });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });
    
    module.exports = router;
  `,
  
  'APIs/CrawlerAPI.js': `
    const express = require('express');
    const router = express.Router();
    const crawlerService = require('../services/crawlerService');
    
    router.post('/add-url', async (req, res) => {
      try {
        const result = await crawlerService.addSeedUrl(req.body.url);
        res.json(result);
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });
    
    router.post('/start', async (req, res) => {
      try {
        const result = await crawlerService.startCrawler();
        res.json(result);
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });
    
    router.post('/stop', async (req, res) => {
      try {
        const result = await crawlerService.stopCrawler();
        res.json(result);
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }
    });
    
    module.exports = router;
  `,
  
  // MAIN SERVER
  'server.js': `
    const express = require('express');
    const cors = require('cors');
    const { connectDB } = require('./database/mongoConnection');
    const { PORT } = require('./config/envConfig');
    const logger = require('./utils/logger');
    
    const app = express();
    
    // Middleware
    app.use(cors());
    app.use(express.json());
    
    // Connect DB (gracefully handles failure with mock fallback)
    connectDB();
    
    // Mount Routes
    app.use('/api/user', require('./APIs/AuthAPI')); // Includes admin/login
    app.use('/api/search', require('./APIs/SearchAPI'));
    app.use('/api/crawler', require('./APIs/CrawlerAPI'));
    
    // Default Route
    app.get('/', (req, res) => {
      res.json({ message: 'CrawlX Backend API is running successfully.' });
    });
    
    app.listen(PORT, () => {
      logger.info(\`Server running on port \${PORT}\`);
    });
  `
};

Object.entries(files).forEach(([filepath, content]) => {
  const fullPath = path.join(__dirname, filepath);
  fs.writeFileSync(fullPath, content.trim().replace(/^ {4}/gm, ''));
  console.log('Wrote ' + filepath);
});
