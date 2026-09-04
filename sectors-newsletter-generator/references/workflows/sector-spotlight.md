# Sector spotlight, workflow

One sub-sector read as a whole: what the group's valuation is, why it prints that number,
who sits at each end of it, and which name contradicts the pattern. Top-of-funnel
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
the group's headline multiple un-buyable as a single idea. Use `overview.tags` on the
picks, or the company names themselves, to name the cluster.

## 4. Pull the name that breaks from the group, plus its close peers

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER_A>/?sections=overview,valuation,financials,dividend,ownership" \
  "company/report/<TICKER_B>/?sections=overview,valuation,financials,dividend,ownership" \
  "company/report/<TICKER_C>/?sections=overview,valuation,financials,dividend,ownership" \
  --save-dir <scratch-dir>
```

Two or three names, all from the **same industry inside the sub-sector**, so the columns
compare like with like. The peer table's columns:

- `valuation.historical_valuation[]` — current-year `pe` and `enterprise_to_ebitda`, plus
  `pe_peer_avg` to check the name against its own peer group, and `forward_pe` where the
  earnings direction matters.
- `financials.historical_financial_ratio[]` — last reported fiscal year's debt/equity,
  interest coverage and ROE.
- `dividend.yield_ttm` — trailing yield.
- `ownership.institutional_transaction_flow[]` — whether institutions bought or sold
  through the price move. This is the line that usually cuts against the headline.

**EV/EBITDA and leverage are not optional here.** The whole point of this section is that a
lower P/E next to materially higher debt is a smaller discount than the headline multiple
suggests, and you cannot make that argument from P/E alone. Bold the best value in each
column so the split is readable at a glance.

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

Order is fixed by the skeleton: group history, dispersion, cheap end, recent performance,
the name that breaks the pattern, the earnings forecast, takeaway. Each heading states its
finding. Each table carries a one-line italic caption under it. The paragraph after each
table says what the table means, in two or three sentences, and does not restate the rows.

The takeaway closes on the open question (usually whether the current earnings level is
sustainable), stated as context, not as a call.

## 7. Self-review before delivery

- Does the H1 name the sub-sector's finding, not a ticker?
- Is the median-vs-weighted dispersion read present, and does it name the two groups that
  create the gap?
- Is the five-year valuation series table there, current year bolded?
- Does the screener table state its market-cap floor in the caption?
- Does the movers section say whether the move was broad or concentrated?
- Does the peer table carry EV/EBITDA and leverage, not just P/E, and are best-in-column
  values bolded?
- Is the growth-forecast section present, tying the forecast back to the trailing multiple?
- Is every "cheap/expensive/best" claim benchmarked against the group median, the group's
  own history, or the name's peer average, never a bare multiple?
- Did any member's garbage ratio survive into the ranking? Re-scan against the bands.
- Is the framing valuation context, not a buy call? No "the one to own," no "clear winner
  to buy" (`../compliance.md`).
- Does every `TICKER` mention (table, chart label, AND inline prose) read bold, linked,
  and ticker-blue (`#9E0142`)? Gains/losses green/red (`#568475`/`#D53E50`)?
  (`../newsletter-format.md`'s Color convention, applies to every issue.)
- Is the Appendix (endpoint/field trace) present, after Sources and before the disclaimer? **Endpoints and field names only**, one bullet per endpoint, with no section
  label, chart name, table name, derivation or usage note attached to any bullet
  (`../newsletter-format.md`'s Appendix section)?
