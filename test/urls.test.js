'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// Exercises the exact pattern used in src/catalogue.js: new URL(href, pageUrl)
test('relative book link resolves to an absolute URL', () => {
  const pageUrl = 'https://books.toscrape.com/catalogue/page-1.html';
  const href = 'a-light-in-the-attic_1000/index.html';
  const absolute = new URL(href, pageUrl).toString();
  assert.equal(absolute, 'https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html');
});

test('relative "next" link resolves from a deeper catalogue page', () => {
  const pageUrl = 'https://books.toscrape.com/catalogue/page-2.html';
  const href = 'page-3.html';
  const absolute = new URL(href, pageUrl).toString();
  assert.equal(absolute, 'https://books.toscrape.com/catalogue/page-3.html');
});
