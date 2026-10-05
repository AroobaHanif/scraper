'use strict';

const cheerio = require('cheerio');

// Extracts the 8 raw fields from one book detail page. Selectors are scoped
// to the product area (.product_main, #product_description, the info
// table), not "first thing that looks like a price" on the whole document.
function extractBook(html, { bookUrl, sourcePage }) {
  const $ = cheerio.load(html);
  const main = $('.product_main');

  const title = main.find('h1').text().trim();
  const price_text = main.find('.price_color').first().text().trim();
  const availability_text = main.find('.availability').text().replace(/\s+/g, ' ').trim();

  const ratingClass = (main.find('.star-rating').attr('class') || '')
    .split(/\s+/)
    .find((c) => c !== 'star-rating');
  const rating_text = ratingClass || null;

  // Description: the paragraph right after #product_description. Some
  // books genuinely have none -> store null, never invent text.
  const descEl = $('#product_description').next('p');
  const description = descEl.length ? descEl.text().trim() : null;

  return {
    title,
    product_url: bookUrl,
    price_text,
    availability_text,
    rating_text,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

module.exports = { extractBook };
