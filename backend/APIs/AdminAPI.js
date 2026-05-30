const express = require('express');
const router = express.Router();
const CrawledPage = require('../models/CrawledPageModel');
const UrlQueue = require('../models/UrlQueueModel');
const FailedUrl = require('../models/FailedUrlModel');
const CrawlLog = require('../models/CrawlLogModel');
const WorkerNode = require('../models/WorkerNodeModel');
const SitemapTree = require('../models/SitemapTreeModel');
const SearchHistory = require('../models/SearchHistoryModel');

// GET /api/admin/dashboard-stats
// Returns all stats the Dashboard page needs: stats, workers, logs, globalStatus
router.get('/dashboard-stats', async (req, res) => {
  try {
    const pagesIndexed = await CrawledPage.countDocuments();
    const queueSize = await UrlQueue.countDocuments({ status: 'pending' });
    const failedCount = await FailedUrl.countDocuments();
    const recentLogs = await CrawlLog.find().sort({ timestamp: -1 }).limit(20);
    
    const fifteenSecondsAgo = new Date(Date.now() - 15000);
    const activeWorkers = await WorkerNode.find({ lastHeartbeat: { $gte: fifteenSecondsAgo } });
    const cpuUsage = activeWorkers.length > 0 
      ? Math.round(activeWorkers.reduce((acc, w) => acc + (w.cpu || 0), 0) / activeWorkers.length) 
      : 0;

    res.json({
      success: true,
      stats: {
        pagesCrawled: pagesIndexed,
        pagesIndexed,
        queueSize,
        activeWorkers: activeWorkers.length,
        crawlRate: 0,
        failedCount,
        cpuUsage,
        memoryUsage: 0,
        averageLatency: 0
      },
      logs: recentLogs.map(l => ({
        id: l._id.toString(),
        timestamp: l.timestamp,
        level: l.level,
        message: l.message,
        workerId: l.workerId
      })),
      globalStatus: 'idle'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/indexed-pages
// Returns all crawled/indexed pages for the SearchEngine admin page
router.get('/indexed-pages', async (req, res) => {
  try {
    const query = req.query.q || '';
    const domain = req.query.domain || '';
    const type = req.query.type || 'All';
    const sortBy = req.query.sortBy || 'score';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let filter = {};
    if (query) {
      const regex = new RegExp(query, 'i');
      filter.$or = [{ title: regex }, { description: regex }, { url: regex }];
    }
    if (domain) filter.url = new RegExp(domain, 'i');
    if (type && type !== 'All') filter.type = type;

    const sortMap = { score: { score: -1 }, date: { crawledAt: -1 }, size: { size: -1 } };
    const sortOpt = sortMap[sortBy] || { score: -1 };

    const total = await CrawledPage.countDocuments(filter);
    const pages = await CrawledPage.find(filter).sort(sortOpt).skip((page - 1) * limit).limit(limit);

    res.json({
      success: true,
      results: pages.map(p => ({
        title: p.title,
        url: p.url,
        description: p.description,
        score: p.score,
        crawledAt: p.crawledAt,
        size: p.size,
        type: p.type
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/indexed-pages/:id
// Remove a bad page from the index
router.delete('/indexed-pages/:id', async (req, res) => {
  try {
    await CrawledPage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Page removed from index' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/queue
// Returns frontier queue (pending) + failed URLs — for Queue.jsx
router.get('/queue', async (req, res) => {
  try {
    const frontierQueue = await UrlQueue.find({ status: 'pending' }).sort({ priority: 1, addedAt: 1 }).limit(100);
    const failedUrls = await FailedUrl.find().sort({ timestamp: -1 }).limit(50);

    res.json({
      success: true,
      frontierQueue: frontierQueue.map(q => ({
        id: q._id,
        url: q.url,
        priority: q.priorityLabel || q.priority,
        depth: q.depth,
        addedAt: q.addedAt
      })),
      failedUrls: failedUrls.map(f => ({
        id: f._id,
        url: f.url,
        error: f.error,
        code: f.code,
        timestamp: f.timestamp
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/queue/flush
// Flush all pending URLs from queue
router.delete('/queue/flush', async (req, res) => {
  try {
    const result = await UrlQueue.deleteMany({ status: 'pending' });
    await CrawlLog.create({
      level: 'warn',
      message: `[URL Frontier] Flushed ${result.deletedCount} pending URLs from queue.`,
      workerId: 'System'
    });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/queue/requeue-failed
// Move all failed URLs back to pending queue
router.post('/queue/requeue-failed', async (req, res) => {
  try {
    const failedUrls = await FailedUrl.find();
    if (failedUrls.length === 0) {
      return res.json({ success: true, requeued: 0 });
    }
    const toInsert = failedUrls.map(f => ({
      url: f.url,
      priority: 1,
      priorityLabel: 'High',
      depth: 1,
      status: 'pending',
      addedAt: new Date()
    }));
    await UrlQueue.insertMany(toInsert);
    await FailedUrl.deleteMany({});
    await CrawlLog.create({
      level: 'success',
      message: `[URL Frontier] Re-queued ${failedUrls.length} failed URLs back into frontier.`,
      workerId: 'System'
    });
    res.json({ success: true, requeued: failedUrls.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/queue/retry/:id
// Retry a specific failed URL
router.post('/queue/retry/:id', async (req, res) => {
  try {
    const failedUrl = await FailedUrl.findById(req.params.id);
    if (!failedUrl) return res.status(404).json({ success: false, message: 'Not found' });
    
    await UrlQueue.create({
      url: failedUrl.url,
      priority: 1,
      priorityLabel: 'High',
      depth: 1,
      status: 'pending',
      addedAt: new Date()
    });
    await FailedUrl.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'URL re-queued' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/queue/failed/:id
// Delete a specific failed URL
router.delete('/queue/failed/:id', async (req, res) => {
  try {
    await FailedUrl.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Failed URL removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/graph
// Returns node and edge connections for the Crawl Depth graph
router.get('/graph', async (req, res) => {
  try {
    const pages = await CrawledPage.find({}, 'url parentUrl depth').limit(500);
    res.json({ success: true, pages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/logs
// Returns crawl logs for the Logs.jsx terminal page
router.get('/logs', async (req, res) => {
  try {
    const level = req.query.level || '';
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 200;

    let filter = {};
    if (level && level !== 'All') filter.level = level;
    if (search) filter.message = new RegExp(search, 'i');

    const logs = await CrawlLog.find(filter).sort({ timestamp: -1 }).limit(limit);
    res.json({
      success: true,
      logs: logs.map(l => ({
        id: l._id.toString(),
        timestamp: l.timestamp,
        level: l.level,
        message: l.message,
        workerId: l.workerId
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/logs
// Clear all logs
router.delete('/logs', async (req, res) => {
  try {
    await CrawlLog.deleteMany({});
    res.json({ success: true, message: 'All logs cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/robots
// Returns all stored robots.txt domain configurations
router.get('/robots', async (req, res) => {
  try {
    const RobotsTxt = require('../models/RobotsTxtModel');
    const robots = await RobotsTxt.find().sort({ fetchedAt: -1 });
    res.json({ success: true, robots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/robots/blocked
// Returns URLs blocked by robots.txt policies
router.get('/robots/blocked', async (req, res) => {
  try {
    const blocked = await FailedUrl.find({ code: 403, reason: /robots/i }).sort({ addedAt: -1 }).limit(200);
    res.json({ success: true, blocked });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/analytics
// Returns analytics data for Analytics.jsx charts
router.get('/analytics', async (req, res) => {
  try {
    const totalIndexed = await CrawledPage.countDocuments();
    const totalFailed = await FailedUrl.countDocuments();
    const totalQueue = await UrlQueue.countDocuments({ status: 'pending' });

    // Group indexed pages by type
    const typeBreakdown = await CrawledPage.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Group failed URLs by error code
    const failedCodeBreakdown = await FailedUrl.aggregate([
      { $group: { _id: '$code', count: { $sum: 1 } } }
    ]);

    // Top domains indexed
    const topDomains = await CrawledPage.aggregate([
      {
        $project: {
          domain: {
            $regexFind: {
              input: '$url',
              regex: /https?:\/\/([^\/]+)/
            }
          }
        }
      },
      { $group: { _id: '$domain.captures', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Search Analytics
    const totalSearches = await SearchHistory.countDocuments();
    const trendingSearches = await SearchHistory.aggregate([
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      analytics: {
        totalIndexed,
        totalFailed,
        totalQueue,
        typeBreakdown,
        failedCodeBreakdown,
        topDomains,
        totalSearches,
        trendingSearches
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/workers
// Returns all active worker nodes that have pinged within the last 15 seconds
router.get('/workers', async (req, res) => {
  try {
    const fifteenSecondsAgo = new Date(Date.now() - 15000);
    const activeWorkers = await WorkerNode.find({
      lastHeartbeat: { $gte: fifteenSecondsAgo }
    }).sort({ name: 1 });

    res.json({
      success: true,
      workers: activeWorkers.map(w => ({
        id: w.workerId,
        name: w.name,
        ip: w.ip,
        type: w.type,
        status: w.status,
        cpu: w.cpu,
        memory: w.memory,
        rate: w.rate || 0,
        processedCount: w.processedCount || 0,
        currentUrl: w.currentUrl,
        lastHeartbeat: w.lastHeartbeat
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/crawl-history
// Returns grouped crawl history based on domains
router.get('/crawl-history', async (req, res) => {
  try {
    const history = await CrawledPage.aggregate([
      {
        $project: {
          domain: {
            $regexFind: { input: '$url', regex: /https?:\/\/([^\/]+)/ }
          },
          CrawledAt: 1,
          crawledAt: 1
        }
      },
      {
        $group: {
          _id: '$domain.captures',
          startedAt: { $min: { $ifNull: ['$CrawledAt', '$crawledAt'] } },
          completedAt: { $max: { $ifNull: ['$CrawledAt', '$crawledAt'] } },
          pagesIndexed: { $sum: 1 }
        }
      },
      { $sort: { completedAt: -1 } }
    ]);
    
    res.json({
      success: true,
      history: history.map(h => ({
        id: h._id ? h._id[0] : 'unknown',
        domain: h._id && h._id.length > 0 ? h._id[0] : 'unknown',
        startedAt: h.startedAt,
        completedAt: h.completedAt,
        status: 'Completed',
        pagesIndexed: h.pagesIndexed
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/sitemaps
router.get('/sitemaps', async (req, res) => {
  try {
    const sitemaps = await SitemapTree.find().sort({ crawledAt: -1 }).lean();
    res.json({ success: true, sitemaps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/index-health
router.get('/index-health', async (req, res) => {
  try {
    const healthStats = await CrawledPage.aggregate([
      { $group: { _id: "$statusCode", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Map status codes to nice labels
    const formatted = healthStats.map(stat => {
      let name = stat._id ? stat._id.toString() : 'Unknown';
      if (name.startsWith('2')) name = `${name} OK`;
      else if (name.startsWith('3')) name = `${name} Redirect`;
      else if (name.startsWith('4')) name = `${name} Client Error`;
      else if (name.startsWith('5')) name = `${name} Server Error`;
      else if (name !== 'Unknown') name = `${name} Unknown`;
      
      return {
        name,
        value: stat.count,
        code: stat._id
      };
    });

    res.json({ success: true, health: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
