/**
 * contentFingerprint.js
 * Generates SHA-256 hashes for deduplication and uses Redis for globally distributed caching.
 */

const crypto = require('crypto');
const redisClient = require('../cache/redisClient');
const cheerio = require('cheerio');

const REDIS_FINGERPRINT_SET = 'crawlx:fingerprints';

/**
 * Normalizes text and generates a SHA-256 hash.
 */
function generateFingerprint(html) {
  if (!html) return null;

  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, nav, footer, header').remove();
  let text = $('body').text() || '';

  text = text.replace(/\s+/g, ' ')
             .replace(/[^\w\s]|_/g, '')
             .toLowerCase()
             .trim();

  if (text.length < 50) return null; // Too little content to fingerprint meaningfully

  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Check if a fingerprint exists in the Redis cache.
 * If not, adds it automatically (atomic check-and-set).
 * @returns {boolean} true if duplicate, false if new.
 */
async function isDuplicate(fingerprint) {
  if (!fingerprint) return false;
  const added = await redisClient.sadd(REDIS_FINGERPRINT_SET, fingerprint);
  console.log(`[DEBUG] isDuplicate fingerprint=${fingerprint} added=${added}`);
  return added === 0;
}

/**
 * Get total unique fingerprints stored in Redis.
 */
async function getFingerprintCount() {
  return await redisClient.scard(REDIS_FINGERPRINT_SET);
}

/**
 * Clear the entire fingerprint cache (useful for hard resets).
 */
async function clearCache() {
  await redisClient.del(REDIS_FINGERPRINT_SET);
}

module.exports = {
  generateFingerprint,
  isDuplicate,
  clearCache,
  getFingerprintCount
};
