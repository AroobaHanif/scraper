'use strict';

// "£51.77" -> 51.77. Returns null (never throws) if it truly cannot parse,
// so validation can catch it instead of the whole run crashing.
function parsePriceGbp(priceText) {
  if (!priceText) return null;
  const match = String(priceText).replace(/,/g, '').match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : null;
}

function normalizeRecord(raw) {
  return {
    ...raw,
    price_gbp: parsePriceGbp(raw.price_text),
    // product_url is already absolute (built in catalogue.js); it doubles
    // as this record's canonical identity, so duplicates can be detected.
  };
}

module.exports = { normalizeRecord, parsePriceGbp };
