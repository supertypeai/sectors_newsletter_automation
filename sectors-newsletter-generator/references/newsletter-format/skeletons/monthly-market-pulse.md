# Section skeleton: monthly-market-pulse

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Read this file only for the type you are actually writing.

### Monthly market pulse
An argument evidenced by data, not a data dump with news garnish. Every section is a
trailing-30-day aggregate, never a single day's snapshot; see
`workflows/monthly-market-pulse.md` for exactly how each metric gets aggregated
(most-traded and broker flow have no native range param, so both are summed client-side
from repeated daily calls, the same way every run).

**Section order, fixed issue to issue** (2026-11-01). The rules for each block live in the
workflow's Write the pulse section and the markup in
`../monthly-pulse-components.md`. Titles are copied exactly, never renamed per run. Nothing
sits between a heading and its first table or card, not even a scope line.

1. **Headline**, plain language, no standfirst and no separate index heading.
1b. **At a Glance**, bold lead-in bullets ending on Open Question. Replaces The Read.
1c. **Stat tiles**, four, on the shaded card, each with a context line.
2. **What Moved the Market**, one event card per event with an unlabelled conclusion callout, then
   the **Before, during and after** chart (`eventLines`). Replaces Macro Backdrop.
3. **Top Movers**, gainers left and losers right, then the `moversChart` hero (every row's logo,
   ticker and full value label shown; caption states only what it shows), then the explanation.
   Never a signed single table, and never a note on an excluded name.
4. **Most traded**, whole-window sum, table with Ticker, Company, 30d volume, Close, 30d, then
   the insight paragraphs. Not every window has a clean cause; say so rather than manufacture one.
4b. **Broker Flow**, net buyers left and net sellers right, then who took the other side. Every
   code cell links to `https://sectors.app/idx/broker/<lowercase code>`, same accent treatment
   as a ticker link.
4c. **Names Worth a Closer Look**, three or four cards, one a caution case, closing italic line.
4c2. **The Other Side**, side-by-side bull and bear panels, no reprinted figures.
4d. **What to Watch Next**, compact table, three to five real scheduled events, strictly
   forward-looking. Distinct from the Sectors in-house **Upcoming Events** block, which follows
   the CTA unchanged.
4e. **CTA**, after What to Watch and before Upcoming Events, identical to weekly
   insights v2's CTA (campaign `monthly-market-pulse_<date>`). Never write a per-issue CTA.
   **Fixed copy, verbatim every issue** (locked 2026-09-28; only `{{campaign}}` changes):

   ```md
   ## Keep the signals coming

   Keep these names on your radar: add them to a **watchlist** for our exclusive reports, or set a [workflow](https://sectors.app/workflow?utm_source=newsletter&utm_medium=email&utm_campaign={{campaign}}&utm_content=cta) alert that pings you on the next filing or foreign-flow swing.

   [Set up your watchlist](https://sectors.app/watchlist?utm_source=newsletter&utm_medium=email&utm_campaign={{campaign}}&utm_content=cta)
   ```

   HTML: the tinted `#fbe9d8` panel, heading "Keep the signals coming", same body with
   "workflow" as a magenta link, magenta "Set up your watchlist" button, as in the sample.
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

