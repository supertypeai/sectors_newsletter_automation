# Setup, file map, sibling skills

Split out of `SKILL.md`. Read once per machine, or when extending the skill. No normal
run needs this file.

## Setup

No install needed for drafting. Unlike `st-sectors-carousel` there is no slide-rendering step. The
only dependency is `node` (built-ins only, no npm packages) to run `sectors.mjs`, plus the API key: set
`SECTORS_API_KEY`, or put `sectorsApiKey` in a local `config.json` (git ignores it). Turning a chart into a
PNG, only on request, needs puppeteer (`npm install puppeteer` once in the skill folder, or an installed
`st-sectors-carousel`; see `scripts/svg2png.mjs`). The required hero chart is generated
with this skill's own `scripts/charts.mjs` (import the chart-kind function you need —
`sparkline`/`line` for a price series, `barChart` for year-over-year (pass `financial:
true` for a signed gain/loss series), `donut` for a mix, `moversChart` for a ranked
gainers/losers list with per-row logos, etc. — and write its returned SVG string to a
file, no Puppeteer, no build step). Still
consult the `dataviz` skill first for **which kind of chart fits the data** (its form
heuristic and the "which Sectors field maps to which chart" table in the
`st-sectors-carousel` skill's `references/charts/INDEX.md`, when that skill is installed, both apply here); `charts.mjs` is the
render step once that choice is made. This IS the carousel's chart engine, forked for a
light surface rather than avoided: the two skills' geometry and chart-kind grammar now
match, only the color constants differ (see `scripts/charts.mjs`'s header comment for
the validated light-mode role map). Sanity check:

```bash
node scripts/sectors.mjs "idx-total/?start=2026-07-01&end=2026-07-08"
```

**Mailroom key, one per member.** `scripts/social-posts.mjs` calls the Mailroom API, and
every member who runs it uses their own key so Mailroom shows who pulled what. Create it in
Mailroom under Settings, API keys, then either export `MAILROOM_API_KEY` or save it as the
only line of `~/.config/sectors/mailroom-key` with `chmod 600`. It never goes in
`config.json` or anywhere in this repo; the shared Sectors API key is the only shared
credential.


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
                                   closing-block promo, shown only when an event is upcoming
                                   (Hard rule 10)
  newsletter-format/html-chrome.md  the shared email markup to copy verbatim: page shell,
                                   header row, event card, Sources, Appendix, footer
  workflows/                      one doc per built issue type (five)
    weekly-insights-v2.md         the current Monday digest: nine blocks, social-card
                                   findings block, corporate-action week calendar plus
                                   scheduled macro rows, two-sided read before the CTA
    monthly-market-pulse.md       30-day event impact, movers, broker flow and closer-look recipe
    three-stock-story.md          stock-pick discovery + history/people research +
                                   attributed-forecast recipe
    single-company-deep-dive.md   whole-company breakdown, business/moat/economics/macro
    sector-spotlight.md           one sub-sector peer-comparison on valuation
  sectors-api/                    endpoints, data-quality, README (the data layer, v2 —
                                   a synced copy shared with st-sectors-carousel)
  writing.md                      the newsletter surface: what prose needs on top of the core
  writing/
    core.md, brand-voice.md,      the shared writing rules, generated copies kept identical
    audit.md                      by `npm run sync` in the skills repo. Do not hand-edit.
scripts/
  sectors.mjs                     authenticated Sectors API GET (zero external
                                   dependencies, self-locates its own config; a synced
                                   copy shared with st-sectors-carousel)
  charts.mjs                      inline-SVG chart generators (bar/line/donut/multiline/
                                   radar/waterfall/table/scatter/heatmap/bump/sankey/
                                   movers/compose), forked from st-sectors-carousel's own
                                   scripts/charts.mjs for a LIGHT chart surface — same
                                   geometry, own light-safe color constants (see the
                                   file's header comment for the validated role map;
                                   GAIN/LOSS is brand green/red `#568475`/`#D53E50`,
                                   ticker mentions and every other link carry the accent
                                   `#9E0142`, see Hard rule 7)
config.json                       optional local file, not in git: {"sectorsApiKey": ...}.
                                   The SECTORS_API_KEY env var is the other way to set it
```

**This skill is fully standalone.** It is shared with the company and runs on machines that
have nothing else from this repo, so everything it needs lives inside it. `scripts/sectors.mjs`
and `references/sectors-api/` are local copies rather than relative-path reuse of
`st-sectors-carousel`. `assets/logos.json` is a copy of the carousel's logo map, used for the deep dive's company logo. `references/writing/` holds generated copies of the shared writing rules,
written by `npm run sync` in the supertypeai/skills repo; never hand-edit them, edit
`sources/sectors/writing/` there and re-run the sync. The data-layer copies originate from `st-sectors-carousel` (the
single source of truth for data discipline) and should be re-synced from there if that skill's copies change; do not fork the content itself, only the file location.

