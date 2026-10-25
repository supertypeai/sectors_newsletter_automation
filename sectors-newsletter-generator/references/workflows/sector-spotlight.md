# Sector spotlight, workflow

One sub-sector read as a whole: what the group's valuation is, why it prints that number,
who sits at each end of it, and which name contradicts the pattern. Written for two
readers, the investor and the person following the news for the big picture, so the first
screen is plain language and the metrics are explained before they are used. Top-of-funnel
discovery content. Read `../newsletter-format/skeletons/sector-spotlight.md`,
`../sourcing.md`, and `../compliance.md` before drafting. "Which one is actually cheap" is
a valuation-context question, report it as context, never as a buy call.

**The subject is the sub-sector, not a ticker.** A single company earns a section only as
evidence inside the group's argument, and only when it breaks from the pattern the earlier
sections established. If the draft's headline names a company, the issue has drifted into
`single-company-deep-dive` and needs re-pointing.

## 1. Pick the sector and its current hook

A spotlight still needs a "why now": a sector that led or lagged the week, a macro event
that just repriced it, an earnings season for the group, an index review that hit one of
its members. Web-source or data-source the hook first (`../sourcing.md`), don't run an
evergreen "banks explained" with no trigger.

Cheap discovery of what's moving in a sector:

```bash
node ../../scripts/sectors.mjs \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=7d&sub_sector=<slug>&n_stock=7" \
  --save-dir <scratch-dir>
```

Sub-sector slugs come from `subsectors/` (33 pairs, cacheable). Pull `n_stock=7`, not 3:
this type needs enough rows to show whether the week's move was broad or concentrated in
one industry inside the group.

## 2. Fetch the group

```bash
node ../../scripts/sectors.mjs \
  "subsector/report/<slug>" \
  --save-dir <scratch-dir>
```

`subsector/report/{slug}` is the spine of the whole issue, and this type uses far more of
it than a peer table needs:

- `statistics.total_companies`, `.filtered_median_pe`, `.filtered_weighted_avg_pe` — the
  lede's sizing, and the **median-vs-weighted gap that the dispersion paragraph is built
  on**. A median far below the weighted average means a handful of expensive large caps
  sit on top of a cheap tail; say which names, and which industries they belong to.
- `valuation.historical_valuation` — the five-year median P/E, P/B and P/S series, printed
  as the issue's first table. This is what makes "cheap" mean something: the group against
  its own history, not against a remembered number.
- `market_cap.total_market_cap`, `.mcap_summary.mcap_change` (1w/ytd/1y),
  `.monthly_performance` — the group's own move, stated above the movers table.
- `growth.weighted_avg_growth_data`, `.growth_forecasts` — last full year's realized
  earnings and revenue growth against the current year's forecast. Section 7 of the
  skeleton needs both.

## 3. Screen the members, with a market-cap floor

```bash
node ../../scripts/sectors.mjs \
  "companies/?where=sub_sector%20%3D%20'<slug>'%20and%20pe_ttm%20%3E%200%20and%20market_cap%20%3E%203000000000000&order_by=pe_ttm&limit=25&include_query_values=true" \
  --save-dir <scratch-dir>
```

- The **`pe_ttm > 0` guard is load-bearing**: a negative P/E passes any `< X` filter and
  sorts to the top of an unguarded cheapest list.
- The **market-cap floor is equally load-bearing for this type**, and it must be stated in
  the table's caption. Without it the cheap end fills with illiquid micro-caps whose
  multiples say nothing about the sub-sector. IDR 3 trillion is a sane default for a large
  sub-sector; raise it if the table still reads like a list of names nobody trades, lower
  it (and say so) for a genuinely small group.
- Screener results carry only symbol + name (+ requested `query_values`), so keep the
  screener table to ticker, company, P/E and market cap. Anything richer needs `report`.

Read the screener output for **industry clustering**, not just for the cheapest row. The
finding this type wants is "the cheap end is all palm oil and poultry", which is what makes
the group's headline multiple un-buyable as a single idea.

Then **split the screened members into the groups the cluster implies** (state-owned and
regional lenders against smaller digital ones, say) and pull each member's 7-day move with
`daily/{ticker}/?start=<close-7d>&end=<data_as_of>` (first and last `close`). The issue's
insight is how the week landed on each group, shown as two side-by-side cards with a simple
average. Compute the averages yourself, label them "simple" in the caption, list every member
of the extreme that had no move data, and name any member that contradicts the pattern. Do
not generalise past the members you measured. Use `overview.tags` on the
picks, or the company names themselves, to name the cluster.

## 4. Pull the name that breaks from the group, plus its close peers

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER_A>/?sections=overview,valuation,financials,dividend,ownership" \
  "company/report/<TICKER_B>/?sections=overview,valuation,financials,dividend,ownership" \
  "company/report/<TICKER_C>/?sections=overview,valuation,financials,dividend,ownership" \
  --save-dir <scratch-dir>
```

Two or three peers, all from the **same industry inside the sub-sector**, so the columns
compare like with like. Pull the full set, then **choose one angle and show only the data
that serves it**. The reader can open each company report for the rest. The angle goes in
the heading ("the biggest capital buffer, not the lowest P/E or the best ROE").

Candidate fields, pick three at most:

- `valuation.historical_valuation[]`: current-year `pe`, `pb`, `pe_peer_avg`, `forward_pe`.
- `financials.historical_financial_ratio[]`: ROE, capital adequacy ratio for banks, debt/equity
  and interest coverage for non-financials, margins.
- `dividend.yield_ttm`: trailing yield.
- `ownership.institutional_transaction_flow[]`: render as a seven-block flow strip when it cuts
  for or against the price move.

Sub-sector notes: banks do not report EV/EBITDA and debt/equity says little for them, so use
capital adequacy, ROE and P/E. Non-financials still need leverage next to P/E when the story
is "a lower P/E next to materially higher debt is a smaller discount than it looks". Label each
column with a plain question over the metric name ("Price for profit", "Profit earned", "Safety
buffer") and bold the best value in each column.

## 5. Validate

- Band-check every per-company ratio against `../sectors-api/data-quality.md`. Screener and
  leaderboard output is **not** pre-validated, a garbage ROE or P/E on one member poisons
  the ranking.
- "Cheap" only means something against a benchmark: the group's own five-year series, the
  group median, or the name's peer average. Never call a raw multiple cheap on its own.
- Reconcile the valuation columns' period against the ratio columns' period, and say so in
  the caption. Mixing a current-year P/E with a prior-year ROE without labelling it is the
  most common error in this type.
- State the exact window behind every "7-day" or "last week" figure (from which close to
  which close), in the caption.

## 6. Write the argument, not the data

Order is fixed by the skeleton: plain-language opening, At a Glance, How to Read the Numbers,
group history and dispersion, the week split by group, the name that held up or broke the
pattern, the earnings forecast, takeaway. Each heading states its finding. Each block carries
a one-line italic caption. The paragraph after each block says what it means in two or three
sentences and does not restate the rows.

**Explain before you show.** Write the "How to Read the Numbers" box from the metrics the
issue actually uses, each defined by the question it answers with a worked example from the
issue's own figure. Say what a wide median-versus-weighted gap means in words. A reader with
no finance background should be able to follow the headline and the "In plain terms" callout
without the tables.

**No inline citations.** Strip every `(sectors.app)` and `(Source, date)` from prose and captions. Web-sourced facts go in the Sources list only, and the reader still sees what the fact is, in plain words.

**Vary the shape.** Cycle stat tiles, zero-based bars, side-by-side cards, a company card, a
flow strip and callouts. Never two same-shaped blocks in a row. Blocks are in
`../newsletter-format/sector-spotlight-components.md`.

**Do not say "cheap" or "expensive".** Say "lowest multiples", "highest multiples",
"low-multiple", "high-multiple" (`../compliance.md`). Card titles describe the screen.

The takeaway has an "In plain terms" callout, an "If you follow the economy" paragraph, an
"If you invest" paragraph and a "What to watch" callout, stated as context, not as a call.
Do not add a standalone "this is not a call" line: the footer disclaimer carries it.

## 7. Self-review before delivery

- Does the H1 name the sub-sector's finding, not a ticker, and do the first two paragraphs
  make sense to someone with no finance background?
- Is the At a Glance card three tiles, and is every tile vertically centred?
- Is there a How to Read the Numbers box, defining only the metrics used?
- Is the five-year table median P/E only, with bars from zero and the current year
  highlighted? Is the median-versus-weighted gap explained in words, with the names that
  create it?
- Does the screener state its market-cap floor, and are the two group cards captioned with
  the simple-average note, the members left out and any contradicting member?
- Does the week's heading match what the cards show, with exceptions disclosed?
- Does the peer table follow one stated angle, carry at most three columns with plain-question
  labels, bold best-in-column, and point to company reports for the rest?
- Is the growth forecast tied back to the trailing multiple, with the repricing caveat?
- Does the takeaway have the four parts (in plain terms, economy, investor, what to watch)?
- Grep the body for `(sectors.app)`, `(Trading`, `(Databoks` and any `, sectors.app.` caption tail. Zero hits.
- Are any two adjacent blocks the same shape? Break the run.
- Does any sentence call a bank cheap, expensive, undervalued, a bargain or the one to own?
  Reword to "lowest multiple" or state the fact (`../compliance.md`).
- Did any member's garbage ratio survive into a card or average? Re-scan against the bands.
- Does every `TICKER` mention (tiles, cards, tables, flow strips, prose) read bold, linked and
  `#9E0142`? Gains and losses `#568475` and `#D53E50`, bold, on numeric readings only?
  (`../newsletter-format.md`'s Color convention.)
- Is the Appendix present, after Sources and before the disclaimer, endpoints and field
  names only?
- Are `newsletter.md` and `newsletter.html` in sync?
