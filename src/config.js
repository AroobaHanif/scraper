'use strict';

module.exports = {
  BASE_URL: 'https://books.toscrape.com',
  CATALOGUE_PAGES: 3, // scope: first 3 catalogue pages only, per Stage 0
  USER_AGENT: 'FlyRankInternshipA9/1.0 (+https://github.com/AroobaHanif/scraper)',
  TIMEOUT_MS: 8000,
  DELAY_MS: 600, // >= 500ms between real requests, per Stage 2
  CACHE_DIR: require('path').join(__dirname, '..', 'cache'),
  OUTPUT_DIR: require('path').join(__dirname, '..', 'output'),
};
