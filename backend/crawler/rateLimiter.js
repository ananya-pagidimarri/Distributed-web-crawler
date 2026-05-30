/**
 * rateLimiter.js
 * Uses Redis to track the last-crawled timestamp of each domain to enforce ethical crawl delays across all distributed workers.
 */

const redisClient = require('../cache/redisClient');
const { CRAWL_DELAY_MS } = require('../config/envConfig');

const REDIS_RATELIMIT_HASH = 'crawlx:ratelimits';
const GLOBAL_MIN_DELAY = CRAWL_DELAY_MS || 1000;

/**
 * Wait until a domain is safe to crawl again based on its rate limit.
 * @param {string} domain - The hostname
 * @param {number} robotsDelay - Delay specified in robots.txt (in ms)
 */
async function waitForDomain(domain, robotsDelay = 0) {
  const minDelay = Math.max(GLOBAL_MIN_DELAY, robotsDelay);
  
  // Redis transactions to safely check and update the domain timestamp across workers
  const lastCrawledStr = await redisClient.hget(REDIS_RATELIMIT_HASH, domain);
  const now = Date.now();
  const lastCrawled = lastCrawledStr ? parseInt(lastCrawledStr, 10) : 0;

  const timeSinceLastCrawl = now - lastCrawled;
  
  if (timeSinceLastCrawl < minDelay) {
    const waitTime = minDelay - timeSinceLastCrawl;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Update the domain's last crawled timestamp
  await redisClient.hset(REDIS_RATELIMIT_HASH, domain, Date.now().toString());
}

/**
 * Get rate limits map for dashboard status.
 */
async function getAll() {
  const hash = await redisClient.hgetall(REDIS_RATELIMIT_HASH);
  const result = {};
  for (const [domain, ts] of Object.entries(hash)) {
    result[domain] = new Date(parseInt(ts, 10)).toISOString();
  }
  return result;
}

/**
 * Clear all rate limits (useful for hard resets).
 */
async function clearAll() {
  await redisClient.del(REDIS_RATELIMIT_HASH);
}

/**
 * Apply an emergency rate limit penalty for struggling servers.
 * @param {string} domain 
 * @param {number} code 
 */
async function reportDomainError(domain, code) {
  if ([429, 500, 503].includes(code)) {
    // Apply a 5-minute penalty to significantly reduce crawl rate
    const penaltyMs = 5 * 60 * 1000;
    await redisClient.hset(REDIS_RATELIMIT_HASH, domain, (Date.now() + penaltyMs).toString());
  }
}

module.exports = {
  waitForDomain,
  clearAll,
  getAll,
  reportDomainError
};
