# Section skeleton: monthly-market-pulse

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Read this file only for the type you are actually writing.

### Monthly market pulse
An argument evidenced by data, not a data dump with news garnish. Every section is a
trailing-30-day aggregate, never a single day's snapshot; see
`workflows/monthly-market-pulse.md` for exactly how each metric gets aggregated
(most-traded and broker flow have no native range param, so both are summed client-side
from repeated daily calls, the same way every run).

**Claim subtitles.** Every section heading below keeps its existing name (`## Top
Movers`, `## Most traded`, `## Broker Flow`, ...) and gains one **italic
single-sentence subtitle directly under the heading** stating that section's claim. The
heading names the data; the subtitle names the argument. Never rename a heading into a
claim.

1. **Headline + trend paragraph, no separate "index in one line" heading.** The H1
   states this run's own actual finding (drafted fresh each run from that run's
   `idx-total` trend, a template headline is never reused verbatim run to run), and the
   standfirst paragraph immediately under it carries the index's own 30-day move,
   start/end values and any notable trough/peak in the window. This replaces what used
   to be a separate "Index in one line" section, the same data now opens the issue
   instead of repeating it under its own heading.
1b. **The month in four numbers** — a four-tile stat row under the trend paragraph:
   index cap move, the window's single largest mover, the aggregate net of the dominant
   broker side, and one macro anchor (rate level, rupiah move, or the commodity that
   mattered). Number plus one-line label per tile, nothing else. Every tile's figure
   must also appear somewhere else in the issue.
1c. **The Read** — two to four sentences carrying the issue's single thesis, stated
   as a falsifiable claim, before any table, defended by every section that follows.
2. **Top Movers** — one heading, two small tables underneath (top gainers, top losers
   over the 30-day window, never a signed column), plus the issue's hero chart: a
   diverging bar per ticker (green gain / red loss, off a shared zero line) with every
   row's logo, ticker and full value label shown, not thinned to a handful. See
   `scripts/charts.mjs`'s `moversChart` (built for exactly this shape; `barChart`'s
   own label-thinning past 6 bars and lack of per-row logos don't fit a full movers
   list). Chart caption states only what the chart shows (the tickers, the ranking,
   the window), no interpretive commentary, that belongs in the surrounding prose.
3. **Most traded** — ranked by total volume summed across the whole window, not one
   day's top-N; a short table (ticker, company, 30d volume, price), **followed by a
   short paragraph** naming one ticker from the list and its real, dated, cited reason
   for trading heavily all month (an analyst call, a foreign-flow story, a sector policy
   note). Not every window has a clean answer; say so rather than manufacturing one.
4. **Broker Flow** — tabular, not a prose line: a top-net-buyers table and a
   top-net-sellers table, columns broker code, broker name, 30d net, ranked by
   aggregate net value across the window, **followed by a short paragraph** observing
   the actual shape of the flow and any real, dated news that plausibly relates, cited
   and stated as concurrent, never asserted as the proven cause. **Broker code links**
   (confirmed 2026-07-16): `https://sectors.app/idx/broker/<lowercase code>`, e.g.
   `https://sectors.app/idx/broker/ak`, same bold accent (`#9E0142`) ticker treatment as
   a ticker link, every code cell in both tables gets one.
4b. **Macro Backdrop** — after Broker Flow. Three to five macro items (BI rate, rupiah,
   foreign flow, bond yields, global rates, IDX-relevant commodities, domestic prints,
   policy/market-structure changes), each dated and cited, and each **mapped to names or
   sectors that appear in this issue's own tables**. Unmapped macro items are cut; this
   is not a general macro digest. Causal language follows the workflow's causation
   policy: name the mechanism, label its status, attribute anything forward-looking.
4c. **The Other Side** — pure macro and structural analysis, **The bull read** and **The
   bear read**, three to four bullets each, every bullet grounded in a number or citation
   already in this issue but referring to it **conceptually**, never reprinting a figure
   the reader already saw. Each bullet joins two reported things or frames one
   structurally, rather than restating a single earlier line. Then one
   **What would settle it** line naming the specific dated print or event that
   distinguishes them. Forward-looking bullets are quoted-and-attributed or reframed as
   conditions ("if X prints above Y"), never the newsletter's own prediction.
4d. **What to Watch, next 30 days** — compact table, columns Window / Event / Why it
   matters, three to five rows, every row a real scheduled event (BI RDG, BPS release,
   earnings window, index rebalance, cum-date) tied back to a name or sector in this
   issue. Strictly forward-looking: the "why" explains the pending catalyst, never
   recaps what already happened. Distinct from the Sectors in-house **Upcoming Events** block, which follows it
   unchanged.
5. **Appendix: Sectors API endpoints (fields used)**, after Sources and before the
   disclaimer. Always included for this type (see the generic Appendix section below
   for the format; this type doesn't treat it as optional the way a tight daily issue
   would, five distinct endpoints and real client-side aggregation sit behind every
   run, exactly what a reader might want to trace).
6. Disclaimer footer (Sources whenever either paragraph above cites something web-sourced).

Color and ticker convention for this type's HTML delivery: every ticker mention
renders in the shared ticker accent (`scripts/charts.mjs`'s `TICKER`, `#9E0142`), and
every gain/loss reading renders in the shared brand green/red (`GAIN` `#568475` /
`LOSS` `#D53E50`), consistently across every table, the chart, AND any inline prose
mention (a bare `TICKER` in a paragraph, not just table cells and bar labels, is the
easy miss, the same bold linked accent treatment applies there too, see the **Ticker-mention
convention** section above).

