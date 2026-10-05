'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cheerio = require('cheerio');
const { extractBook } = require('../src/extractBook');
const { normalizeRecord } = require('../src/normalize');
const { BookRecord } = require('../src/schema');

const fixturesDir = path.join(__dirname, '..', 'fixtures');

test('duplicate book links on a catalogue page collapse to unique URLs', () => {
  const html = fs.readFileSync(path.join(fixturesDir, 'list-page-snippet.html'), 'utf8');
  const $ = cheerio.load(html);
  const pageUrl = 'https://books.toscrape.com/catalogue/page-1.html';
  const set = new Set();
  $('article.product_pod h3 a').each((_, el) => {
    const href = $(el).attr('href');
    set.add(new URL(href, pageUrl).toString());
  });
  // fixture has 3 <article> entries but only 2 distinct hrefs
  assert.equal(set.size, 2);
});

test('a record with an unparseable price fails schema validation', () => {
  const html = fs.readFileSync(path.join(fixturesDir, 'detail-page-malformed.html'), 'utf8');
  const raw = extractBook(html, {
    bookUrl: 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
    sourcePage: 'https://books.toscrape.com/catalogue/page-1.html',
  });
  const normalized = normalizeRecord(raw);
  const result = BookRecord.safeParse(normalized);
  assert.equal(result.success, false);
});
