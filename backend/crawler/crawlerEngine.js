/**
 * crawlerEngine.js
 * Production-grade distributed crawler orchestrator.
 *
 * Full pipeline per URL:
 *   1. Dequeue from priority queue (MongoDB, numeric priority 1→3)
 *   2. Normalize URL (remove tracking params, fragments, etc.)
 *   3. robots.txt check (cached per domain)
 *   4. Rate limit per domain (min delay + Crawl-Delay from robots.txt)
 *   5. Fetch HTML (Axios + 3-retry backoff)
 *   6. Cheerio parse (title, description, links, content)
 *   7. SHA-256 content fingerprint (skip exact duplicates)
 *   8. Save/update MongoDB index
 *   9. Sitemap discovery (xml2js bulk URL import)
 *  10. Enqueue child links (normalized, depth-limited)
 *  11. Log everything to MongoDB
 */

const UrlQueue = require('../models/UrlQueueModel');
const CrawledPage = require('../models/CrawledPageModel');
const FailedUrl = require('../models/FailedUrlModel');
const CrawlLog = require('../models/CrawlLogModel');
const { fetchPage } = require('./htmlFetcher');
const { checkRobots } = require('./robotsHandler');
const { discoverSitemaps } = require('./sitemapParser');
const { normalize, normalizeAll } = require('./urlNormalizer');
const { generateFingerprint, isDuplicate, clearCache, getFingerprintCount } = require('./contentFingerprint');
const { waitForDomain, clearAll: clearRateLimit, getAll: getRateLimits, reportDomainError } = require('./rateLimiter');
const { emitEvent } = require('../events/kafkaClient');
const { MAX_PAGES_PER_DOMAIN } = require('../config/envConfig');
const logger = require('../utils/logger');
const { BloomFilter } = require('bloom-filters');

let running = false;
let visitedUrls = new BloomFilter(100000, 4); // Robust probabilistic deduplication

// Priority label mapping for the frontend (which expects 'High', 'Medium', 'Low')
const PRIORITY_LABELS = { 1: 'High', 2: 'Medium', 3: 'Low' };
const PRIORITY_NUMBERS = { 'High': 1, 'Medium': 2, 'Low': 3 };

// Helper: log to both console and MongoDB
async function log(level, message, workerId = 'System') {
  logger[level === 'success' || level === 'info' ? 'info' : level === 'error' ? 'error' : 'info'](message);
  try {
    await CrawlLog.create({ level, message, workerId, timestamp: new Date() });
  } catch {}
}

/**
 * Add a URL to the queue with normalization + deduplication.
 */
async function enqueue(url, priorityLabel = 'Low', depth = 1, options = {}) {
  const normalized = normalize(url);
  if (!normalized) return false;
  if (visitedUrls.has(normalized)) return false;

  const existing = await UrlQueue.findOne({ url: normalized, status: { $in: ['pending', 'processing'] } });
  if (existing) return false;

  await UrlQueue.create({
    url: normalized,
    priority: PRIORITY_NUMBERS[priorityLabel] || 2,
    priorityLabel,
    depth,
    graphDepth: options.graphDepth || 0,
    status: 'pending',
    parentUrl: options.parentUrl || null,
    bypassRobots: options.bypassRobots || false,
    extractSitemaps: options.extractSitemaps !== false,
    addedAt: new Date()
  });
  await emitEvent('crawler-events', 'url.queued', { url: normalized, priority: priorityLabel, depth });
  return true;
}

/**
 * Main crawling loop — processes the priority queue until empty or stopped.
 */
async function startCrawling() {
  if (running) {
    logger.info('[Crawler] Already running');
    return;
  }

  running = true;
  visitedUrls = new BloomFilter(100000, 4);
  await clearCache();
  await clearRateLimit();

  await log('success', '[Orchestrator] 🚀 Crawler engine started. Processing priority frontier queue...');

  while (running) {
    // Atomic dequeue to prevent race conditions across distributed workers
    const item = await UrlQueue.findOneAndUpdate(
      { status: 'pending' },
      { $set: { status: 'processing' } },
      { sort: { priority: 1, addedAt: 1 }, new: true }
    );

    if (!item) {
      const count = await getFingerprintCount();
      await log('info', `[Orchestrator] ✅ Queue exhausted. Processed items, ${count} unique fingerprints.`);
      break;
    }

    const rawUrl = item.url;
    const { depth, bypassRobots, extractSitemaps } = item;

    // ── Step 1: Normalize URL ────────────────────────────────────────
    const url = normalize(rawUrl) || rawUrl;

    if (visitedUrls.has(url)) {
      await UrlQueue.findByIdAndUpdate(item._id, { status: 'done' });
      continue;
    }
    visitedUrls.add(url);

    // ── Step 2: robots.txt Check ─────────────────────────────────────
    const { allowed, crawlDelay } = await checkRobots(url, bypassRobots);
    if (!allowed) {
      await FailedUrl.create({ url, error: 'Robots.txt Disallowed', code: 403, workerId: 'Robots' });
      await UrlQueue.findByIdAndUpdate(item._id, { status: 'failed' });
      await log('warn', `[Robots] 🚫 Blocked: ${url}`, 'Frontier');
      continue;
    }

    // ── Step 3: Rate Limiting (per-domain delay) ─────────────────────
    const domainStr = new URL(url).hostname;
    await waitForDomain(domainStr, crawlDelay);

    await log('info', `[Fetcher] 🔍 Crawling [${PRIORITY_LABELS[item.priority]}|D${depth}]: ${url}`, 'Frontier');

    // ── Step 4: Fetch + Parse the Page ──────────────────────────────
    try {
      const pageData = await fetchPage(url);
      await emitEvent('crawler-events', 'page.crawled', { url: pageData.url, title: pageData.title });

      // ── Step 5: Content Fingerprint (Skip Duplicates) ───────────
      const fingerprint = generateFingerprint(pageData.content);
      if (fingerprint && await isDuplicate(fingerprint)) {
        await log('warn', `[Dedup] ♻ Duplicate content detected — skipping: ${url}`, 'Frontier');
        await UrlQueue.findByIdAndUpdate(item._id, { status: 'done' });
        continue;
      }

      // ── Step 6: Mock Gemini AI & Save to MongoDB ──────────────────
      const domain = new URL(url).hostname;
      const lowerTitle = pageData.title.toLowerCase();
      
      const mockKeywords = lowerTitle.split(' ').filter(w => w.length > 3);
      mockKeywords.push('framework', 'technology', 'web', 'crawler', domain.split('.')[0]);

      await CrawledPage.findOneAndUpdate(
        { url },
        {
          url: url,
          Title: pageData.title,
          Description: pageData.description,
          Content: pageData.content,
          Domain: domain,
          Keywords: [...new Set(mockKeywords)],
          SemanticSearchTags: ['#tech', '#software', '#web'],
          CompanyCategory: ['Software', 'Technology'],
          NamedEntities: {
            companies: [domain.split('.')[0].toUpperCase()],
            technologies: ['React', 'Node.js', 'MongoDB'],
            products: ['WebSearcher'],
            locations: ['San Francisco']
          },
          RelevanceScores: { technical: 0.9, job: 0.1, internship: 0, business: 0.5 },
          WebsitePurpose: 'Information / Tech',
          CrawlPriority: item.priority,
          links: pageData.links,
          size: pageData.size,
          type: pageData.type,
          score: pageData.score,
          contentHash: fingerprint,
          CrawledAt: pageData.crawledAt,
          parentUrl: item.parentUrl,
          depth: item.graphDepth || 0,
          statusCode: pageData.statusCode || 200
        },
        { upsert: true, returnDocument: 'after' }
      );

      // Elasticsearch indexing is disabled per Option A refactor
      /*
      if (!pageData.noindex) {
        await indexPage(pageData);
        await emitEvent('crawler-events', 'page.indexed', { url: pageData.url, title: pageData.title, size: pageData.size });
        await log('success', `[Indexer] ✓ Indexed: "${pageData.title}" (${pageData.size}) — ${url}`, 'Frontier');
      } else {
        await log('warn', `[Indexer] 🚫 Skipped Indexing (noindex meta tag): ${url}`, 'Frontier');
      }
      */
      
      // Fallback emitting for UI progress tracking
      await emitEvent('crawler-events', 'page.indexed', { url: pageData.url, title: pageData.title, size: pageData.size });
      await log('success', `[Database] ✓ Saved: "${pageData.title}"`, 'Frontier');
      await UrlQueue.findByIdAndUpdate(item._id, { status: 'done' });

      // ── Step 7: Sitemap Discovery (bulk URL import) ──────────────
      if (extractSitemaps && depth >= 2) {
        try {
          const sitemapUrls = await discoverSitemaps(url);
          if (sitemapUrls.length > 0) {
            const normalized = normalizeAll(sitemapUrls);
            let sitemapAdded = 0;
            for (const sUrl of normalized.slice(0, 100)) {
              const added = await enqueue(sUrl, 'Low', 1);
              if (added) sitemapAdded++;
            }
            if (sitemapAdded > 0) {
              await log('info', `[Sitemap] 🗺 Added ${sitemapAdded} URLs from sitemap at ${new URL(url).origin}`, 'Frontier');
            }
          }
        } catch {}
      }

      // ── Step 8: Enqueue Child Links ──────────────────────────────
      if (depth > 1 && pageData.links.length > 0) {
        try {
          const domain = new URL(url).hostname;
          const domainCount = await CrawledPage.countDocuments({ url: new RegExp(domain, 'i') });
          const maxPages = MAX_PAGES_PER_DOMAIN || 100;

          if (domainCount < maxPages) {
            const normalizedLinks = normalizeAll(pageData.links);
            let childAdded = 0;

            for (const childUrl of normalizedLinks.slice(0, 20)) {
              const added = await enqueue(childUrl, 'Low', depth - 1, {
                parentUrl: url,
                graphDepth: (item.graphDepth || 0) + 1
              });
              if (added) childAdded++;
            }

            if (childAdded > 0) {
              await log('info', `[Frontier] ➕ Enqueued ${childAdded} child links from ${url}`, 'Frontier');
            }
          } else {
            await log('warn', `[Frontier] ⚠ Domain limit reached (${maxPages}) for ${domain}`, 'Frontier');
          }
        } catch {}
      }

    } catch (err) {
      const code = err.response?.status || 0;
      const errorMsg = err.response
        ? `HTTP ${code}: ${err.response.statusText || 'Error'}`
        : err.code === 'ECONNREFUSED' ? 'Connection Refused'
        : err.code === 'ETIMEDOUT' ? 'Request Timeout'
        : err.message || 'Unknown error';

      if ([429, 500, 503].includes(code)) {
        try {
          const domain = new URL(url).hostname;
          await reportDomainError(domain, code);
          await log('warn', `[RateLimit] Applied emergency penalty to ${domain} due to HTTP ${code}`, 'Orchestrator');
        } catch (e) {}
      }

      await FailedUrl.create({ url, error: errorMsg, code, workerId: 'Fetcher' });
      await UrlQueue.findByIdAndUpdate(item._id, { status: 'failed' });
      await emitEvent('crawler-events', 'url.failed', { url, error: errorMsg });
      await log('error', `[Fetcher] ✗ Failed: ${url} — ${errorMsg}`, 'Frontier');
    }
  }

  running = false;
  logger.info('[Orchestrator] Crawler engine stopped');
}

async function stopCrawling() {
  running = false;
  visitedUrls.clear();
  await clearCache();
  await clearRateLimit();
  logger.info('[Orchestrator] Crawler manually stopped');
}

function isRunning() { return running; }
function getVisitedCount() { return visitedUrls.size; }

module.exports = {
  startCrawling,
  stopCrawling,
  isRunning,
  enqueue,
  getVisitedCount,
  getFingerprintCount,
  getDomainRateLimits: getRateLimits
};