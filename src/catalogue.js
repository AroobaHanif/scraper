'use strict';

const cheerio = require('cheerio');
const { fetchPage } = require('./fetchPage');
const { BASE_URL, CATALOGUE_PAGES } = require('./config');

/**
 * Walks the catalogue by following the site's own "next" link, starting at
 * page 1, stopping after CATALOGUE_PAGES pages (never hardcoding book URLs).
 * Returns { pageUrls, bookUrls } where bookUrls are unique absolute URLs.
 */
async function discoverCatalogue() {
  const pageUrls = [];
  const bookUrlSet = new Set();

  let pageUrl = `${BASE_URL}/catalogue/page-1.html`;

  for (let i = 0; i < CATALOGUE_PAGES && pageUrl; i++) {
    const { html } = await fetchPage(pageUrl);
    pageUrls.push(pageUrl);
    const $ = cheerio.load(html);

    $('article.product_pod h3 a').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const absolute = new URL(href, pageUrl).toString(); // never string-glue URLs
      bookUrlSet.add(absolute);
    });

    const nextHref = $('li.next a').attr('href');
    pageUrl = nextHref ? new URL(nextHref, pageUrl).toString() : null;
  }

  return { pageUrls, bookUrls: Array.from(bookUrlSet) };
}

module.exports = { discoverCatalogue };
