# Delivery, full contract

Finished issues land at:

```
~/Desktop/newsletter/newsletter_<YYYY-MM-DD>_<type-slug>/
    newsletter.md
    newsletter.html            every type: the send-ready HTML email
    chart-<slug>.svg           every type except weekly-insights-v2: the hero chart, the file
                                the HTML and the Markdown reference
    chart-<slug>.png           only when the user asks for PNG in that run: the 2x raster,
                                made with scripts/svg2png.mjs
    logo-<ticker>.png          single-company-deep-dive: company logo for the headline,
                                from this skill's assets/logos.json
```

- `<type-slug>` is one of the built slugs: `weekly-insights-v2`, `monthly-market-pulse`,
  `three-stock-story`, `single-company-deep-dive`, `sector-spotlight`, `macro-reaction`,
  `upcoming-event`, `new-release-feature`, `did-you-catch-it`, `watchlist-performance-digest`
  (the earnings review uses the `single-company-deep-dive` slug and also ships `newsletter.pdf`,
  rendered with `scripts/html2pdf.mjs`).
- `<YYYY-MM-DD>` is the issue/send date.
- Any generated chart file lands in this same folder, next to `newsletter.md`, and is
  referenced from it by a relative Markdown image link.
- **Every issue type ships as HTML, and every issue except `weekly-insights-v2` and `sector-spotlight` gets a hero
  chart.** Every built
  type is delivered as a send-ready `newsletter.html` (email-safe inline styles, table
  layout, tickers linked to `sectors.app/idx/<lower>`); the types other than
  `weekly-insights-v2` also carry at least one generated `chart-<slug>.svg`, except `sector-spotlight`, whose
  bars, tiles, cards and flow strips are built in HTML and need no hosted chart. Keep `newsletter.md` as the review draft and ship the `.html`
  alongside it. The worked HTML reference for a type is
  `newsletter/samples/<type-slug>/newsletter.html`; `newsletter-format.md`'s **Color
  convention** owns the shared HTML chrome.
  **`weekly-insights-v2` satisfies the visual requirement with images from posts already
  published on the Sectors Instagram feed, not with a generated `chart-<slug>.svg`.** Once
  the week's findings are derived from the API, run
  `node scripts/social-posts.mjs --from <Mon> --to <Fri>`, which calls the Mailroom API and
  lists each eligible post's `image_urls`, caption and content group; use an `image_urls`
  entry as the `<img src>`. This step is mandatory for this type; do not guess URLs, and do
  not quietly render a chart in its place. Ask the user only if the script fails or returns
  nothing. **There
  is no chart fallback for this type** (confirmed 2026-08-31): if no eligible post
  illustrates a finding, cut the finding and build the block from the posts that exist. A
  generated graph anywhere in a `weekly-insights-v2` issue is a defect, and this type ships
  no `chart-<slug>.svg`. It is also
  the one exception to stage 3's "at most one generated chart per issue": its findings
  block runs one visual per finding, so two or three visuals is correct there.
- Scratch fetches (raw `sectors.mjs --save-dir` JSON) go to the scratchpad or a
  `_draft`/`data` subfolder, not into the delivered folder.
- `newsletter/` is a plain folder, separate from the skills repo and from the
  `st-sectors-carousel` skill's `scs/<ticker>_<slug>/` git repo, no git init needed here.
- **`samples/` lives in this same `newsletter/` folder, not inside the skill.**
  `~/Desktop/newsletter/samples/<type-slug>/` holds one `newsletter.md`
  (+`.html`/chart where applicable) and a `queries.md` per issue type, deliberately kept
  next to the delivered issues rather than under the skill's own `references/` so the
  user can open and edit a type's format/presentation reference directly, without
  digging into skill internals. See **Shared pipeline shape** steps 2 and 4 for when
  this skill reads it, and refresh a type's sample here after any run whose output is
  more current or more refined than what's stored.
