const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { authLimiter } = require('../middlewares/rateLimiter');
const verifyToken = require('../middlewares/verifyToken');
const SearchHistory = require('../models/SearchHistoryModel');

// Regular user login — no role restriction, just valid credentials
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// Admin-only login — enforces role: 'admin'
router.post('/admin/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await authService.login(email, password, 'admin');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// Register new user
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const user = await authService.register(name, email, password);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get user search history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json({ success: true, history: history.map(h => h.query) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save user search history
router.post('/history', verifyToken, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'Query is required' });
    
    // Prevent consecutive duplicate history entries
    const lastSearch = await SearchHistory.findOne({ userId: req.user.id }).sort({ timestamp: -1 });
    if (!lastSearch || lastSearch.query !== query) {
      await SearchHistory.create({ userId: req.user.id, query });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;