'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { extractBook } = require('../src/extractBook');

const fixturesDir = path.join(__dirname, '..', 'fixtures');

test('extracts all 8 raw fields from a real detail page', () => {
  const html = fs.readFileSync(path.join(fixturesDir, 'detail-page.html'), 'utf8');
  const rec = extractBook(html, {
    bookUrl: 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html',
    sourcePage: 'https://books.toscrape.com/catalogue/page-1.html',
  });
  assert.equal(rec.title, 'A Light in the Attic');
  assert.equal(rec.price_text, '£51.77');
  assert.match(rec.availability_text, /In stock \(22 available\)/);
  assert.equal(rec.rating_text, 'Three');
  assert.ok(rec.description && rec.description.length > 0);
  assert.equal(Object.keys(rec).length, 8);
});

test('stores null, not invented text, when a book has no description', () => {
  const html = fs.readFileSync(path.join(fixturesDir, 'detail-page-no-description.html'), 'utf8');
  const rec = extractBook(html, {
    bookUrl: 'https://books.toscrape.com/catalogue/example/index.html',
    sourcePage: 'https://books.toscrape.com/catalogue/page-1.html',
  });
  assert.equal(rec.description, null);
});
