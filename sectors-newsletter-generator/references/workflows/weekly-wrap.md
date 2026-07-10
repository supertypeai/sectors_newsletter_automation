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
- `most-traded` — most active names for the week; check whether one symbol tops the
  entire window, not just one day — that's a story in itself.

Then, once you've picked which sub-sectors and which ticker to feature for flow:

```bash
node ../../scripts/sectors.mjs \
  "subsector/report/<slug>" \
  "foreign-flow/<TICKER>/?start=<mon>&end=<fri>" \
  --save-dir <scratch-dir>
```

- `subsector/report/{slug}` — a sub-sector leaderboard in one call: `mcap_change{1w}`,
  `top_companies`, `filtered_median_pe`. Feeds the "sector pulse" section.
- `foreign-flow/{symbol}` — net foreign inflow/day. Mind the **2025-01-02 floor**; a
  window straddling it returns partial data silently, compare the earliest returned date
  to what you asked. `broker-summary/{symbol}/top` is an alternative for a
  "which brokers are accumulating X" angle.

Optionally, `news/` (by `sector`/`sub_sector`) to source the "why" behind whichever
mover you feature — per `../sourcing.md`, the data proves *what* moved, search/news
finds *why*.

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
