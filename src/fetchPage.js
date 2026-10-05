'use strict';

const fs = require('fs');
const path = require('path');
const { USER_AGENT, TIMEOUT_MS, DELAY_MS, CACHE_DIR } = require('./config');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Turns a URL into a safe, stable cache file name.
function cacheFileFor(url) {
  const safe = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+$/, '');
  return path.join(CACHE_DIR, `${safe}.html`);
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches one page, politely.
 * - Reads from cache if we already have it (no network call, no delay).
 * - Otherwise: sends an honest user-agent, applies a timeout, checks the
 *   status code, retries once on timeout/5xx, never retries 404/403, and
 *   waits DELAY_MS after any real request.
 *
 * Returns { html, status, fromCache, attempts } or throws a FetchError
 * with a `.status` (or 'timeout'/'network') on permanent failure.
 */
async function fetchPage(url) {
  const cacheFile = cacheFileFor(url);

  if (fs.existsSync(cacheFile)) {
    const html = fs.readFileSync(cacheFile, 'utf8');
    console.log(`CACHE HIT  ${url}  (${html.length} bytes)`);
    return { html, status: 200, fromCache: true, attempts: 0 };
  }

  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      await sleep(DELAY_MS); // politeness delay applies to every real request

      if (res.status === 404 || res.status === 403) {
        // Asking again will not help: the page is gone, or we were told no.
        const err = new Error(`HTTP ${res.status} for ${url}`);
        err.status = res.status;
        err.retryable = false;
        throw err;
      }

      if (res.status !== 200) {
        // 5xx and other odd statuses: worth one retry.
        const err = new Error(`HTTP ${res.status} for ${url}`);
        err.status = res.status;
        err.retryable = true;
        throw err;
      }

      const html = await res.text();
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, html, 'utf8');
      console.log(`FETCH      ${url}  (${html.length} bytes, attempt ${attempt})`);
      return { html, status: 200, fromCache: false, attempts: attempt };
    } catch (err) {
      lastErr = err;
      if (err.name === 'AbortError') {
        lastErr = Object.assign(new Error(`Timeout for ${url}`), { status: 'timeout', retryable: true });
      }
      if (lastErr.retryable === false || attempt === 2) break;
      console.log(`RETRY      ${url}  (attempt ${attempt} failed: ${lastErr.status || lastErr.message})`);
    }
  }
  throw lastErr;
}

module.exports = { fetchPage, cacheFileFor };
