const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const { OPENAI_API_KEY } = require('../config/envConfig');
const CrawledPage = require('../models/CrawledPageModel');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY || 'mock-key' });

// GET /api/summary?url=...
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'URL required' });

    const page = await CrawledPage.findOne({ url });
    if (!page) return res.status(404).json({ success: false, message: 'Page not found in index' });

    // Mock response if no API key is provided
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'mock-key') {
      return res.json({
        success: true,
        summary: `(AI Simulation): This page titled "${page.title}" discusses topics related to ${page.description ? page.description.substring(0, 50) : 'various subjects'}. It provides in-depth architecture and insights.`
      });
    }

    // Real OpenAI API Call
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an AI assistant that summarizes web pages in 2-3 sentences for a search engine snippet." },
        { role: "user", content: `Summarize this page content: ${page.content.substring(0, 2000)}` }
      ],
      max_tokens: 100
    });

    res.json({
      success: true,
      summary: completion.choices[0].message.content
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
