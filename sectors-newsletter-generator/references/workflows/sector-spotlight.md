# Sector spotlight, workflow

One sub-sector, its names compared on the same metrics: who is cheap, who is dear, who is
growing, on a like-for-like basis. Top-of-funnel discovery content. Read
`../newsletter-format.md`'s sector-spotlight skeleton, `../sourcing.md`, and
`../compliance.md` before drafting. "Which one is actually cheap" is a valuation-context
question, report it as context, never as a buy call.

## 1. Pick the sector and its current hook

A spotlight still needs a "why now": a sector that led or lagged the week, a macro event
that just repriced it, an earnings season for the group. Web-source or data-source the
hook first (`../sourcing.md`), don't run an evergreen "banks explained" with no trigger.

Cheap discovery of what's moving in a sector:

```bash
node ../../scripts/sectors.mjs \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=7d&sub_sector=<slug>&n_stock=3" \
  --save-dir <scratch-dir>
```

Sub-sector slugs come from `subsectors/` (33 pairs, cacheable).

## 2. Fetch the sector leaderboard and the peers

```bash
node ../../scripts/sectors.mjs \
  "subsector/report/<slug>" \
  "companies/?where=sub_sector%20%3D%20'<slug>'%20and%20pe_ttm%20%3E%200&order_by=pe_ttm&limit=15&include_query_values=true" \
  --save-dir <scratch-dir>
```

- `subsector/report/{slug}` — the whole group in one call: `statistics.filtered_median_pe`,
  `filtered_weighted_avg_pe`, `market_cap.mcap_summary.mcap_change{1w,ytd,1y}`,
  `companies.top_companies{top_mcap, top_growth, top_profit, top_revenue}`. This is the
  spine of the issue: the group's median valuation is the benchmark every pick is read
  against.
- `companies/` screener — ranked members. The **`pe_ttm > 0` guard is load-bearing**: a
  negative P/E passes any `< X` filter and sorts to the top of an unguarded cheapest list.
  Screener results carry only symbol + name (+ requested `query_values`); feed the picks
  into `report` for real detail.

Then pull 2-4 picks for the actual comparison:

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER_A>/?sections=overview,valuation,financials,dividend" \
  "company/report/<TICKER_B>/?sections=overview,valuation,financials,dividend" \
  --save-dir <scratch-dir>
```

Compare like-for-like: `valuation.historical_valuation[]` (P/E vs the group median and
vs each name's own history), `financials.historical_financial_ratio[]` (roe/margins),
`dividend.yield_ttm`. For banks the meaningful cross-name metric is roe and net interest
margin, not raw P/E alone, note the metric you're ranking on.

## 3. Validate

- Band-check every per-company ratio against `../sectors-api/data-quality.md`. Screener
  and leaderboard output is **not** pre-validated, a garbage roe or P/E on one member
  poisons the "cheapest/best" ranking.
- "Cheap" only means something against a benchmark: the group median P/E, the name's own
  history, or a peer average. Never call a raw multiple cheap on its own.

## 4. Write the comparison as a table, lead with the read

The core of this issue is a **comparison table**, one row per pick, columns = the shared
metrics that matter for this sector (price, P/E vs group median, ROE, dividend yield).
Then a short paragraph per pick for what doesn't fit a column. Lead with the one-line
read: the group is cheap/expensive vs its own history, and within it one name stands out
on the metric that matters, stated as valuation context, not a recommendation.

## 5. Self-review before delivery

- Is every "cheap/expensive/best" claim benchmarked against the group median or the
  name's own history, never a bare multiple?
- Did any member's garbage ratio survive into the ranking? Re-scan against the bands.
- Is the framing valuation context, not a buy call? No "the one to own," no "clear winner
  to buy" (`../compliance.md`).
- Is the metric being ranked on stated plainly (P/E, ROE, yield), so the reader knows what
  "cheap" means here?
