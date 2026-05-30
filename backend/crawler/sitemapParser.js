/**
 * sitemapParser.js
 * Fetches and parses XML sitemaps to bulk-discover URLs.
 * Supports sitemap index files (recursive) and URL sets.
 */

const axios = require('axios');
const xml2js = require('xml2js');
const logger = require('../utils/logger');

const parser = new xml2js.Parser({ explicitArray: false });

/**
 * Parse XML string to JS object
 */
async function parseXml(xml) {
  return parser.parseStringPromise(xml);
}

/**
 * Fetch and parse a single sitemap URL.
 * Returns a flat array of page URLs found.
 */
async function fetchSitemap(sitemapUrl, depth = 1) {
  if (depth > 3) return []; // prevent infinite recursion

  try {
    const response = await axios.get(sitemapUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'CrawlXBot/1.0 (+https://crawlx.io/bot)',
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    const parsed = await parseXml(response.data);
    const urls = [];

    // Sitemap Index — contains links to more sitemaps
    if (parsed.sitemapindex) {
      const sitemaps = parsed.sitemapindex.sitemap;
      const sitemapList = Array.isArray(sitemaps) ? sitemaps : [sitemaps];
      logger.info(`[Sitemap] Found sitemap index with ${sitemapList.length} child sitemaps`);

      for (const sm of sitemapList.slice(0, 10)) { // limit to 10 child sitemaps
        const loc = sm?.loc;
        if (loc) {
          const childUrls = await fetchSitemap(loc, depth + 1);
          urls.push(...childUrls);
        }
      }
    }
    // URL Set — contains actual page URLs
    else if (parsed.urlset) {
      const urlEntries = parsed.urlset.url;
      const urlList = Array.isArray(urlEntries) ? urlEntries : [urlEntries];
      logger.info(`[Sitemap] Found ${urlList.length} URLs in sitemap`);

      for (const entry of urlList) {
        const loc = entry?.loc;
        if (loc && typeof loc === 'string') {
          urls.push(loc.trim());
        }
      }
    }

    return urls;
  } catch (err) {
    logger.error(`[Sitemap] Failed to parse ${sitemapUrl}: ${err.message}`);
    return [];
  }
}

/**
 * Try to discover sitemap from a domain's robots.txt or common paths.
 * Returns discovered URLs ready for the queue.
 */
async function discoverSitemaps(baseUrl) {
  const discovered = [];

  const commonPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/sitemaps/sitemap.xml'
  ];

  const parsed = new URL(baseUrl);
  const origin = `${parsed.protocol}//${parsed.hostname}`;

  for (const path of commonPaths) {
    const sitemapUrl = origin + path;
    try {
      const urls = await fetchSitemap(sitemapUrl);
      if (urls.length > 0) {
        logger.info(`[Sitemap] Discovered ${urls.length} URLs from ${sitemapUrl}`);
        discovered.push(...urls);
        break; // Stop after first successful sitemap
      }
    } catch {
      // Try next path
    }
  }

  return discovered;
}

module.exports = { fetchSitemap, discoverSitemaps };
