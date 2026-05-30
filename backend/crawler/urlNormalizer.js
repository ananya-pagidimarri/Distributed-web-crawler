/**
 * urlNormalizer.js
 * Normalizes URLs before enqueueing to prevent duplicates like:
 *   /page  vs  /page/  vs  /page?ref=abc  vs  /page#section
 *
 * Uses Node.js built-in URL class (CommonJS compatible).
 */

// Tracking/analytics query params to remove
const REMOVE_PARAMS = new Set([
  'ref', 'source', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_content', 'utm_term', 'fbclid', 'gclid', 'mc_cid',
  'mc_eid', 'si', 'uselang', 'action', 'oldid', 'from'
]);

// File extensions that are not useful to index
const SKIP_EXTENSIONS = /\.(css|js|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|mp4|mp3|zip|tar|gz|rar|exe|dmg)$/i;

/**
 * Normalize a URL to canonical form.
 * Returns null if the URL is invalid or should be excluded.
 */
function normalize(url) {
  if (!url || typeof url !== 'string') return null;
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;

  try {
    const parsed = new URL(url);

    // Remove fragment (#section) — same page content
    parsed.hash = '';

    // Remove tracking query params
    for (const key of [...parsed.searchParams.keys()]) {
      if (REMOVE_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }

    // Sort remaining params → ?a=1&b=2 equals ?b=2&a=1
    parsed.searchParams.sort();

    let normalized = parsed.toString();

    // Remove trailing slash (except root domain)
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1);
    }

    // Skip binary/media file extensions
    if (SKIP_EXTENSIONS.test(parsed.pathname)) return null;

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Normalize an array of URLs, removing nulls and duplicates.
 */
function normalizeAll(urls) {
  const seen = new Set();
  const result = [];
  for (const url of urls) {
    const n = normalize(url);
    if (n && !seen.has(n)) {
      seen.add(n);
      result.push(n);
    }
  }
  return result;
}

module.exports = { normalize, normalizeAll };
