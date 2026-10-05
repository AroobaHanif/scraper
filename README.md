# The polite scraper (A9)

A small Node.js pipeline that downloads the first 3 catalogue pages of
[Books to Scrape](https://books.toscrape.com), visits all 60 book pages,
and turns the messy HTML into clean, schema-checked JSON — politely, and
without crashing on a broken page.

## Target classification (Stage 0)

- **Site:** `books.toscrape.com`. Its own homepage states it directly: "We
  love being scraped!" — it is a public sandbox built for people to
  practise scraping on. This is the only kind of site this project
  touches.
- **Scope:** the first 3 catalogue pages only (60 books), not the full
  1000-book catalogue.
- **robots.txt:** `https://books.toscrape.com/robots.txt` returns **404**.
  No robots file found. A missing file is not permission on its own — the
  permission here is the sandbox's own "We love being scraped!" statement
  plus its "About" page, which explains the site exists for this purpose.
- I will not reuse this code on another site without checking its rules
  and terms first.

## How to run it

Requires Node.js 20+.

```bash
npm install
npm start
```

This fetches the 3 catalogue pages, discovers the book links, visits all
60 book pages, and writes:

- `output/books.json` — the 60 validated records
- `output/errors.json` — any record that failed validation, with the reason
- `output/run-report.json` — counts, cache hits, failures, duration

Run it a second time and it reads from `cache/` instead of the network
(you'll see `CACHE HIT` instead of `FETCH` in the log), and `books.json`
still holds exactly 60 records, not 120.

**Test the failure path on purpose:**

```bash
FAKE_BOOK_URL=1 npm start
```

This appends one made-up book URL to the list before fetching. The run
should still finish, `books.json` should still have the 60 good records,
and `run-report.json` should show `failed_pages: 1`.

**Unit tests (no network needed):**

```bash
npm test
```

9 tests covering price normalization, relative-to-absolute URL resolution,
a missing description, duplicate-link de-duplication, and a malformed
record failing schema validation — run against fixture HTML in
`fixtures/` that matches the live site's real markup and data.

## Record schema

Each raw record has 8 fields (`title`, `product_url`, `price_text`,
`availability_text`, `rating_text`, `description`, `source_page`,
`fetched_at`). Normalizing adds `price_gbp`, a real number parsed from
`price_text`. `product_url` is the record's canonical identity. The full
shape is defined once in `src/schema.js` with Zod and checked before
anything is stored; records that fail go to `errors.json` with a reason
instead of into `books.json`.

## Politeness rules

- **User-agent:** every request identifies itself as
  `FlyRankInternshipA9/1.0 (+https://github.com/AroobaHanif/scraper)`.
- **Timeout:** 8 seconds per request; it gives up rather than hanging.
- **Delay:** at least 600ms between real requests. Cache hits add no
  delay, since they never leave the computer.
- **Status handling:** only `200` is treated as a real page. `404` and
  `403` are never retried (the page is gone, or the site said no).
  Timeouts and `5xx` get one retry.
- **Cache-first:** every page is saved to `cache/` on first fetch and read
  from there afterward, so re-running the script during development sends
  no repeat traffic to the site.

## Honest limitation

This was built and unit-tested in a sandboxed environment whose network
is restricted to an explicit allowlist of domains (package registries,
GitHub, etc.); `books.toscrape.com` is not on it, and a direct request
from that environment returns a `403` from the sandbox's own egress proxy
(`x-deny-reason: host_not_allowed`), not from the real site. So the
pipeline itself has not been run end-to-end against the live site from
where it was built. What **has** been verified: the real site's HTML
structure and data were fetched and read directly (page 1 of the
catalogue and the "A Light in the Attic" detail page), the selectors and
record values in `fixtures/` are copied from that real, confirmed output,
and all 9 unit tests pass against those fixtures. Running `npm start` on
a normal internet connection is the remaining step, and should need no
code changes.

<!-- Paste your real run-report.json here after running it. -->

## Why this needed no browser

The data (title, price, availability, description, rating) is already
present in the HTML the server sends back — `curl`-ing a book page and
reading the response shows all of it with no JavaScript execution needed.
A headless browser would only add startup cost and memory for no benefit
here.

## Ethics note

Use an official API when one exists instead of scraping. Never bypass a
login, a paywall, or a block — a `403` means stop, not retry harder.
Collect only the fields actually needed for the task, and keep source and
fetch time on every record so a wrong value can be traced back to where
it came from.
