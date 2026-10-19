# Single company deep dive, workflow

One company, covered whole: the business model and revenue mix, the competitive moat, the
unit economics, the macro forces acting on it, and the long-term case both ways. A recent
event supplies the reason to publish now and nothing more. Read
`../newsletter-format/skeletons/single-company-deep-dive.md`, `../sourcing.md`, and
`../compliance.md` before drafting. The compliance line matters here more than anywhere
else: a piece that covers a whole business and ends on a valuation is the issue type most
likely to drift into "this looks cheap, buy it" without noticing.

## 0. Pick the format first

This type has two formats. Unless the ask already settles it, ask the user which one:

1. **Full deep dive** (this document): whole company, moat, margin ladder, macro, long-term
   read. Delivered as `newsletter.md` + `newsletter.html`.
2. **Earnings review**: one quarterly print explained, with a how-it-makes-money sankey, a
   quarter-at-a-glance list and three "what mattered" items. Delivered as `newsletter.md`
   + `newsletter.html` + `newsletter.pdf`. Switch to
   `single-company-earnings-review.md` and its skeleton, and ignore the rest of this file.

"Earnings review", "Q2 review", "results breakdown" or a PDF request means format 2.
"Deep dive" with no mention of results means format 1.

**The scope test, apply it before you write a word.** Delete the recent event from your
outline. Is there still an issue left, a business explained, a moat tested, an economics
picture, a macro frame? If not, you are drafting an event note, and this is the wrong type
for it. Either commit to the full breakdown or pick another type.

## 1. Pick the company, then anchor the entry

Two things have to hold. First, the company has to be *coverable*: enough data to fill the
business, moat and economics sections. Small caps with `null` peers, no segment data and a
three-year financial history cannot carry this type, check that before committing. Second,
there has to be a reason to publish this week.

The entry can be an earnings print, a corporate action, an ownership filing, a regulatory
change, or a valuation crossing its own historical band. It does not need to be dramatic,
because it is only a tenth of the issue.

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

Also confirm the company has segment data before planning the business section:

```bash
node ../../scripts/sectors.mjs "companies/list_companies_with_segments/" --save-dir <scratch-dir>
```

## 2. Fetch the company, all six sections plus segments and sub-sector

This type needs breadth, so the usual "slice `sections=` hard" advice relaxes: the moat and
economics sections genuinely need `peers`, `financials` and `valuation` together. Cost
tracks the section count, so this is the expensive type by design, not by accident.

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER>/?sections=overview,valuation,financials,dividend,future,peers" \
  "company/get-segments/<TICKER>/" \
  "subsector/report/<sub-sector-slug>/" \
  "daily/<TICKER>/?start=<~90d-ago>&end=<data_as_of>" \
  --save-dir <scratch-dir>
```

Add `ownership` and `management` only when governance or control is part of the moat
argument. Pull the quarter directly when the entry is an earnings print:

```bash
node ../../scripts/sectors.mjs \
  "company/get_quarterly_financial_dates/<TICKER>/" \
  "financials/quarterly/<TICKER>/?report_date=<latest-quarter-end>" \
  --save-dir <scratch-dir>
```

Fields by section of the issue:

- **Business** (skeleton section 4): `get-segments`'s `revenue_breakdown[]`, filtered to
  `target === "Total Revenue"` for the top-level mix, unfiltered for a `sankey`. Pull the
  same call for an earlier `financial_year` to get segment direction, the endpoint takes an
  optional `financial_year`. Banks: `financials_sector_metrics{gross_loan, total_deposit,
  casa, interest_income}` from `financials/quarterly`.
- **Moat** (section 5): `peers[0].peers_data.companies[]{symbol, market_cap, net_income,
  pe_ttm, pb_mrq, point_summaries[]}`, `overview.{market_cap, market_cap_rank, sub_sector,
  employee_num}`, and `subsector/report`'s `statistics{total_companies,
  filtered_median_pe}` plus `market_cap.total` for share-of-sector. Durability comes from
  `financials.historical_financial_ratio[]` read as an eight-year series, not a snapshot.
- **Unit economics** (section 6): `financials.historical_financials[]{year, revenue,
  earnings, ebitda}` for the margin ladder, `historical_financial_ratio[]{profitability
  {roa, roe, net_profit_margin}, leverage, liquidity, efficiency}` for the trend,
  `historical_eps`, and from `financials/quarterly` the `gross_profit`, `cost_of_revenue`
  and `capital_expenditure` lines that the annual report section does not break out.
- **Macro** (section 7): not an API section. Web-search each force and cite it with a date
  (`../sourcing.md`). The API side is only the line item the force lands on.
- **Long-term read** (section 8): `valuation.{forward_pe, historical_valuation[]{pe, pb,
  ps, *_peer_avg, year}}`, `future.{company_growth_forecasts[], analyst_rating_breakdown}`,
  `dividend.{yield_ttm, payout_ratio}`. Never present `intrinsic_value` as fair value.

## 3. Validate

- Band-check every ratio against `../sectors-api/data-quality.md` before it ships (a
  `roe=262` or a `-88.5x` P/E is garbage, drop it and say so if it mattered). The margin
  ladder multiplies this risk, it derives several percentages off the same two fields, so
  band-check the derived numbers too, not only the raw ones.
- Segment edges: confirm the filtered `target === "Total Revenue"` values sum to the group
  revenue you quote elsewhere. If they do not reconcile, say which year each figure is
  from rather than quietly mixing them.
- Peer table: `peers` is `null` for many small caps, and `point_summaries` is often absent
  even when `peers` is present. Drop the column, not the section.
- Price series: use `daily/{symbol}`, don't mix it with `overview.all_time_price` summary
  fields, they can disagree on the same date.
- Confirm the `start`/`end` echoed back match what you asked, ranges silently clamp to
  90 days.
- `major_shareholders[].share_percentage` is a **string**, `parseFloat` before any math.

## 4. Find the thesis, then write it first

The deep dive's job is a defensible long-run view of the business, benchmarked at every
step: the business growing or shrinking *where*, the moat real or asserted *against whom*,
the economics improving or eroding *versus what year*, the stock cheap or dear *versus what*
(its own five-year band, the peer average). A number without a benchmark is not a finding.

Write the one-paragraph thesis first, then fill the sections that build to it. The sections
run business, moat, economics, macro, read, in that order, because each one is the evidence
the next one leans on. Six habits decide whether the draft reads edited or raw:

- **Explain the business in plain language before analysing it.** The reader should be able
  to describe what the company sells after section 4, without knowing the sector. Segment
  names lifted straight from the filing ("Enterprise Digital & Others") explain nothing on
  their own, say what is actually being sold.
- **Test the moat, do not assert it.** Name its kind, name a specific rival, and put a
  number on the position. "Market leader" with no share figure and no named competitor is
  the sentence to cut.
- **Unit economics means the ladder, not one margin.** Revenue to gross to operating to net.
  Put the ladder in the chart, then name in prose only the rungs that moved and the year
  they moved against. A single net-margin figure is not unit economics, and a paragraph
  reciting all four rungs with both years is a chart nobody drew.
- **Macro forces land on line items.** Every force named in section 7 traces to a specific
  account: the policy rate to interest expense or net interest margin, the rupiah to
  imported cost of revenue, a commodity to a segment's realised price. Sector commentary
  that never reaches this company's statements gets cut.
- **Always research and write the counterargument.** Before drafting, spend a search
  explicitly on the other side of your thesis: the growth segment and its YoY rate, new
  capacity and its guided start quarter, the pipeline under development, the quarter that
  stabilized. `company/report`'s `future` section, the latest quarterly results release,
  and the company's own strategy statements carry it. Then close the block by putting the
  unresolved question to the reader without answering it (`../compliance.md`).
- **Forward-only close.** "What to Watch Next" is three or four bullets, each with a
  threshold, quarter, or counterparty, and at least one structural rather than the next
  print. Backward-looking colour, last month's institutional buyers and sellers above all,
  gets cut from the issue, not relocated into this section.

**Density is the difference between a deep dive and a data dump.** Cap every paragraph at
three figures, open every section with a claim carrying no figure at all, and push every
series into a table or chart. Round in the body, precise in the table. The draft that fails
this reads as thorough to its writer and as homework to its reader, so run the count before
delivery, not after.

Cite sparingly. Figures from the API need no inline `(sectors.app)`, the Appendix and the
disclaimer already carry that; body citations are for named outside sources, at most about
one per paragraph.

Charts: this type carries three or four, more than any other. The reference set is the 90-day
price line in the company card, a `sankeySite` of the quarter's income statement in the print
block (or of the segment decomposition in the business section), and a `barChart` of the
quarterly margin trend in the economics section. Write each SVG into the issue folder, rasterise
with `node ../../scripts/svg2png.mjs chart-<slug>.svg`, and reference the PNG from the HTML and
the Markdown. Fetch the company logo for the headline from the carousel skill's
`assets/logos.json` (base64 PNG keyed by ticker) and save it as `logo-<ticker>.png`; if the
ticker has no entry, omit the logo rather than substituting one. Build every block from
`../newsletter-format/company-issue-components.md`, and match the reference issue
`newsletter_2026-10-14_single-company-deep-dive`. Non-zero-based y-axis for price
(`../newsletter-format.md`). Each caption states that chart's finding; a comparability
caveat such as a stock split belongs in a one-sentence footnote under the period table,
phrased as a plain fact, never as an aside addressed to the reader about the chart.

## 5. Self-review before delivery

- **Scope test, first and hardest:** remove the recent event from the draft. Is there still
  a whole-company piece left, business, moat, economics, macro, thesis? If the issue
  collapses, it is an event note and does not ship under this type.
- Does the draft run five body sections plus the close, in the skeleton's order, with the
  entry section at roughly a tenth of the length rather than a third?
- Is the issue 1,300 to 1,900 words, with no section past three paragraphs?
- Opening stack present and in order: headline with logo, standfirst, At a Glance box ending on
  the Open Question bullet, company card with three tiles and the price chart?
- When the entry is an earnings print, does the print block show the quarter sankey and the
  three row quarterly table, with the balance sheet source of any gap named plainly?
- Is every chart referenced as a PNG with descriptive alt text, and does each chart number equal
  the table and prose number?
- Count the figures in every paragraph. More than three anywhere means move a series into
  that section's table or chart, or cut it. Does any paragraph recite a year-by-year series
  that a table should be carrying?
- Does every H2 state this issue's finding (one headline figure allowed), and does the first
  sentence under it state the claim in words with no figure?
- Does section 4 explain what the company sells in language a non-follower of the sector
  understands, with each segment's share of revenue and its direction?
- Does section 5 name the moat's kind, name at least one specific competitor, and attach a
  position number (market cap rank, share of the sub-sector, a peer-table comparison)?
- Does section 6 carry the full margin ladder against an earlier year, plus ROE/ROA year by
  year and a leverage trend, not a single-year snapshot?
- Does every macro force in section 7 have a date, a source, and a named line item in this
  company's accounts that it moves?
- For every chart shipped, is it wrapped in an explicit opaque background rect
  (`charts.mjs` never draws one itself), and does every label, especially a series'
  endpoint value, land inside the canvas rather than past its right edge
  (`../newsletter-format.md`'s hero-chart paragraph on both)?
- Did every section heading get rewritten to state this issue's actual finding, not left as
  the skeleton's generic slot name
  (`../newsletter-format.md`'s **Section headings state the finding, not the slot**)? If
  two events (a corporate action, an earnings print, a
  screener ranking) are merely concurrent, does the heading and prose say so plainly
  instead of implying one caused the other?
- Is the headline a Title Case declarative sentence carrying the structural tension, not
  only this week's event, and trimmed of possessives and qualifiers? Is the standfirst
  three short sentences with no inline citations and no comma-chained clauses?
- Is there a real counterargument paragraph with its own data, and does the read block end
  on an unanswered question rather than a resolution?
- Is "What to Watch Next" three or four forward-looking bullets, each with a threshold,
  quarter, or counterparty, at least one structural, and free of backward-looking
  ownership trivia?
- Count the inline `(sectors.app)` tags. More than one or two in the whole issue, or any
  sentence carrying two citations, means strip them, the Appendix already covers
  provenance.
- Was every ratio spelled out with its abbreviation once, "price-to-earnings (P/E)", and
  abbreviated thereafter, rather than written out in full every time?
- Did any founder biography, potted family history, or "fun fact" survive where control is
  not part of the moat or governance argument? Cut it. Where it is, does it carry a figure?
- Do the segment figures reconcile against the group revenue quoted elsewhere, and is each
  figure's financial year stated where two years are in play?
- Does the period table footnote anything that breaks row-to-row comparability, a stock
  split especially?
- Are the "what to watch" items observables with a date, threshold, or counterparty, not
  prescriptions?
- Is every valuation/quality number benchmarked against its own history or peers?
- Did any ratio fail a plausibility band and get left in anyway? Re-scan, derived margin
  percentages included.
- Is every forward statement attributed (consensus, guidance), never the newsletter's own
  call? No "undervalued," no "good entry," no price target as our view
  (`../compliance.md`).
- Was `share_percentage`'s string/float type gotcha handled before any comparison?
- Does every `TICKER` mention (table, chart label, AND inline prose) read bold, linked, and
  ticker-blue (`#9E0142`)? Gains/losses green/red (`#568475`/`#D53E50`), and if a chart
  shows a signed move via `barChart`, was `financial: true` passed (it doesn't default to
  green)? (`../newsletter-format.md`'s Color convention, applies to every issue.)
- Is the Appendix (endpoint/field trace) present, after Sources and before the disclaimer?
  **Endpoints and field names only**, one bullet per endpoint, with no section label, chart
  name, table name, derivation or usage note attached to any bullet
  (`../newsletter-format.md`'s Appendix section)?
