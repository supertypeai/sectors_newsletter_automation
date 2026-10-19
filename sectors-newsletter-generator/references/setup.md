# Setup, file map, sibling skills

Split out of `SKILL.md`. Read once per machine, or when extending the skill. No normal
run needs this file.

## Setup

No install needed. Unlike `sectors-carousel` there is no slide-rendering step — the
only dependency is `node` (built-ins only, no npm packages) to run `sectors.mjs`, and
the shared API key already ships in `config.json`. The required hero chart is generated
with this skill's own `scripts/charts.mjs` (import the chart-kind function you need —
`sparkline`/`line` for a price series, `barChart` for year-over-year (pass `financial:
true` for a signed gain/loss series), `donut` for a mix, `moversChart` for a ranked
gainers/losers list with per-row logos, etc. — and write its returned SVG string to a
file, no Puppeteer, no build step). Still
consult the `dataviz` skill first for **which kind of chart fits the data** (its form
heuristic and the "which Sectors field maps to which chart" table in the sibling
carousel skill's `references/charts/INDEX.md` both apply here unchanged); `charts.mjs` is the
render step once that choice is made. This IS the carousel's chart engine, forked for a
light surface rather than avoided: the two skills' geometry and chart-kind grammar now
match, only the color constants differ (see `scripts/charts.mjs`'s header comment for
the validated light-mode role map). Sanity check:

```bash
node scripts/sectors.mjs "idx-total/?start=2026-07-01&end=2026-07-08"
```


## What's in this skill

```
SKILL.md                          you are here
references/
  newsletter-format.md            the Markdown output contract: header metadata,
                                   ticker convention, number formatting, per-type
                                   section skeletons, disclaimer footer
  compliance.md                   hard rules + the advice-reconciliation guidance
  sourcing.md                     web research + citation rules
  upcoming-events-source.md       Google Sheet fetch recipe + selection logic for the
                                   closing-block promo every issue but upcoming-event
                                   carries (Hard rule 10)
  workflows/                      one doc per built issue type (ten)
    weekly-insights-v2.md         the current Monday digest: nine blocks, social-card
                                   findings block, corporate-action week calendar plus
                                   scheduled macro rows, two-sided read before the CTA
    monthly-market-pulse.md       30-day movers/volume/broker-flow recipe, table-first
    macro-reaction.md             macro sourcing + affected-ticker + valuation-context
                                   recipe, non-advice framing
    three-stock-story.md          stock-pick discovery + history/people research +
                                   attributed-forecast recipe
    single-company-deep-dive.md   whole-company breakdown, business/moat/economics/macro
    sector-spotlight.md           one sub-sector peer-comparison on valuation
    new-release-feature.md        user-supplied release note summary + one feature
                                   highlight, no live fetch
    upcoming-event.md             in-house workshop promo, user-supplied event details
    did-you-catch-it.md           FOMO: one screener (dip-then-rally + P/E and ROE vs
                                   sector median + leverage trend), one broadcast piece,
                                   no account data, targeting stays external
    watchlist-performance-digest.md  personalized, per-recipient template; calls the
                                   dbquery skill for audience, ranks tracked
                                   tickers/sectors by 7-day move, top 5, peer
                                   comparison for IDX only
  sectors-api/                    endpoints, data-quality, README (the data layer, v2 —
                                   a synced copy shared with sectors-carousel)
  writing.md                      the newsletter surface: what prose needs on top of the core
  writing/
    core.md, brand-voice.md,      the shared writing rules, generated copies kept identical
    audit.md                      by _shared/writing/sync.mjs. Do not hand-edit.
scripts/
  sectors.mjs                     authenticated Sectors API GET (zero external
                                   dependencies, self-locates its own config; a synced
                                   copy shared with sectors-carousel)
  charts.mjs                      inline-SVG chart generators (bar/line/donut/multiline/
                                   radar/waterfall/table/scatter/heatmap/bump/sankey/
                                   movers/compose), forked from sectors-carousel's own
                                   scripts/charts.mjs for a LIGHT chart surface — same
                                   geometry, own light-safe color constants (see the
                                   file's header comment for the validated role map;
                                   GAIN/LOSS is brand green/red `#568475`/`#D53E50`,
                                   ticker mentions and every other link carry the accent
                                   `#9E0142`, see Hard rule 7)
config.json                       own copy of the shared Sectors API key
                                   (sectorsApiKey); SECTORS_API_KEY env overrides
```

**This skill is fully standalone.** It is shared with the company and runs on machines that
have nothing else from this repo, so everything it needs lives inside it. `scripts/sectors.mjs`,
`config.json` and `references/sectors-api/` are local copies rather than relative-path reuse of
`sectors-carousel`. `references/writing/` holds generated copies of the shared writing rules,
written by `_shared/writing/sync.mjs`; never hand-edit them, edit the canonical files and
re-run the sync. The data-layer copies originate from `sectors-carousel` (the
single source of truth for data discipline) and should be re-synced from there if that skill's copies change; do not fork the content itself, only the file location.

**`sectors-reels`** (the other sibling skill) is a separate Remotion video pipeline with its own
copy of the data-layer references, and it writes to the same shared writing rules this skill
carries. It has no dependency relationship with this skill in either direction.
