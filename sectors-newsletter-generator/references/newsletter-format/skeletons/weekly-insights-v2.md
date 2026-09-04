# Section skeleton: weekly-insights-v2

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Read this file only for the type you are actually writing.

### Weekly Insights v2

The weekly send, and the only weekly type: v1 `weekly-wrap` was retired 2026-08-31, so a
request for "the wrap" routes here. **Nine blocks, info-packed, no long-form reading anywhere.** Full recipe in `workflows/weekly-insights-v2.md`.

**No claim subtitles anywhere in this type** (changed 2026-08-17). Heading, then straight
into the data. Where a block needs an observation, it goes as one short plain line *after*
the table or bullets and says something the rows don't already say ("All five of the week's
biggest gainers sit outside the LQ45."). If the only line available summarizes the rows
above it, write nothing.

Tickers run as bare linked `TICKER`, never `TICKER (Company Name)` and never
`Company Name (TICKER)`, in **every** block including Other Major Headlines (the Headlines
carve-out was removed 2026-08-31). Every occurrence is linked, not only the first per
section: the same ticker mentioned six times carries six links to
`sectors.app/idx/<lower>`, each with that block's `utm_content` and `utm_term=<ticker>`.

**No clickable citation in body copy.** A news source is attributed as plain text,
`(Source Name, DD Mon YYYY)`, and its URL appears only in the Sources list. The only links
in the body are `sectors.app` links and the Instagram/Threads follow line, so nothing sends
the reader off site before the CTA.

No internal method notes reach the reader: no "(exchange definition, `idx_daily_data`)", no
endpoint or query names, no "chart generated this run". Method lives in the appendix only.
No dead-end lines either, a bullet saying nothing is known about something is cut, and if
that leaves a finding empty, the finding goes too.

1. **Masthead + greeting** — issue number, send date, window, data-as-of. Then a bare
   `Good morning!`. No opening hook paragraph, no table of contents.
2. **Key Data Bites** — around 8 facts in a tinted box, each **derived from data**, every
   ticker linked. This is where v1's market-level prose sections survive. **Facts about the
   same subject share one point**: the benchmark line leads with LQ45 and IDX30 returns plus
   breadth, with the best and worst constituents as indented sub-points under it, and the
   foreign-flow line leads with the market-wide net figure and carries the largest net buy
   and net sell beneath it. Nothing here may repeat a Headlines item (see block 6).
3. **Top Weekly Movers** — top gainers and top losers as two side-by-side cards, same as v1.
   Tables only; the ranked-bar chart is not used in this type.
4. **What the Data Unearthed** — the issue's only analysis. Two or three findings, each a
   **join of two sources** (movers × corporate actions, price × foreign flow, volume ×
   filings), each with a heading stating the finding, a social card image, and **three**
   short bullets, four at the outside. Never paragraphs. No restated caveats, no recaps of
   the issue's own structure, no "taken together" closers, no production notes in captions. **The images are existing social cards from the carousel
   pipeline's Google Cloud Storage bucket, supplied by the user, never charts this skill renders**; ask
   for the week's URLs before drafting the block. **There is no chart fallback**: a finding
   with no eligible card is cut, and this type ships no `chart-<slug>.svg` at all. Two images under one heading go side by side; a single
   image runs half width. Closes with a follow-us line (Instagram, Threads).
5. **Insider Filings** — the 5 most recent disclosures as one table: date, holder, ticker,
   buy/sell, shares, stake before → after. Structured fields only, filtered by `timestamp`
   to on-or-before the window's Friday. One short line calling out the standout filing.
6. **Other Major Headlines** — 5 IDX-relevant `news` items, **from news sources**, each with
   a plain-text `(Source Name, DD Mon YYYY)` attribution, never a clickable link; the URL
   lives in Sources. Tickers only, no company names. **No category prefix** on the bullets. Strictly **new factual
   events** that happened inside the window (bank earnings released, a merger rumor, a
   regulatory ruling). Not analysis, not a forward-looking item, not a restatement of a
   Bites line. Closes with a read-more link to `sectors.app/indonesia/news`.
7. **What's Ahead** — a **Mon-Fri week-grid calendar** of corporate actions (stock splits,
   dividend ex-dates, AGMs, rights issues), a "beyond the week" table for anything further
   out, and a third compact **scheduled macro** table (Date, Event, Why it matters) of two
   to four dated prints and policy events: BI RDG, BPS CPI or trade balance, an FOMC
   decision, an index rebalance effective date. Corporate actions are polled from
   `company/corporate-actions/{symbol}/`; the macro rows are sourced and cited, not an API
   pull. Every macro row's "why" names a ticker or sector that already appears in this
   issue; an unmapped row is a wire feed line, cut it. **Strictly forward-looking**: every
   row is a catalyst with a future date (BI Rate decision, MSCI rebalance effective date, an
   ex-date, a scheduled result). No recap of what already happened, and the "Why it matters"
   cell explains the pending decision, not the past print. Closes with the dividend-calendar
   link.
8. **Summary** — macro and structural analysis of what the issue already reported, no new
   fetches. Two short stacked blocks, **The bull read** and **The bear read**, two or three
   bullets each. Every bullet closes on a claim the issue hasn't made yet: what the numbers
   mean for positioning, liquidity, rotation or policy transmission ("capital is rotating
   down the market-cap ladder", "core institutional holdings are bleeding out"). A bullet
   that stops where the earlier block stopped is a restatement, cut it or finish it. Repeat
   an earlier figure **only when the claim needs it** (scale, direction, a reversal); if the
   sentence still lands without the number, leave it out, it reads as padding. Closes with **What to watch next**: one
   line naming the dated event that distinguishes the two reads, normally a block 7 row,
   then two conditional bullets, one per read, each stating the outcome that would validate
   that side. Conditions, never predictions; anything forward-looking is attributed to a
   named source with a date or reframed as an "if".
9. **CTA** — watchlist for exclusive reports, workflow for alerts, in a tinted panel with the
   magenta button. Then appendix and the disclaimer footer.

**Strict division of labour, blocks 2 / 6 / 7 / 8.** This is the type's main failure mode:
the same fact reappearing three times under three headings, which reads as padding.

| Block | Owns | Never does |
| --- | --- | --- |
| 2 Key Data Bites | computed facts, the issue's only place for a raw market-level number | news-sourced facts |
| 6 Other Major Headlines | new factual events from news sources, past tense, cited | analysis, forecasts, restating a Bites number |
| 7 What's Ahead | dated future catalysts only | recapping anything that already happened |
| 8 Summary | macro and structural interpretation of figures already published | repeating an earlier line without adding a new claim |

A fact belongs to exactly one block. When a fact could plausibly sit in two, it goes in the
earliest block that owns it, and the later block either drops it or carries it into a claim
the issue hasn't made yet. An event with a What's Ahead row does not also get a Headlines
bullet. Block 8 introduces no new figure at all; if a bullet needs a number the issue
doesn't already carry, the number belongs in Bites first. This type has
**no** takeaway section (block 8 is a two-sided read, not a verdict), no thesis paragraph
above Key Data Bites, no sector-pulse section and no separate chart-of-the-week; the social
cards in block 4 are the issue's visuals.

