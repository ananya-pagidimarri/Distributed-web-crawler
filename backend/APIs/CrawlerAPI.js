const express = require('express');
const router = express.Router();
const UrlQueue = require('../models/UrlQueueModel');
const CrawledPage = require('../models/CrawledPageModel');
const FailedUrl = require('../models/FailedUrlModel');
const CrawlLog = require('../models/CrawlLogModel');
const SitemapTree = require('../models/SitemapTreeModel');
const crawlerEngine = require('../crawler/crawlerEngine');
const { fetchSitemap } = require('../crawler/sitemapParser');
const { normalize } = require('../crawler/urlNormalizer');

function buildUrlTree(domain, urls) {
  const tree = { name: domain, children: [] };
  urls.forEach(urlStr => {
    try {
      const parsed = new URL(urlStr);
      const parts = parsed.pathname.split('/').filter(Boolean);
      let currentLevel = tree.children;
      parts.forEach((part, idx) => {
        let existing = currentLevel.find(n => n.name === part);
        if (!existing) {
          existing = { name: part, url: idx === parts.length - 1 ? urlStr : null, children: [] };
          currentLevel.push(existing);
        }
        currentLevel = existing.children;
      });
    } catch (e) {}
  });
  return tree;
}

// POST /api/crawler/add-url
// Called by UrlSubmit component — adds seed URL to queue
router.post('/add-url', async (req, res) => {
  try {
    const { url, priority = 'High', depth = 3, bypassRobots = false, extractSitemaps = true } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

    // Normalize the URL first
    const normalizedUrl = normalize(url);
    if (!normalizedUrl) {
      return res.status(400).json({ success: false, message: 'Invalid or unsupported URL format' });
    }

    // Handle explicit Sitemap Injection
    if (normalizedUrl.endsWith('.xml')) {
      const urls = await fetchSitemap(normalizedUrl);
      if (urls.length > 0) {
        const domain = new URL(normalizedUrl).hostname;
        const tree = buildUrlTree(domain, urls);
        await SitemapTree.create({ domain, sitemapUrl: normalizedUrl, tree, totalUrls: urls.length });
        
        let queued = 0;
        for (const u of urls) {
          const added = await crawlerEngine.enqueue(u, priority, depth, { bypassRobots, extractSitemaps });
          if (added) queued++;
        }

        await CrawlLog.create({
          level: 'info',
          message: `[Sitemap Sandbox] Parsed ${normalizedUrl}: ${queued} URLs queued from sitemap.`,
          workerId: 'System'
        });

        return res.json({ success: true, message: `Sitemap parsed, ${queued} URLs queued.`, tree });
      } else {
        return res.status(400).json({ success: false, message: 'Could not parse sitemap or found 0 URLs.' });
      }
    }

    // Normal single URL Seed Injection
    const added = await crawlerEngine.enqueue(normalizedUrl, priority, depth, { bypassRobots, extractSitemaps });

    if (!added) {
      return res.status(409).json({ success: false, message: 'URL already in queue or recently visited' });
    }

    await CrawlLog.create({
      level: 'info',
      message: `[URL Frontier] Seeded: ${normalizedUrl} (Priority: ${priority}, Depth: ${depth})`,
      workerId: 'Frontier'
    });

    res.json({ success: true, url: normalizedUrl, priority, depth });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crawler/start
// Start the crawler engine — processes all pending queue items
router.post('/start', async (req, res) => {
  try {
    await CrawlLog.create({
      level: 'success',
      message: '[Orchestrator] Crawler engine started. Processing frontier queue...',
      workerId: 'System'
    });

    // Run crawler async — don't wait for it to finish
    crawlerEngine.startCrawling().catch(async (err) => {
      await CrawlLog.create({
        level: 'error',
        message: `[Orchestrator] Crawler engine error: ${err.message}`,
        workerId: 'System'
      });
    });

    res.json({ success: true, status: 'crawling', message: 'Crawler engine started' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/crawler/stop
// Stop crawler engine
router.post('/stop', async (req, res) => {
  try {
    crawlerEngine.stopCrawling();
    await CrawlLog.create({
      level: 'warn',
      message: '[Orchestrator] Crawler engine manually stopped.',
      workerId: 'System'
    });
    res.json({ success: true, status: 'paused', message: 'Crawler stopped' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/crawler/status
router.get('/status', async (req, res) => {
  try {
    const queueSize = await UrlQueue.countDocuments({ status: 'pending' });
    const processing = await UrlQueue.countDocuments({ status: 'processing' });
    const done = await UrlQueue.countDocuments({ status: 'done' });
    const failed = await FailedUrl.countDocuments();

    res.json({
      success: true,
      isRunning: crawlerEngine.isRunning(),
      queueSize,
      processing,
      done,
      failed,
      visitedUrls: crawlerEngine.getVisitedCount(),
      uniqueFingerprints: await crawlerEngine.getFingerprintCount(),
      domainRateLimits: await crawlerEngine.getDomainRateLimits()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;