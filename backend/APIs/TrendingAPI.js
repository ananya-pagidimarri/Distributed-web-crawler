const express = require('express');
const router = express.Router();
const axios = require('axios');
const { NEWS_API_KEY } = require('../config/envConfig');
const { client } = require('../search/elasticClient');

// GET /api/trending
router.get('/', async (req, res) => {
  try {
    if (NEWS_API_KEY) {
      const response = await axios.get(`https://newsapi.org/v2/top-headlines?category=technology&language=en&apiKey=${NEWS_API_KEY}`);
      const trending = response.data.articles.slice(0, 5).map(article => ({
        title: article.title,
        url: article.url,
        source: article.source.name
      }));
      return res.json({ success: true, trending });
    }

    // Dynamically fetch latest 5 indexed pages from Elasticsearch
    const result = await client.search({
      index: 'pages',
      body: {
        size: 5,
        query: { match_all: {} },
        sort: [{ crawledAt: { order: 'desc' } }]
      }
    });

    const trending = result.hits.hits.map(hit => ({
      title: hit._source.title || hit._source.url,
      url: hit._source.url,
      source: 'CrawlX Index'
    }));

    res.json({ success: true, trending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
