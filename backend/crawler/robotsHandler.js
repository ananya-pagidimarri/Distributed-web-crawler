/**
 * robotsHandler.js
 * Checks robots.txt rules before crawling any URL.
 * Respects Crawl-Delay and User-Agent directives.
 */

const axios = require('axios');
const robotsParser = require('robots-parser');
const logger = require('../utils/logger');
const RobotsTxt = require('../models/RobotsTxtModel');

// Cache robots.txt per domain — avoid re-fetching repeatedly
const robotsCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const BOT_NAME = 'CrawlXBot';

async function getRobots(domain) {
  const cached = robotsCache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.robots;
  }

  const robotsUrl = `${domain}/robots.txt`;
  try {
    const response = await axios.get(robotsUrl, {
      timeout: 5000,
      headers: { 'User-Agent': `${BOT_NAME}/1.0` }
    });
    const robots = robotsParser(robotsUrl, response.data);
    robotsCache.set(domain, { robots, fetchedAt: Date.now() });
    
    try {
      const crawlDelay = robots.getCrawlDelay(BOT_NAME) || 0;
      await RobotsTxt.findOneAndUpdate(
        { domain },
        { rawText: response.data, crawlDelay, fetchedAt: new Date() },
        { upsert: true }
      );
    } catch (dbErr) {
      logger.error(`Failed to save robots.txt to DB for ${domain}`);
    }

    logger.info(`[Robots] Fetched robots.txt for ${domain}`);
    return robots;
  } catch {
    // If robots.txt doesn't exist or fails, allow all
    const robots = robotsParser(robotsUrl, '');
    robotsCache.set(domain, { robots, fetchedAt: Date.now() });

    try {
      await RobotsTxt.findOneAndUpdate(
        { domain },
        { rawText: '', crawlDelay: 0, fetchedAt: new Date() },
        { upsert: true }
      );
    } catch (dbErr) {}

    return robots;
  }
}

/**
 * Check if a URL is allowed to be crawled.
 * @returns {{ allowed: boolean, crawlDelay: number }}
 */
async function checkRobots(url, bypassRobots = false) {
  if (bypassRobots) return { allowed: true, crawlDelay: 0 };

  try {
    const parsed = new URL(url);
    const domain = `${parsed.protocol}//${parsed.hostname}`;
    const robots = await getRobots(domain);

    const allowed = robots.isAllowed(url, BOT_NAME) !== false;
    const crawlDelay = (robots.getCrawlDelay(BOT_NAME) || 0) * 1000; // convert to ms

    return { allowed, crawlDelay };
  } catch {
    return { allowed: true, crawlDelay: 0 };
  }
}

module.exports = { checkRobots };
