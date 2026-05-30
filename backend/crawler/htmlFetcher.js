/**
 * htmlFetcher.js
 * Professional page fetching with:
 * - Axios with proper headers and timeout
 * - Retry logic (3 attempts with exponential backoff)
 * - Cheerio HTML parsing
 * - Title, description, links, content extraction
 */

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { FETCH_TIMEOUT_MS } = require('../config/envConfig');

let browserInstance = null;
async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browserInstance;
}

const USER_AGENT = 'CrawlXBot/1.0 (+https://crawlx.io/bot; like Googlebot)';
const MAX_RETRIES = 3;

/**
 * Helper: sleep for ms milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper: estimate content size
 */
function getSize(content) {
  const bytes = Buffer.byteLength(content || '', 'utf8');
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Helper: detect content type from URL and response
 */
function detectType(url, contentType = '') {
  if (url.endsWith('.pdf') || contentType.includes('pdf')) return 'PDF';
  if (url.endsWith('.txt') || contentType.includes('plain')) return 'Text';
  return 'HTML';
}

/**
 * Helper: normalize a relative URL to absolute
 */
function resolveUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

/**
 * Main fetch function — fetches and parses a URL.
 * Returns structured data ready for MongoDB.
 */
async function fetchPage(url) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: FETCH_TIMEOUT_MS || 15000
      });
      
      const statusCode = response ? response.status() : 500;
      const html = await page.content();
      const contentType = response ? response.headers()['content-type'] || '' : '';
      await page.close();
      const $ = cheerio.load(html);

      // ── Robots Meta Tags ──────────────────────────────
      const robotsMeta = ($('meta[name="robots"]').attr('content') || $('meta[name="googlebot"]').attr('content') || '').toLowerCase();
      const noindex = robotsMeta.includes('noindex');
      const nofollow = robotsMeta.includes('nofollow');
      const nosnippet = robotsMeta.includes('nosnippet');

      // ── Title ─────────────────────────────────────────
      const title = $('title').text().trim() ||
        $('h1').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        new URL(url).pathname.split('/').pop() ||
        'Untitled';

      // ── Description / Snippet ─────────────────────────
      let description = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') || '';

      // Fallback: first meaningful paragraph
      if (!description.trim()) {
        $('p').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 80) {
            description = text;
            return false; // break
          }
        });
      }
      description = description.trim().substring(0, 500);

      // Honor nosnippet
      if (nosnippet) {
        description = '';
      }

      // ── Extract all links ──────────────────────────────
      const rawLinks = [];
      if (!nofollow) {
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          const resolved = resolveUrl(href, url);
          if (resolved && (resolved.startsWith('http://') || resolved.startsWith('https://'))) {
            rawLinks.push(resolved);
          }
        });
      }
      const links = [...new Set(rawLinks)].slice(0, 100); // dedup, max 100

      // ── Extract text content ───────────────────────────
      $('script, style, nav, footer, header, aside, noscript').remove();
      const content = $('body').text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000);

      // ── Keywords from headings ─────────────────────────
      const headings = [];
      $('h1, h2, h3').each((_, el) => {
        const text = $(el).text().trim();
        if (text) headings.push(text);
      });

      // ── Relevance score (simple heuristic) ────────────
      const score = Math.min(
        0.5 +
        (description.length > 100 ? 0.2 : 0) +
        (headings.length > 3 ? 0.1 : 0) +
        (links.length > 10 ? 0.1 : 0) +
        (content.length > 1000 ? 0.1 : 0),
        1.0
      );

      if (attempt > 1) {
        logger.info(`[Fetcher] Success on retry #${attempt} for ${url}`);
      }

      return {
        url,
        title: title.substring(0, 200),
        description,
        content,
        headings,
        links,
        size: getSize(content),
        type: detectType(url, contentType),
        score,
        crawledAt: new Date(),
        statusCode
      };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        const delay = attempt * 1000; // 1s, 2s backoff
        logger.info(`[Fetcher] Attempt ${attempt} failed for ${url}. Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

module.exports = { fetchPage };