'use strict';

const fs = require('fs');
const path = require('path');
const { discoverCatalogue } = require('./catalogue');
const { fetchPage } = require('./fetchPage');
const { extractBook } = require('./extractBook');
const { normalizeRecord } = require('./normalize');
const { BookRecord } = require('./schema');
const { OUTPUT_DIR } = require('./config');

// Set FAKE_BOOK_URL=1 to append one made-up URL on purpose, per Stage 5's
// checkpoint: the run must still finish and still produce the 60 good
// records, with run-report.json showing failed_pages: 1.
const INJECT_FAKE_URL = process.env.FAKE_BOOK_URL === '1';

async function main() {
  const start = new Date();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('Stage 1-2: discovering catalogue pages...');
  const { pageUrls, bookUrls } = await discoverCatalogue();
  console.log(`catalogue_pages=${pageUrls.length} discovered=${bookUrls.length} unique_urls=${bookUrls.length}`);

  const urlsToVisit = INJECT_FAKE_URL
    ? [...bookUrls, 'https://books.toscrape.com/catalogue/this-book-does-not-exist_0/index.html']
    : bookUrls;

  console.log('Stage 3-4: visiting book pages, extracting, normalizing, validating...');
  const valid = [];
  const invalid = [];
  let failedPages = 0;
  let cacheHits = 0;
  let fetchedPages = 0;

  for (const bookUrl of urlsToVisit) {
    // Stage 5: one bad page must not kill the run. Each page is handled
    // independently and failures are logged, not thrown.
    let page;
    try {
      page = await fetchPage(bookUrl);
    } catch (err) {
      failedPages++;
      invalid.push({ url: bookUrl, reason: `fetch failed: ${err.status || err.message}` });
      console.log(`FAILED     ${bookUrl}  (${err.status || err.message})`);
      continue;
    }
    if (page.fromCache) cacheHits++; else fetchedPages++;

    let raw, normalized;
    try {
      raw = extractBook(page.html, { bookUrl, sourcePage: bookUrl });
      normalized = normalizeRecord(raw);
    } catch (err) {
      invalid.push({ url: bookUrl, reason: `extraction failed: ${err.message}` });
      continue;
    }

    const result = BookRecord.safeParse(normalized);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({ url: bookUrl, reason: result.error.issues.map((i) => i.message).join('; ') });
    }
  }

  // Idempotency: de-duplicate by canonical product_url, so a rerun (or a
  // record reached twice) never produces more than one entry per book.
  const byUrl = new Map();
  for (const rec of valid) byUrl.set(rec.product_url, rec);
  const uniqueValid = Array.from(byUrl.values());

  fs.writeFileSync(path.join(OUTPUT_DIR, 'books.json'), JSON.stringify(uniqueValid, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.json'), JSON.stringify(invalid, null, 2));

  const end = new Date();
  const report = {
    started_at: start.toISOString(),
    finished_at: end.toISOString(),
    duration_ms: end - start,
    catalogue_pages_fetched: pageUrls.length,
    book_pages_discovered: bookUrls.length,
    book_pages_visited: urlsToVisit.length,
    cache_hits: cacheHits,
    fresh_fetches: fetchedPages,
    valid_records: uniqueValid.length,
    invalid_records: invalid.length,
    failed_pages: failedPages,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'run-report.json'), JSON.stringify(report, null, 2));

  console.log('\n--- run report ---');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error('Run failed to start:', err);
  process.exit(1);
});
