# Three-stock story, workflow

Three companies read together because of one pattern this week, each told through a dated
timeline, its numbers and a key takeaway. Read `../sourcing.md` and `../compliance.md`'s
"great future forecast" rule before drafting.

## 1. Pick three stocks

The trio needs a pattern a reader can name before seeing the tickers: same-direction insider
filings, a control change, a shared tycoon or group, a sub-sector theme. The pattern becomes the
headline and the "why this matters" block, so settle it before researching further. Three
unrelated names do not make an issue.

Cheap, concrete discovery signals (same recipes the carousel skill uses, see
`../sectors-api/endpoints.md` §2 for full syntax):

```bash
node ../../scripts/sectors.mjs \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=30d" \
  "filings/?limit=20" \
  --save-dir <scratch-dir>
```

- `companies/` screener recipes: founder-owned (`major_shareholders_name like '%name%'`
  or `free_float < 0.25`), founder/tycoon cross-company reach
  (`key_executives_name like '%name%'`), dividend aristocrats, fastest growers — any of
  these surfaces a concrete, verifiable candidate rather than a guess.
- `filings/` — an insider-cluster pattern (several same-direction filings in a short
  window) is a real, narratable "why this stock, why now."
- `conglomerates_group[]` / `whale_investors[]` (inside `company/report`'s `ownership`
  section) — join keys toward a "who really owns this" thread across picks.

Each pick still needs a real current reason to feature, not just an interesting history
— recency discipline from `../sourcing.md` applies here too.

## 2. Research the story (web, cited)

For each pick, the dated sequence that explains why it is here: control changes, deals, the
filing itself, the company's response, the latest close. Collect dates and figures first, prose
later, because the timeline is the spine of the block. Cite everything per `../sourcing.md`.
Reconcile every filing against the exchange tape (price against that day's range, size against
traded volume) before calling a trade off-market or a stake change real.

## 3. Fetch the people and the numbers

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER>/?sections=overview,management,ownership,financials,future" \
  "filings/?symbol=<TICKER>&limit=50" \
  "daily/<TICKER>/?start=<~90d-ago>&end=<data_as_of>" \
  --save-dir <scratch-dir>
```

Repeat per ticker, or batch all three into one `--save-dir` call. `overview` feeds the three stat
tiles (`last_close_price`, `market_cap`, and the 52-week high from `all_time_price` or the
`daily` series, computed one way for all three picks). `daily` feeds both the latest-close
timeline row and the rebased price chart.

Key fields:
- `management.key_executives[]{name,position}` and
  `executives_shareholdings[]{name,position,share_amount,share_percentage}` — the people
  section.
- `ownership.major_shareholders[]{name,share_percentage,share_amount}`,
  `whale_investors[]`, `conglomerates_group[]` — who actually holds and steers this.
  **Type gotcha**: `major_shareholders[].share_percentage` is a **string**;
  `executives_shareholdings[].share_percentage` is a **float**, same field name, two
  types across sections of the same report — `parseFloat` before any comparison or math.
- `financials.historical_financials[]` and `historical_financial_ratio[]` — the real
  numbers section.
- `future.company_growth_forecasts[]` and `analyst_rating_breakdown` — the only
  legitimate source for the "outlook" section, and only as attributed, sourced consensus
  (see step 4).

Null-guard every field — small caps return `null` for `analyst_rating_breakdown`,
`forward_pe`, `company_value_forecasts`, and more; drop the line rather than render a
blank.

## 4. Write the outlook as attributed statements only

This is `../compliance.md`'s "great future forecast" rule, applied. Allowed: "management
has guided FY revenue up 8%," "consensus of N analysts estimates EPS growth of X%
(`future.company_growth_forecasts`, sectors.app)," "the company's disclosed strategy is
Y." Banned: "this stock will double," an unsourced "bright future ahead," any target
price framed as the newsletter's own call.

Attribution is a sentence construction, not a disclaimer appended to one. Write "KISI
Sekuritas rates it Buy at a IDR 2,400 target" and stop. Never follow an attributed line
with "reported here as sourced consensus, not this newsletter's own view" — the
attribution already did that work, and the trailing note reads as legal padding. Where
`analyst_rating_breakdown` and `company_growth_forecasts` both come back `null`, say
nothing about consensus at all. Do not write a paragraph reporting the absence ("both
fields return null, so no consensus is reported"); a missing field is not news.

## 5. Build the issue

Follow `../newsletter-format/skeletons/three-stock-story.md` for the block order and
`../newsletter-format/company-issue-components.md` for the markup. Reference issue:
`newsletter_2026-10-15_three-stock-story`.

- Charts from `../../scripts/charts.mjs`: `ownershipBars` for a control change, `rebasedLines`
  for the closing three-way price chart, plus any `barChart` (with `financial: true` for signed
  moves) that one pick's story needs. Write each SVG next to the issue, then
  `node ../../scripts/svg2png.mjs chart-<slug>.svg` and reference the PNG from both the HTML and
  the Markdown. Every number on a chart must equal the number in the table and the timeline.
- Write `newsletter.md` and `newsletter.html` together, never one alone.
- Prose per block stays short. The timeline carries the dates, so the finances paragraph carries
  only the trend, one ratio, debt and attributed forward view.

## 6. Cut deliberately

The research pass collects far more than the draft should carry:

- One citation per claim that needs one. Founding dates, control changes, deal values, quotes and
  the news hook get a source. Figures from the Sectors API do not each need a trailing
  `(sectors.app)`.
- Sources lists only what the body cites.
- No scaffolding vocabulary ("The current story is", "The real news is").
- Names and roles only where they move the story. An executive roster is API output, not writing.
- Attribution is sentence construction. Write "consensus of 67 analysts rates it 50 Buy" and
  stop, with no trailing "not this newsletter's view". If `analyst_rating_breakdown` and
  `company_growth_forecasts` are `null`, say nothing about consensus and do not report the absence.

## 7. Self-review before delivery

- Does the headline name a pattern without tickers, and does the glance box give each pick its
  dated event in two sentences?
- Does the "why this matters" block stay general, with a pull quote that states the limit of the
  signal and gives no advice?
- Per pick: stat tiles, intro, dated timeline ending on the latest close, finances paragraph,
  table, key takeaway, in that order? Is the takeaway sized against the event with a figure?
- Does every timeline row carry a date and a fact, and does the last row state the move against
  a stated high or low in green or red?
- Is every forward-looking sentence attributed (management guidance, disclosed strategy, cited
  consensus), with no trailing disclaimer and no paragraph about a null field?
- Do the closing chart and sentence rank the same moves, with window and trading days in the caption?
- Did `share_percentage`'s string/float difference get cast before any comparison?
- Does every ticker mention (prose, table, tile, chart label) read bold, linked and `#9E0142`;
  gains `#568475`, losses `#D53E50`?
- HTML references PNG charts, not SVG, and each `<img>` has descriptive alt text and `width="536"`?
- Does the HTML match the Markdown block for block?
- Sources, then Appendix (endpoints and fields only, one bullet per endpoint), then the disclaimer?
- Copywriting: no dash connectors, no inverted pairs, no emoji, grep the HTML for `&mdash;`,
  `&ndash;` and a literal `$`.
