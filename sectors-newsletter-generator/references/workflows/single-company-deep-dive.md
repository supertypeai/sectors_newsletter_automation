# Single company deep dive, workflow

One company, read in depth off a real current trigger: an earnings release, an
ownership change, a dividend declaration, or another major corporate action. Read
`../newsletter-format.md`'s single-company-deep-dive skeleton, `../sourcing.md`, and
`../compliance.md` before drafting. The compliance line matters here: a deep dive is the
issue type most likely to drift into "this looks cheap, buy it" without noticing.

## 1. Anchor the trigger (recency discipline, non-negotiable)

The lead has to be something that happened or changed recently, not a standing fact.
Establish the "why now" first:

- Web-search the last few days for this ticker: earnings, a corporate action, an
  ownership/insider filing, a guidance change (`../sourcing.md`).
- Cross-check the API's IDX-tagged feeds:

```bash
node ../../scripts/sectors.mjs \
  "news/?symbols=<TICKER>&limit=10" \
  "filings/?symbol=<TICKER>&limit=10" \
  "company/corporate-actions/<TICKER>/" \
  --save-dir <scratch-dir>
```

- `news/` is big-cap-skewed; fall back to `sub_sector` news if the ticker returns little.
- `filings/` gives insider/major-holder transactions (`transaction_type`, `holder_name`,
  `share_percentage_before/after`). Never trust the filing `body`'s own numbers, use the
  structured fields (see `../sectors-api/data-quality.md`).
- `corporate-actions` types return `null`, not `[]` when empty, null-guard before
  iterating. `upcoming_dividend[]`, `agm[]`, `stock_split[]`, `right_issue[]`.

If the "why now" search comes up empty, re-angle or pick a different name. Do not run a
history-only profile and call it news.

## 2. Fetch the company (one report call carries most of it)

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER>/?sections=overview,valuation,financials,dividend,future,ownership" \
  "daily/<TICKER>/?start=<~90d-ago>&end=<data_as_of>" \
  --save-dir <scratch-dir>
```

Slice `sections=` to only what the issue's argument needs, cost tracks the section count.
For an earnings-driven issue also pull the quarter directly:

```bash
node ../../scripts/sectors.mjs \
  "company/get_quarterly_financial_dates/<TICKER>/" \
  "financials/quarterly/<TICKER>/?report_date=<latest-quarter-end>" \
  --save-dir <scratch-dir>
```

Key fields by trigger:
- **Earnings**: `financials.historical_financials[]`, `yoy_quarter_earnings_growth`,
  `yoy_quarter_revenue_growth`, `historical_financial_ratio[]` (roe/roa/margins), plus
  the quarterly call above. Banks fill `financials_sector_metrics{net_interest_income,
  gross_loan, casa,...}`; non-banks leave it `null`.
- **Valuation context**: `valuation.historical_valuation[]{pe,pb,ps,*_peer_avg,year}`,
  company vs its own history and the peer average. Never present `intrinsic_value` as
  fair value.
- **Dividend action**: `dividend.{yield_ttm, payout_ratio, upcoming_dividends[]}`.
- **Ownership change**: `ownership.{major_shareholders[], top_transactions,
  institutional_transaction_flow[]}`. `major_shareholders[].share_percentage` is a
  **string**, `parseFloat` before any math.

## 3. Validate

- Band-check every ratio against `../sectors-api/data-quality.md` before it ships (a
  `roe=262` or a `-88.5x` P/E is garbage, drop it and say so if it mattered).
- Price series: use `daily/{symbol}`, don't mix it with `overview.all_time_price` summary
  fields, they can disagree on the same date.
- Confirm the `start`/`end` echoed back match what you asked, ranges silently clamp to
  90 days.

## 4. Find the read, then write it first

The deep dive's job is one clear read on the trigger, benchmarked: earnings beat or missed
*versus what* (its own prior quarter, consensus if disclosed, the sector), the stock
cheap or dear *versus what* (its own 5-year P/E band, the peer average). A number without
a benchmark is not a finding. Write the one-line verdict first, then fill the sections
that prove it.

**Check the Supabase social-card bucket before generating a chart — always, same
priority order as `weekly-insights-v2.md`'s "Auto-selecting cards, unattended"
section, not a first choice taken for convenience.** Run
`scripts/fixed-queries/social-media-bucket-listing.sql` through the Supabase MCP
connector, then look for a real card about *this issue's ticker specifically*
(not merely IDX-relevant) whose filename date falls within a reasonable recency
window of the trigger event. A real card beats a generated chart whenever one is
eligible; `charts.mjs` is the fallback for when the connector genuinely isn't
available or nothing eligible exists, not a default taken without checking.
Record which of the three cases applied in `run-notes.md`, same distinction
`weekly-insights-v2.md` documents (no connector / query errored / nothing
eligible) — collapsing them all into "used a chart" hides a real query defect
behind what looks like an unconfigured runner.

If nothing eligible exists, the hero chart falls back to `charts.mjs`: usually the
price series over 90 days with the trigger date marked, or an earnings/revenue bar
series. Non-zero-based y-axis for price (`../newsletter-format.md`).

## 5. Self-review before delivery

- Was the Supabase bucket actually checked for a real card before generating a
  chart — not skipped as a shortcut — and is which of the three outcomes (no
  connector / query errored / nothing eligible for this ticker) recorded in
  `run-notes.md`?
- If the issue shipped a generated hero chart, is it wrapped in an explicit opaque background rect
  (`charts.mjs` never draws one itself), and does every label, especially a series'
  endpoint value, land inside the canvas rather than past its right edge
  (`../newsletter-format.md`'s hero-chart paragraph on both)?
- Did every section heading get rewritten to state this issue's actual finding, not
  left as the skeleton's generic slot name (`../newsletter-format.md`'s **Section
  headings state the finding, not the slot**)? If two events (a corporate action, an
  earnings print, a screener ranking) are merely concurrent, does the heading and prose
  say so plainly instead of implying one caused the other?
- Is the lead a real recent trigger, not a standing historical fact?
- Is every valuation/quality number benchmarked against its own history or peers?
- Did any ratio fail a plausibility band and get left in anyway? Re-scan.
- Is every forward statement attributed (consensus, guidance), never the newsletter's own
  call? No "undervalued," no "good entry," no price target as our view (`../compliance.md`).
- Was `share_percentage`'s string/float type gotcha handled before any comparison?
- Does every `$TICKER` mention (table, chart label, AND inline prose) read bold,
  linked, and ticker-blue (`#9E0142`)? Gains/losses green/red (`#568475`/`#D53E50`),
  and if the hero chart shows a signed move via `barChart`, was `financial: true`
  passed (it doesn't default to green)? (`../newsletter-format.md`'s Color
  convention, applies to every issue.)
- Is the Appendix (endpoint/field trace) present, after Sources and before the
  disclaimer?
