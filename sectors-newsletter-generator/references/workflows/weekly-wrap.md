# Weekly wrap, workflow

Intended send: Saturday morning. Covers the trading week that just closed (Mon-Fri).
Read `../newsletter-format.md`'s weekly-wrap skeleton and `../compliance.md` before
drafting.

## 1. Settle the window

The API's "today" lags ~1 day (UTC), so anchor to whatever `data_as_of` you actually get
back, not the calendar date. Use the most recently completed Mon-Fri window.

## 2. Fetch (batch these into as few `sectors.mjs --save-dir` calls as possible)

Call the fetch helper by relative path — it self-locates its config and
key, no setup needed:

```bash
node ../../scripts/sectors.mjs \
  "idx-total/?start=<mon>&end=<fri>" \
  "index-daily/lq45/?start=<mon>&end=<fri>" \
  "index-daily/idx30/?start=<mon>&end=<fri>" \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=7d" \
  "most-traded/?start=<mon>&end=<fri>&n_stock=3" \
  --save-dir <scratch-dir>
```

- `idx-total` — whole-market cap trend for the week.
- `index-daily/{code}` — path is the index **code** (`lq45`, `idx30`, `kompas100`, ...),
  not a symbol. Index moves.
- `companies/top-changes` — the week's standout tickers. Only `top_gainers`/`top_losers`
  are valid classifications; costs 1 credit per classification x period.
  **Gotcha (verified live 2026-07-14): this endpoint ignores `start`/`end` and returns a
  live rolling snapshot pinned to its own `latest_close_date` (today), NOT your Mon-Fri
  window.** So it does not reproduce a past week's gainers/losers. For an issue anchored
  to a closed historical week, either accept the live snapshot and label it as-of its
  returned date, or take the movers straight from the prior issue's own numbers if you're
  revamping one. Do not silently present a live snapshot as the wrapped week's movers.
- `most-traded` — most active names for the week; check whether one symbol tops the
  entire window, not just one day — that's a story in itself. This one **does** honor the
  window (per-date rows). Feeds the "what actually traded" section.

Then, once you've picked which sub-sectors and which ticker to feature for flow, plus the
filings / IPO / news the revamped layout needs (see section order below):

```bash
node ../../scripts/sectors.mjs \
  "subsector/report/<slug>/" \
  "foreign-flow/<TICKER>/?start=<mon>&end=<fri>" \
  "filings/?limit=8" \
  "news/?start=<mon>&end=<fri>&limit=12" \
  --save-dir <scratch-dir>
```

- `subsector/report/{slug}/` — a sub-sector leaderboard in one call: `mcap_change{1w}`,
  `top_companies`, `filtered_median_pe`, `historical_valuation`. Feeds the "sector pulse"
  section. **Gotcha: the trailing slash is load-bearing here.** `subsector/report/banks`
  (no slash) 403s with "Authentication credentials were not provided";
  `subsector/report/banks/` works. Note `mcap_change{1w}` is a live figure as-of the
  report's own date, not your window, so cite valuation/structure ("P/E 10.5x, near a
  5-year low") rather than presenting the 1w number as the wrapped week's move.
- `foreign-flow/{symbol}` — net foreign inflow/day. Mind the **2025-01-02 floor**; a
  window straddling it returns partial data silently, compare the earliest returned date
  to what you asked. `broker-summary/{symbol}/top` is an alternative for a
  "which brokers are accumulating X" angle. The per-day sign is the story: a name that is
  net-sold every session while its price rises is the "who was on the other side" hook.
- `filings/?limit=8` — insider / major-holder disclosures for the **New Filings** table.
  Use the structured fields (`timestamp`, `holder_name`, `symbol`, `transaction_type`,
  `share_percentage_before/after`), never the free-text `body` numbers (unreliable, see
  `../sectors-api/data-quality.md`). Take the 5 most recent by `timestamp`.
- `news/?start&end&limit=12` — recent market headlines for the **Headlines** section.
  Rank by recency and IDX-market relevance, drop off-topic non-IDX items (a US/crypto
  story does not belong in an IDX wrap). **There is no 0-100 relevance/importance score
  field**; the only per-article scoring is the small integer `dimension{}` angle map
  (values like 0-4). If a brief asks to "filter news scoring > 85," say that field does
  not exist in the API and rank by recency + relevance instead of fabricating a score.

Then, for the **New IPOs** section, list this week's fresh listings with real first-day
performance (the recipe that fills what a same-day issue can only preview as blanks):

```bash
# 1. find the week's IPO tickers (from the exchange's new-listing calendar / prior issue),
#    then per ticker, one overview for market cap + a short daily series for the first close
node ../../scripts/sectors.mjs \
  "company/report/<TICKER>/?sections=overview" \
  "daily/<TICKER>/?start=<listing-date>&end=<listing-date+3d>" \
  --save-dir <scratch-dir>
```

- **First-day change** = `daily[0].close / offering_price - 1` (offering price from the
  listing calendar / prior issue). `overview.daily_close_change` is the *latest* single
  day, not the listing-day pop, so compute the first day from the `daily` series.
- **Market cap** = `daily[0].market_cap` (or `overview.market_cap`). Link each ticker to
  `https://sectors.app/idx/<lower>`. `listing-performance/{symbol}/` also exists for
  recent IPOs (`chg_7d/30d/...`, `offering_price`), but older listings 400, and it does
  not carry a clean 1-day field, so the `daily`-series computation above is the reliable
  path.

Optionally, `news/` (by `sector`/`sub_sector`) to source the "why" behind whichever
mover you feature — per `../sourcing.md`, the data proves *what* moved, search/news
finds *why*.

## 2b. Section order & layout (revamped "Sectors Weekly Insights")

The weekly highlights issue is the full scannable digest, in this order (the canonical
skeleton lives in `../newsletter-format.md` → **Weekly wrap**; this is the same list with
the API source per section):

1. **IDX Total Market Cap** headline stat + a 3-up snapshot (7d rolling / 30d / YTD).
   `idx-total` for the level; the three % are the standard rolling reads. Label the 7d
   one "(rolling)" so it doesn't read as contradicting the Mon-Fri figure below.
2. **The week in one line** — the conclusion (`idx-total` + `foreign-flow`).
3. **Index & market** — a two-column WoW table (this week vs prior week) from `idx-total`
   + `index-daily/{lq45,idx30}`; fetch the prior Mon-Fri too for the compare column. One
   optional hero chart of the week's daily `idx-total` path.
4. **Weekly Top Movers** — Top Gainers and Top Losers as two side-by-side cards/tables
   (see the `top-changes` window gotcha above; for a revamp, reuse the prior issue's
   window-accurate movers rather than the live snapshot).
5. **What actually traded** — `most-traded` volume leaders + the featured name's
   `foreign-flow` (domestic-churn vs foreign-inflow read).
6. **Sector pulse** (optional) — `subsector/report/{slug}/` valuation + 1w/ytd cap.
7. **New Filings** — 5 most recent from `filings`, as a table.
8. **New IPOs** — this week's listings with first-day change + market cap, from the
   `daily`/`overview` recipe above, each ticker linked to its report page.
9. **Headlines** — 5 recent `news` items (title + short body + source link).
10. **Upcoming event** — the current Sectors workshop promo, if one is running. Pull the
    details the same way `upcoming-event.md` does (user-supplied: date/time/format,
    speaker, registration link, banner). Reuse the standing event block rather than
    inventing details.
11. **Takeaway** + CTA back to `sectors.app` + sources + disclaimer footer.

## 2c. Delivery: this issue ships as a send-ready HTML email

Weekly highlights is the one type that goes out as **HTML**, not just Markdown. The
two-column gainer/loser cards, colored +/- cells, the CTA button, and the event banner do
not survive plain Markdown, and the whole point of the revamp is that the email is
self-contained and data-backed with **no PDF attachment**. Author `newsletter.html` with
email-safe inline styles and table-based layout (see the worked reference at
`newsletter/newsletter_2026-07-06_weekly-wrap/newsletter.html`):

- Every ticker mention links to `https://sectors.app/idx/<lower>`, in tables and prose,
  same shared ticker-blue (`#9E0142`) as every other issue type, not a type-specific
  color (this doc previously said magenta for links, that was wrong, see the global
  color convention in `../newsletter-format.md`'s **Ticker-mention convention**).
- Gains green (`#568475`), losses red (`#D53E50`); Sectors magenta (`#9E0142`) is
  reserved for the CTA button only, not links or headers; section headers render in a
  dark neutral (`#1c1c1c`); cream card ground `#fdf7ee`. Note `#1c1c1c` is for section
  headers only, never for a link, including the movers-card tickers.
- Every broker code (if a broker/flow table appears) links to
  `https://sectors.app/idx/broker/<lower>`, same ticker-blue styling.
- The event banner can be a self-contained CSS block; swap in the real hosted banner
  image only when a URL is supplied (email can't embed a local file).
- Keep a `newsletter.md` draft alongside for review, ship the `.html` for send. A rendered
  preview can be published privately via the Artifact tool for layout sign-off.

## 3. Validate

- Band-check every mover against `../sectors-api/data-quality.md`'s
  plausibility bands before it goes in a "standout" line — screener/movers output is
  not pre-validated (a `roe=262` or a `-88.5x` P/E is garbage, drop it).
  the `daily/{symbol}` series directly for anything price-derived, don't mix it with
  `overview.all_time_price` summary fields (they can disagree on the same date).
- Confirm the `start`/`end` actually echoed in each response match what you requested —
  ranges silently clamp to 90 days and broker/flow windows silently clamp to the
  2025-01-02 floor.

## 4. Find the angle, then write the payoff first

Not "the market rose 1.8%" — the conclusion is *what drove the week and who was on the
other side of it*: e.g. the index rose but foreigners were net sellers; one sub-sector
carried the tape while the rest lagged; one symbol topped every single trading day.
Every standout number needs a benchmark (its own recent history, a peer, a category
norm) — a number alone is not a finding.

Write the "week in one line" conclusion first, then work back to fill the sections that
prove it (mirrors the carousel skill's "write the payoff slide first").

## 5. Self-review before delivery

- Does the "week in one line" state a conclusion, or just restate a headline number?
- Is every standout paired with a benchmark?
- Did any figure fail a plausibility band and get quietly left in anyway? Re-scan.
- Is the date (`data_as_of`) stamped and does it match the window actually returned?
- Are the Top Movers labelled with the window they belong to, and not a live `top-changes`
  snapshot passed off as the wrapped week?
- New Filings: exactly the 5 most recent, structured fields only (no `body` numbers)?
- New IPOs: is each "first-day" change computed from `daily[0].close` vs offering price,
  not `overview.daily_close_change` (the latest day)? Every ticker linked to its report?
- Headlines: 5 IDX-relevant items, off-topic non-IDX stories dropped, each with a source?
- Is it delivered as `newsletter.html` (send-ready, no PDF attachment), with every ticker
  linked to `sectors.app/idx/<lower>`, in ticker-blue (`#9E0142`), including inline
  prose mentions, not just table cells?
- Gains/losses green/red (`#568475`/`#D53E50`) consistently across every table and the
  hero chart, magenta reserved for the CTA button only?
- If a broker/flow table appears, is every broker code linked to
  `sectors.app/idx/broker/<lower>`?
- Is the Appendix (endpoint/field trace) present, after Sources and before the
  disclaimer (`../newsletter-format.md`'s Appendix section, mandatory for every issue)?
  **Endpoints and field names only**, one bullet per endpoint, with no section label,
  chart name, table name, derivation or usage note attached to any bullet.
