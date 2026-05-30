const express = require('express');
const router = express.Router();
const Page = require('../models/CrawledPageModel');
const SearchHistory = require('../models/SearchHistoryModel');
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// GET /api/search?q=...
router.get('/', async (req, res) => {
  try {
    const Query = req.query.q || '';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { domain, category, sortBy } = req.query;

    if (Query.trim() && page === 1) {
      SearchHistory.create({ query: Query.trim() }).catch(err => console.error("Search logging error:", err));
    }

    const skip = (page - 1) * limit;

    let queryObj = {};
    let projection = {};
    let sortOption = {};

    if (Query.trim()) {
      queryObj.$text = { $search: Query };
      projection = { score: { $meta: 'textScore' } };
      sortOption = sortBy === 'relevance'
        ? { score: { $meta: 'textScore' } }
        : sortBy === 'date'
          ? { CrawledAt: -1 }
          : { score: { $meta: 'textScore' } };
    } else {
      sortOption = { CrawledAt: -1 };
    }

    if (domain) queryObj.Domain = { $regex: domain, $options: 'i' };
    if (category) queryObj.CompanyCategory = { $in: [new RegExp(category, 'i')] };

    let Pages = [];
    let total = 0;

    if (Query.trim()) {
      const safeQuery = escapeRegex(Query);
      const regexQuery = {
        $or: [
          { url: { $regex: safeQuery, $options: 'i' } },
          { Title: { $regex: safeQuery, $options: 'i' } }
        ]
      };
      if (domain) regexQuery.Domain = { $regex: escapeRegex(domain), $options: 'i' };
      if (category) regexQuery.CompanyCategory = { $in: [new RegExp(escapeRegex(category), 'i')] };

      const [textPages, textTotal, regexPages, regexTotal] = await Promise.all([
        Page.find(queryObj, projection).sort(sortOption).skip(skip).limit(limit).lean(),
        Page.countDocuments(queryObj),
        Page.find(regexQuery).sort({ CrawledAt: -1 }).skip(skip).limit(limit).lean(),
        Page.countDocuments(regexQuery)
      ]);
      
      // Merge results: Regex matches (URL/Title) get top priority
      const merged = [...regexPages];
      const seenIds = new Set(regexPages.map(p => p._id.toString()));
      
      for (const tp of textPages) {
         if (!seenIds.has(tp._id.toString())) {
            merged.push(tp);
            seenIds.add(tp._id.toString());
         }
      }
      
      Pages = merged.slice(0, limit);
      total = Math.max(textTotal, regexTotal);
    } else {
      [Pages, total] = await Promise.all([
        Page.find(queryObj).sort(sortOption).skip(skip).limit(limit).lean(),
        Page.countDocuments(queryObj)
      ]);
    }

    const domains = [...new Set(Pages.map(p => p.Domain).filter(Boolean))];
    const categories = [...new Set(Pages.flatMap(p => p.CompanyCategory || []).filter(Boolean))];

    res.json({
      success: true,
      results: Pages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalResults: total,
      availableDomains: domains,
      availableCategories: categories
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/search/suggest?q=...
router.get('/suggest', async (req, res) => {
  try {
    const Query = req.query.q || '';
    if (!Query || Query.trim().length < 2) return res.json([]);
    
    const q = escapeRegex(Query.trim().toLowerCase());
    
    const [keywordMatches, tagMatches, titleMatches, entityMatches] = 
      await Promise.all([
        Page.aggregate([
          { $match: { Keywords: { $regex: q, $options: 'i' } } },
          { $unwind: '$Keywords' },
          { $match: { Keywords: { $regex: q, $options: 'i' } } },
          { $group: { _id: '$Keywords', count: { $sum: 1 }, domains: { $addToSet: '$Domain' } } },
          { $sort: { count: -1 } },
          { $limit: 6 }
        ]),
        Page.aggregate([
          { $match: { SemanticSearchTags: { $regex: q, $options: 'i' } } },
          { $unwind: '$SemanticSearchTags' },
          { $match: { SemanticSearchTags: { $regex: q, $options: 'i' } } },
          { $group: { _id: '$SemanticSearchTags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 4 }
        ]),
        Page.find(
          { 
            $or: [
              { Title: { $regex: q, $options: 'i' } },
              { url: { $regex: q, $options: 'i' } }
            ]
          },
          { Title: 1, Domain: 1, url: 1 }
        ).limit(4).lean(),
        Page.aggregate([
          { $match: {
              $or: [
                { 'NamedEntities.technologies': { $regex: q, $options: 'i' } },
                { 'NamedEntities.companies':    { $regex: q, $options: 'i' } },
                { 'NamedEntities.products':     { $regex: q, $options: 'i' } }
              ]
          }},
          { $limit: 3 },
          { $project: { NamedEntities: 1, Domain: 1, _id: 0 } }
        ])
      ]);

    const suggestions = [];
    const seen = new Set();
    const addSuggestion = (text, type, meta = {}) => {
      if(!text) return;
      const key = text.toLowerCase();
      if (!seen.has(key) && suggestions.length < 8) {
        seen.add(key);
        suggestions.push({ text, type, ...meta });
      }
    };

    keywordMatches.forEach(k => addSuggestion(k._id, 'keyword', { count: k.count, domain: k.domains?.[0] || null }));
    tagMatches.forEach(t => addSuggestion(t._id, 'semantic', { count: t.count }));
    entityMatches.forEach(page => {
      const entities = [
        ...(page.NamedEntities?.technologies || []),
        ...(page.NamedEntities?.companies || []),
        ...(page.NamedEntities?.products || [])
      ];
      entities.forEach(e => {
        if (e && e.toLowerCase().startsWith(q)) {
          addSuggestion(e, 'entity', { domain: page.Domain });
        }
      });
    });
    titleMatches.forEach(page => {
      let displayTitle = page.Title;
      if (!displayTitle || displayTitle === 'Untitled') {
        try {
          // Keep it short for the suggestion box
          const pUrl = new URL(page.url);
          displayTitle = pUrl.hostname.replace('www.', '') + pUrl.pathname;
          if (displayTitle.length > 40) displayTitle = displayTitle.substring(0, 40) + '...';
        } catch(e) {
          displayTitle = page.url;
        }
      }
      addSuggestion(displayTitle, 'title', { domain: page.Domain });
    });

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/search/related?q=...
router.get('/related', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q) return res.json([]);

    const pages = await Page.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' }, Keywords: 1, SemanticSearchTags: 1 }
    ).sort({ score: { $meta: 'textScore' } }).limit(5).lean();

    const allKeywords = pages.flatMap(p => [
      ...(p.Keywords || []),
      ...(p.SemanticSearchTags || [])
    ]);

    const queryWords = q.toLowerCase().split(' ');
    const freq = {};
    allKeywords.forEach(k => {
      const kl = k.toLowerCase();
      if (!queryWords.some(qw => kl.includes(qw))) {
        freq[k] = (freq[k] || 0) + 1;
      }
    });

    const related = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, parseInt(limit))
      .map(([text]) => text);

    res.json(related);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/search/trending
router.get('/trending', async (req, res) => {
  try {
    const trending = await Page.aggregate([
      { $unwind: '$Keywords' },
      { $group: { _id: '$Keywords', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { keyword: '$_id', count: 1, _id: 0 } }
    ]);
    res.json(trending);
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;