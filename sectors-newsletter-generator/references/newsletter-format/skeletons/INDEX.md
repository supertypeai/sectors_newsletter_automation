# Section skeletons (index)

## Section skeleton per issue type

**Every type below ships as a send-ready HTML email (`newsletter.html`), not just
Markdown**, colored +/- cells, tables, CTA buttons and the hero chart don't survive
plain Markdown the same way, and the point is a self-contained, data-backed email with
no PDF attachment. Keep `newsletter.md` as the review draft; ship the `.html` alongside
it, for all ten types. See
`newsletter/samples/<type-slug>/newsletter.html` for each type's own worked HTML
reference.

**Weekly Insights v2 is the weekly send.** The v1 `weekly-wrap` type was retired
2026-08-31: its workflow doc, skeleton and sample are deleted, and a request for "the
Saturday wrap" or "weekly wrap" now routes to `weekly-insights-v2` on its Monday send
date. Full recipe in `workflows/weekly-insights-v2.md`; the shared HTML chrome lives in
this file's **Color convention** section.

## Pick one skeleton

Read `references/newsletter-format/skeletons/<slug>.md`, that file only, for the issue type this run is writing. Never read all ten.

| issue type | skeleton file |
|---|---|
| Weekly Insights v2 | `skeletons/weekly-insights-v2.md` |
| Macro-reaction | `skeletons/macro-reaction.md` |
| Three-stock story | `skeletons/three-stock-story.md` |
| Single company deep dive | `skeletons/single-company-deep-dive.md` |
| Sector spotlight | `skeletons/sector-spotlight.md` |
| Monthly market pulse | `skeletons/monthly-market-pulse.md` |
| Did you catch it | `skeletons/did-you-catch-it.md` |
| Upcoming event | `skeletons/upcoming-event.md` |
| New release feature | `skeletons/new-release-feature.md` |
| Watchlist/sector performance digest | `skeletons/watchlist-performance-digest.md` |
