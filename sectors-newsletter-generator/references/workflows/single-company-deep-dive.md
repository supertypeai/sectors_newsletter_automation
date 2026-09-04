# Single company deep dive, workflow

One company, read in depth off a real current trigger: an earnings release, an
ownership change, a dividend declaration, or another major corporate action. Read
`../newsletter-format/skeletons/single-company-deep-dive.md`, `../sourcing.md`, and
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

**Check for a real social card before generating a chart — always, same priority order
as `weekly-insights-v2.md`'s "Visuals: the social cards" section, not a first choice
taken for convenience.** The bucket cannot be listed without a credential (see that
section's superseded note), so in an interactive run, ask the user whether a real card
exists for *this issue's ticker specifically* (not merely IDX-relevant) whose filename
date falls within a reasonable recency window of the trigger event. A real card beats a
generated chart whenever one is eligible; `charts.mjs` is the fallback for when nothing
eligible exists, not a default taken without checking. **In an unattended run**, there is
no one to ask, so the fallback applies directly, per that section's unattended policy.
Record which case applied in `run-notes.md` — same distinction `weekly-insights-v2.md`
documents — collapsing them into "used a chart" hides whether a card was genuinely
unavailable or just never asked about.

Then build the argument in the three-section shape the skeleton sets out
(`../newsletter-format/skeletons/single-company-deep-dive.md`). Four habits decide whether
the draft reads edited or raw:

- **Mechanism before register.** Open on how the trigger physically works, the rule or
  filing compelling it, the size in shares and as a percent of issued capital, the executing
  party, then the print it left in the market: negotiated volume, average price, discount to
  that day's regular close, net foreign flow that session, intraday low against the close.
  `ownership.top_transactions`, `filings/`, and the `daily/` series carry most of it, and
  anything the API doesn't (a broker appointment, a regulator's disposal window) comes from
  a cited news source. Do not open on the shareholder table; pull from it only the one float
  figure the argument needs.
- **One read block, not three.** The verdict, the multi-year trend that contradicts the
  price, the valuation reinterpreted by that trend, and the period table all live under a
  single H2 whose heading states the claim. A standalone "the read" section that restates
  the verdict, followed by separate "the numbers" and "valuation" sections, is the shape to
  avoid, it says the same thing three times at falling volume.
- **Always research and write the counterargument.** Before drafting, spend a search
  explicitly on the bull case (or, if the trend is up, the bear case): the growth segment and
  its YoY rate, new capacity and its guided start quarter, the pipeline under development,
  the quarter that stabilized. `company/report`'s `future` section, the latest quarterly
  results release, and the company's own strategy statements carry it. Then close the block
  by putting the unresolved question to the reader without answering it (`../compliance.md`).
- **Forward-only close.** "What to Watch Next" is three or four bullets, each with a
  threshold, quarter, or counterparty. Backward-looking colour, last month's institutional
  buyers and sellers above all, gets cut from the issue, not relocated into this section.

Cite sparingly. Figures from the API need no inline `(sectors.app)`, the Appendix and the
disclaimer already carry that; body citations are for named outside sources, at most about
one per paragraph.

If nothing eligible exists in the GCP bucket, the hero chart falls back to `charts.mjs`:
usually the price series over 90 days with the trigger date marked, or an earnings/revenue
bar series. Non-zero-based y-axis for price (`../newsletter-format.md`). Its caption states
the finding; a comparability caveat such as a stock split belongs in a one-sentence
footnote under the period table, phrased as a plain fact, never as an aside addressed to
the reader about the chart.

## 5. Self-review before delivery

- Was the GCP bucket actually checked for a real card before generating a chart —
  not skipped as a shortcut — and is which of the two outcomes (listing call
  errored / nothing eligible for this ticker) recorded in `run-notes.md`?
- If the issue shipped a generated hero chart, is it wrapped in an explicit opaque background rect
  (`charts.mjs` never draws one itself), and does every label, especially a series'
  endpoint value, land inside the canvas rather than past its right edge
  (`../newsletter-format.md`'s hero-chart paragraph on both)?
- Did every section heading get rewritten to state this issue's actual finding, not
  left as the skeleton's generic slot name (`../newsletter-format/skeletons/single-company-deep-dive.md`'s **Section
  headings state the finding, not the slot**)? If two events (a corporate action, an
  earnings print, a screener ranking) are merely concurrent, does the heading and prose
  say so plainly instead of implying one caused the other?
- Is the lead a real recent trigger, not a standing historical fact?
- Is the headline a Title Case declarative sentence with the tension in it, trimmed of
  possessives and qualifiers? Is the standfirst three short sentences with no inline
  citations and no comma-chained clauses?
- Does the body run three sections, not five? A standalone verdict section, or numbers and
  valuation split apart, means merge them under one claim-stating H2.
- Does the trigger section open on the mechanism (compelling rule, share count and percent
  of issued capital, executing party) and its market print, rather than on the shareholder
  register?
- Is there a real counterargument paragraph with its own data, and does the block end on an
  unanswered question rather than a resolution?
- Is "What to Watch Next" three or four forward-looking bullets, each with a threshold,
  quarter, or counterparty, and free of backward-looking ownership trivia?
- Count the inline `(sectors.app)` tags. More than one or two in the whole issue, or any
  sentence carrying two citations, means strip them, the Appendix already covers provenance.
- Was every ratio spelled out with its abbreviation once, "price-to-earnings (P/E)", and
  abbreviated thereafter, rather than written out in full every time?
- Did any founder biography, potted family history, or "fun fact" survive into a piece where
  the ownership story is not the trigger? Cut it.
- Does the headline read as a declarative news sentence naming the company and the tension
  (event on the left, what it sits against on the right), rather than a label or a
  question?
- Does the mechanism block explain *how* the trigger works, with the compelling rule or
  filing, the size in shares and percent of issued capital, the executing party, and at
  least one market print (negotiated volume and average price, discount to the regular
  close, net foreign flow, intraday low vs close)? A restated news lead is not a mechanism.
- Is there a genuine counterargument paragraph carrying its own data, and does the block
  end on an unanswered question rather than a resolution?
- Does the period table footnote anything that breaks row-to-row comparability, a stock
  split especially?
- Are the "what to watch" items observables with a date, threshold, or counterparty, not
  prescriptions?
- Did any founder biography, potted family history, or "fun fact" survive into a piece
  where the ownership story is not the trigger? Cut it.
- Is every valuation/quality number benchmarked against its own history or peers?
- Did any ratio fail a plausibility band and get left in anyway? Re-scan.
- Is every forward statement attributed (consensus, guidance), never the newsletter's own
  call? No "undervalued," no "good entry," no price target as our view (`../compliance.md`).
- Was `share_percentage`'s string/float type gotcha handled before any comparison?
- Does every `TICKER` mention (table, chart label, AND inline prose) read bold,
  linked, and ticker-blue (`#9E0142`)? Gains/losses green/red (`#568475`/`#D53E50`),
  and if the hero chart shows a signed move via `barChart`, was `financial: true`
  passed (it doesn't default to green)? (`../newsletter-format.md`'s Color
  convention, applies to every issue.)
- Is the Appendix (endpoint/field trace) present, after Sources and before the
  disclaimer? **Endpoints and field names only**, one bullet per endpoint, with no section
  label, chart name, table name, derivation or usage note attached to any bullet
  (`../newsletter-format.md`'s Appendix section)?
