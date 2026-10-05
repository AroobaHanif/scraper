'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parsePriceGbp } = require('../src/normalize');

test('parses a normal price', () => {
  assert.equal(parsePriceGbp('£51.77'), 51.77);
});

test('parses a price with no decimals', () => {
  assert.equal(parsePriceGbp('£22'), 22);
});

test('returns null instead of throwing on garbage input', () => {
  assert.equal(parsePriceGbp('ask in store'), null);
  assert.equal(parsePriceGbp(''), null);
  assert.equal(parsePriceGbp(null), null);
});
