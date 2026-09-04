# Setup, file map, sibling skills

Split out of `SKILL.md`. Read once per machine, or when extending the skill. No normal
run needs this file.

## Setup

No install needed for a Markdown-only draft: `node` built-ins only, no npm packages,
and the API key is `export SECTORS_API_KEY=<key>` (no key ships in the repo; a local
`config.json`, copied from `config.example.json`, is an optional gitignored fallback if
you prefer a file over the env var). **`scripts/rasterize.mjs` is the one exception** —
it needs Puppeteer (`npm install` in this folder, once per machine) to turn a generated
chart's SVG into the PNG email clients can actually display; skip it if you only want the
`.md`, you need it for any issue you intend to send. The required hero chart is generated
with this skill's own `scripts/charts.mjs` (import the chart-kind function you need —
`sparkline`/`line` for a price series, `barChart` for year-over-year (pass `financial:
true` for a signed gain/loss series), `donut` for a mix, `moversChart` for a ranked
gainers/losers list with per-row logos, etc. — and write its returned SVG string to a
file). Still consult the `dataviz` skill first for **which kind of chart fits the data**
(its form heuristic and the "which Sectors field maps to which chart" table in the
sibling carousel skill's `references/charts/INDEX.md` both apply here unchanged);
`charts.mjs` is the render step once that choice is made. This IS the carousel's chart
engine, forked for a light surface rather than avoided: the two skills' geometry and
chart-kind grammar now match, only the color constants differ (see `scripts/charts.mjs`'s
header comment for the validated light-mode role map). **`moversChart`'s per-row logos
come from `../market-story-video/assets/logos.json`** (957 IDX tickers, keyed by bare
symbol, raw base64 PNG); a row given no `logoBase64` renders no image without
complaining, so pass them explicitly or the chart silently ships bare. Sanity check:

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
  newsletter-format/skeletons/    one section-order skeleton per built issue type
  compliance.md                   hard rules + the advice-reconciliation guidance
  sourcing.md                     web research + citation rules
  scope.md                        not-yet-built types, out-of-scope types
  type-briefs.md                  one-paragraph brief per issue type
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
    single-company-deep-dive.md   trigger-anchored one-stock read, earnings/action/owner
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
    core.md, brand-voice.md,      the shared writing rules, static reference copies (see
    audit.md                      each file's own header for the canonical source)
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
  rasterize.mjs                   local-only: Puppeteer-based SVG-to-PNG conversion for
                                   the required hero chart, since Gmail and Outlook strip
                                   inline SVG (see **Setup** above)
  fixed-queries/                  Supabase MCP connector SQL for a market-wide range
                                   query no Sectors API endpoint covers (broker summary,
                                   foreign flow), run read-only through the connector
config.example.json                template for the optional local key file;
                                   SECTORS_API_KEY env is the primary source. Copy to
                                   config.json (gitignored) and fill in only if you
                                   prefer a file to the env var — never commit a real key
```

**This skill is self-contained**: `scripts/sectors.mjs`,
`references/sectors-api/`, and `references/writing/{core,brand-voice,audit}.md` are local
copies, not relative-path reuse of `sectors-carousel` — this skill runs standalone even
if `sectors-carousel` isn't installed. They originate from `sectors-carousel` (the
single source of truth for voice and data discipline) and should be re-synced from
there if that skill's copies change; don't fork the content itself, only the file
location.

**`market-story-video`** (the other sibling skill) is a separate, fully self-contained
Remotion video pipeline with its own copies of the same brand/voice/data-layer
references. It has no dependency relationship with this skill in either direction.
