# Newsletter format, the Markdown output contract

The prose equivalent of the carousel skill's `deck-format.md`. Every issue is a single
`.md` file shaped like this, regardless of type.

## Header block (top of the file, before the body)

```markdown
---
subject: <the email subject line>
preview: <the inbox preview/preheader text>
issue_type: weekly-insights-v2 | macro-reaction | three-stock-story | single-company-deep-dive | sector-spotlight | monthly-market-pulse | upcoming-event | new-release-feature | watchlist-performance-digest | did-you-catch-it
date: <YYYY-MM-DD, the issue/send date>
data_as_of: <YYYY-MM-DD, the API's as-of date>
sample_recipient: <watchlist-performance-digest only: a scrubbed placeholder
  identifier for the worked example, never a real email or full name, e.g.
  "sample-row-1">
---
```

- **`subject`**: ≤ ~9 words. States the verdict or hook, not a category. Passes the same
  test as a carousel cover headline — "trades at 12x, near a 5-year low" beats "This
  Week in Banks." No hype, no advice framing (never "3 stocks to buy now"). For
  `watchlist-performance-digest`, the subject itself carries a `{{merge_tag}}` (it's a
  template, not one fixed line), see **Merge-tag convention** below.
- **`preview`**: ~40-90 characters. Re-angles the subject with a second detail; never
  restates it verbatim (the same rule the social skills apply to a caption's first line).
- **`issue_type`**: one of the built workflow slugs, matches the folder/file naming in
  the delivery convention (see SKILL.md).
- **`date`** and **`data_as_of`**: the API "today" lags ~1 day (UTC), so these can differ
  from the actual send date. Always show both.
- **`sample_recipient`**: `watchlist-performance-digest` only, identifies which
  dbquery-supplied audience row the worked example was rendered from, without
  embedding the real identifier (dbquery's `references/supabase-access.md` PII rule
  applies here too, same discipline, this skill has no DB credential of its own but
  still handles the real rows the dbquery skill hands back).

## Merge-tag convention (watchlist-performance-digest only)

Every other issue type in this skill is a single broadcast piece, no merge tags. This
one type is a reusable per-recipient template, borrowing dbquery's convention
wholesale rather than inventing a second one:

- Every per-recipient field is a `{{snake_case_field}}` tag, matching a column the
  dbquery skill's `watchlist-tracked-interest` query actually returns (`{{first_name}}`,
  `{{tickers}}`, `{{sectors}}`) or a value computed at draft time from the live market
  fetch for that recipient's tracked items (ranked table rows, the headline mover).
  Don't invent a tag that doesn't trace to one of those two sources.
- The **worked example** immediately below the template (or in a clearly separated
  "Rendered example" section) shows the same body with every tag resolved against one
  real sample row, proving the template reads right once filled in. Scrub any real
  email/name in that rendering unless the user explicitly wants it kept for their own
  review.
- The market-blended figures (each tracked item's 7-day move, its peer comparison
  where available) are computed at draft time from the live fetch, not stored as
  static merge tags, since they depend on both the dbquery row and the live market
  data at render time. Document that distinction inline in the template so a
  downstream renderer knows which fields it must recompute per recipient at actual
  send time versus which are static from the dbquery row.

## Opening line (first line of the body)

The body opens with an **H1 headline that states the issue's hook**, not a brand
masthead. Same job as the `subject` field, the reader's actual news, phrased as a
heading: `# A weaker rupiah splits banks and coal miners`, never `# Sectors Weekly` or
`# Sectors Midweek`. It can differ in wording from `subject` but never in substance,
they're the same hook said twice. Follow it with a one-sentence standfirst that adds a
second, different detail (the same job the `preview` field does, don't repeat either
verbatim). Data citations anywhere in the body say **`sectors.app`**, never "Sectors
API" or bare "Sectors" (`compliance.md` rule 6).

## Ticker-mention convention (enforce everywhere, no exceptions)

- **Bold, and never `$`-prefixed**: `**BBCA**`. The `$` cashtag is banned outright, see
  `SKILL.md` hard rule 16.
- **Link every ticker mention, every occurrence, every issue type** (tightened
  2026-08-31, applies to all ten types with no exception). Not once per section, not
  first-mention-only: the same ticker appearing nine times across an issue carries nine
  links to `[**BBCA**](https://sectors.app/idx/bbca)`, lowercase ticker, no `.JK`
  suffix, each with that block's own `utm_content` and `utm_term=<ticker>`. A reader
  should be able to click through from wherever they land, and an unlinked mention reads
  as a different kind of object than a linked one four lines above it.
  **Inline prose mentions count too, not just table cells**: a bare `TICKER` typed
  into a paragraph without the bold+link treatment is the single easiest miss, check
  every paragraph, chart label and alt-text line, not just tables. Before shipping, grep
  the HTML for the ticker string itself and confirm every hit sits inside an `<a>`. Grep
  for a literal `$` too: it should return nothing at all.
- Pair with the company's full name at least once per section:
  `Bank Central Asia ([**BBCA**](https://sectors.app/idx/bbca))`.
  **`weekly-insights-v2` overrides this: ticker only, never a company name in parentheses
  and never a company name carrying the ticker, in every block** (2026-08-31). See that
  type's skeleton.
- **No elegant variation.** Don't rotate BBCA → "the lender" → "the banking giant" to
  avoid repetition — reuse the ticker or the company name plainly. This is the same
  AI-tell filter in `./writing/core.md` section 4.
- **SGX tickers**: same bold and link treatment, no `$`, `https://sectors.app/sgx/<lowercase
  bare code>` (no `.SI` suffix), e.g. `https://sectors.app/sgx/d05`. Confirmed
  2026-07-16.
- **Sub-sector/sector mentions** (a sector named as its own subject, not attached to
  one ticker): link `https://sectors.app/indonesia/<slug>`, the same kebab slug
  `subsector/report/{slug}/` uses, e.g. `https://sectors.app/indonesia/banks`.
  Confirmed 2026-07-16.
- **Broker codes**, wherever a broker/flow table or mention appears: link
  `https://sectors.app/idx/broker/<lowercase code>`, e.g.
  `https://sectors.app/idx/broker/ak`. Confirmed 2026-07-16.

## UTM convention (every issue type, every `sectors.app` link)

The authority is `~/.claude/skills/UTM_CONVENTION.md`, the organization-wide standard. Read it
before writing the first link of a draft and check the finished draft against it before
shipping. What follows is the newsletter-specific application of that standard; where the two
ever disagree, `UTM_CONVENTION.md` wins.

Every link to a domain **we own** carries UTM parameters so the CRM can attribute return
visits to the issue and the block that drove them. Five params, always in this order,
always lowercase:

```
?utm_source=newsletter
&utm_medium=email
&utm_campaign=<type-slug>_<YYYY-MM-DD>
&utm_content=<block-slug>
&utm_term=<ticker>            # ticker/broker links only, omit otherwise
```

**The separator is a bare `&`, in both `newsletter.md` and `newsletter.html`, never
`&amp;`** (confirmed 2026-07-24, reversing an earlier version of this doc that called for
`&amp;` in HTML). Every `sectors.app` link in the shipped HTML must carry a raw `&`
between UTM params, exactly as it appears in the `.md` draft, copy-paste identical. Before
shipping any issue's HTML, grep it for `&amp;utm_` and fix every hit, that string should
never appear in a finished `newsletter.html`.

- **`utm_source=newsletter`, `utm_medium=email`** are fixed for everything this skill
  produces. Don't vary them per type.
- **`utm_campaign`** is the issue: the type slug, an underscore, then the issue date, e.g.
  `weekly-insights-v2_2026-07-18`. Underscore between slug and date because the slug already
  contains hyphens; keeping one separator for both makes the boundary unparseable.
- **`utm_content`** is the **block**, not the individual link: `key-data-bites`,
  `top-movers`, `data-unearthed`, `insider-filings`, `headlines`, `whats-ahead`, `cta`,
  `footer`. Block-level is the granularity you actually act on ("nobody clicks the calendar")
  and a unique slug per link would add ~40 distinct values per issue for no decision value.
- **`utm_term`** carries the bare ticker or broker code on links to
  `sectors.app/idx/<ticker>` and `sectors.app/idx/broker/<code>`, so per-name interest is
  still recoverable without inflating `utm_content`. Omit it on every other link.

**No third-party link in the body, any issue type** (2026-08-31). A news citation in
body copy renders as plain `(Source Name, DD Mon YYYY)` text with no `<a>` around it,
and the outbound URL appears **only in the Sources list** at the foot of the issue. The
reason is conversion, not tidiness: a live outbound link mid-issue hands the reader an
exit before they reach the CTA, and every issue type is drafted to keep them reading to
it. The only links allowed in body copy are `sectors.app` links (tickers, sectors,
brokers, calendars, read-more, CTA) and our own Instagram and Threads follow lines, all
of which keep the reader inside our properties. Match each body attribution to its
Sources entry by name and date so the reader can still find the piece.

**Never tag a third-party link.** Citations to Bisnis, Kontan, Kompas and any other outlet
stay clean: our UTMs do nothing in their analytics, and appending tracking to someone else's
URL is both useless and rude. Same for Instagram and Threads — they're our accounts but not
our analytics, and the params are stripped or ignored. Tag `sectors.app` and nothing else.

## Color convention (every issue type, HTML delivery — no per-type exceptions)

One fixed palette, applied identically across every table, every chart, and every
inline prose mention, in every issue this skill delivers. A type-specific color choice
(a different link color, a different accent for "this type's" tickers) is a bug, not a
style variant, this section is the single source of truth, don't re-derive per type:

- **Accent `#9E0142`: every clickable thing, no exceptions.** If it is an `<a>`, it is this
  colour. Ticker links (IDX or SGX), sub-sector/sector links, broker-code links, outbound
  citation links, the footer's `sectors.app` and `@sectorsapp` links, *and* the CTA button's
  background all use this one hex. **Including tickers inside the Top Gainers and Top Losers
  cards**, which previously rendered dark `#1c1c1c` and no longer do; a reader must never have
  to guess whether something is clickable. Verify with a sweep, not by eye: every `<a>` in the
  file should carry `color:#9E0142`, and no anchor should be left to inherit. This replaced an earlier split where links were blue `#3288BD` and the
  button was magenta `#d6336c`; **there is no longer a link/CTA colour distinction**, so any
  rule you find elsewhere reserving this hex "for the button only" is stale, ignore it. The
  button is distinguished by being a filled block with white text, not by hue.
- **CTA button, locked exact values (confirmed 2026-07-20 after two rounds of
  correction, don't re-derive)**: `background:#9E0142;color:#ffffff;font-weight:800;`
  (or `700`, per the file's existing button weight) on an `<a>` styled
  `display:inline-block;padding:...;border-radius:8px;text-decoration:none;`. White
  text is required, not a style choice: black text on this background measures
  ~2.5:1 contrast, well under the 4.5:1 AA floor, while white text measures 8.28:1.
  Never `color:#9E0142` on the button itself (invisible against its own background,
  the original bug), never black text on it either (fails contrast even though it
  reads as bolder). This exact pairing is the only correct one, apply it verbatim
  on every CTA button, every issue type.
- **Gain `#568475`.** Every positive %-move reading, in a table cell or a chart's own
  bar/line/label. This is `scripts/charts.mjs`'s `GAIN` constant.
- **Loss `#D53E50`.** Every negative %-move reading, table or chart. `scripts/charts.mjs`'s
  `LOSS` constant.
- Section headers render in a dark neutral (`#1c1c1c`), never an accent colour.
- **Contrast, measured on the `#fdf7ee` card ground**: `#9E0142` is 7.77:1 and white-on-
  `#9E0142` is 8.28:1, both comfortably AA for body text. `#568475` (3.98:1) and `#D53E50`
  (4.25:1) sit just under the 4.5:1 AA threshold for normal text, so only use them **bold**,
  on a numeric reading, the way every current template does. Do not set a paragraph of running
  copy in either. Both clear the 3:1 non-text mark for chart marks everywhere.
- **A chart showing a signed gain/loss reading must actually render green/red, not
  just cite the right hex in prose.** `scripts/charts.mjs`'s `moversChart` and
  `waterfall` are green/red by construction, no extra flag needed. Plain `barChart` is
  NOT green/red by default for a positive bar (it renders the brand PINK/GOLD
  gradient unless told otherwise) — pass **`financial: true`** whenever `barChart` is
  showing a signed %-move series, or the chart will silently break this convention
  even though the surrounding table is correct. Negative bars always render `LOSS`
  red regardless of the flag.
- This palette is defined once, in `scripts/charts.mjs`'s header comment (`GAIN`,
  `LOSS`, `TICKER` constants) — if a future session needs to change a hex value,
  change it there and this doc follows, don't hand-pick a different value in one
  issue's HTML.

## Header logo (every issue type, HTML delivery, confirmed 2026-07-24)

The top-right corner of the header row is the wide Sectors wordmark, not the small
inline SVG bar mark or a plain "Sectors" text label older samples used, both retired.
One fixed asset, one fixed markup, every issue type:

```html
<img src="https://storage.googleapis.com/sectorsapp-sea/app_assets/sectors_logo_wide.png" alt="Sectors" width="110" height="29" style="display:block;width:110px;height:auto;">
```

- Source PNG is 7363x1945 (ratio ~3.79:1); `width="110" height="29"` keeps that ratio at
  a size that fits the header row's `width="90"`-ish right-hand cell without crowding
  the title on the left.
- Sits inside the same right-aligned `<td>` the old mark/text occupied, no other change
  to the header row's layout.
- Hosted asset, not copied into the issue folder — link directly, same as every other
  externally-hosted image this skill already references (event posters, etc.).

## Prose style (newsletter-specific, overrides the short-declarative instinct)

`./writing/core.md` is medium-neutral and binds here in full. This section adds
what continuous prose needs on top of it. A newsletter issue is read as prose rather than
swiped as fragments, so it asks for sentences that read the way a person actually drafts,
and never a stack of clipped fact statements. Core section 5, the rhythm ban, is the rule
this section leans on hardest.

- **No dash as a connector.** Never use an em dash, an en dash, or a spaced hyphen to
  join two clauses or pivot mid-sentence. Use a comma, a period, or "and"/"but" instead.
  A hyphen inside a compound word or a numeric range (`62-65Mt/yr`, `year-on-year`) is
  not a connector and stays as is. This is the single biggest tell of AI-written copy to
  a human reader. The shared core already bans it
  (`references/writing.md`); this reinforces it for
  running prose, where the temptation is stronger because a longer sentence looks like
  it needs a pause. **This covers every part of the issue, not just prose**: Sources,
  the Appendix, table cells, captions and alt text included (added 2026-08-31, after an
  issue shipped with `&mdash;` separating every Sources entry from its label). Between a
  source link and what it backs, use a colon. In the delivered HTML this means no
  `&mdash;`, no `&ndash;`, and no literal em or en dash character anywhere in the file.
- **No inverted-pair sentence structures.** "not X, but Y", "isn't A, it's B", "A rather
  than B", "less A than B", and their mirrors are banned across every issue type (added
  2026-08-31). They read as manufactured insight and usually retract the sentence's own
  first half. State the positive claim and stop; where a contrast genuinely carries a
  fact, write both sides as plain statements in sequence with no rhetorical pivot.
- **Vary sentence length and structure the way a person drafting on deadline would.**
  Don't reduce every section to a stack of short subject-verb-object statements repeated
  one after another, that reads as repetitive and mechanical, not confident. Let some
  sentences carry two related facts through to their conclusion with a conjunction
  instead of chopping everything into three-word fragments for punch.
- **No negative-parallelism and no manufactured paradox.** Banned: "it's not X, it's Y,"
  "the real story isn't A, it's B," or inventing a rhetorical tension between two numbers
  for effect. If two figures are genuinely in tension (earnings up, price down), state
  what each one is plainly and let the tension be visible on its own; don't build a
  device to announce that a tension exists.
- **No emoji, emoticons, or decorative Unicode glyphs** (arrows, block characters,
  sparkline art) anywhere in the body copy. A trend or comparison is either a Markdown
  table of real numbers or a real generated chart image (see **Bite-sized & visual
  formatting** below), never glyph art standing in for either.

## Bite-sized & visual formatting

The reference bar for this skill is a scannable finance-desk email (short blocks, a
bolded stat you catch mid-skim, a table you can read sideways), not a wall of
paragraphs. This section is additive to **Prose style** above, it doesn't relax the
no-dash/no-AI-tell rules, it constrains *shape*.

- **Short blocks.** Two to four sentences per paragraph. When a paragraph would run
  longer, break it into a bulleted list of stat-first bullets instead, each bullet
  leading with the bolded figure or name it's about: `**IHSG** fell **-2.4% WoW** to
  close at 6,956, now trading just below the 7,000 support level.` Bold the load-bearing
  numbers and tickers inline so a skim catches them without reading every clause.
- **Tables for anything ranked or compared.** Any list of 3 or more comparable items
  (weekly movers, per-ticker valuation comparisons, sector standouts, peer screens)
  renders as a Markdown table, never as sequential prose paragraphs, one per item. Keep
  columns minimal: name/ticker, the one or two numbers that matter, nothing decorative.
  Split gainers and losers into two separate tables rather than one signed column, since
  plain Markdown can't color a cell green or red the way an HTML email can:

  ```markdown
  **Top gainers**

  | Ticker | Price (IDR) | Return WoW |
  |---|---|---|
  | **SMMA** | 15,600 | +12.6% |
  | **APIC** | 1,895 | +18.4% |

  **Top losers**

  | Ticker | Price (IDR) | Return WoW |
  |---|---|---|
  | **DSSA** | 1,615 | -20.1% |
  | **BBCA** | 5,850 | -3.3% |
  ```

  A per-ticker valuation comparison (macro-reaction's core section, once there are 2+
  tickers) uses the same move: a table for the shared metrics (price, P/E vs. peer
  average, ROE, dividend yield) with one row per ticker, then a short paragraph under it
  for whatever doesn't fit a column (analyst coverage detail, a one-off fact).
- **A table dropped inside a tinted/shaded section (any background other than the card's
  own `#fdf7ee`) needs its own background set explicitly**, on the `<table>` and on every
  data `<tr>` (confirmed 2026-07-17, caught from a screenshot: `new-release-feature`'s
  shaded `#f2ede4` Feature Highlight box rendered its ticker table's data rows as a bare
  white patch because neither the nested `<table>` nor its `<tr>`s carried a
  `background`). A `<td>`/`<tr>` with no background isn't reliably transparent in every
  email/browser renderer, don't assume the ancestor's tint shows through. Same applies to
  row-divider colors: a border color picked against the white card (`#eee`) goes
  near-invisible on a tinted section, use the section's own divider tone instead
  (`#e4cdb4` here).
- **One hero chart per issue, required.** Every issue ships at least one generated
  chart, no exceptions by type, matching the standard set by the worked samples in
  `newsletter/samples/<type-slug>/`. Pick the single name or series
  that the section's own argument turns on, not just whichever ticker happens to have
  data. Render it as a real line or bar chart image built from the exact series fetched
  this run, never estimated or redrawn from memory. Static only: this skill stays
  dependency-free by design (no Puppeteer, no Node packages, no R/Python animation
  toolchain installed as a hard requirement), so ship a still image, not a GIF, unless
  the user has explicitly asked to add that toolchain for this run.
  **Use `scripts/charts.mjs`**, this skill's own light-surface fork of the carousel
  skill's chart engine: `import` the function for the kind you need (`sparkline`/`line`
  for a price series, `barChart` for year-over-year, `donut` for a mix, `multiline` for
  self-vs-peer, and so on, the same 13-kind grammar documented in the carousel skill's
  `references/charts/INDEX.md`) and write its returned SVG string to `chart-<slug>.svg`.

  **In the HTML, reference the chart by filename** (`<img src="chart-<slug>.png">`),
  never as an inlined `data:` URI. Email delivery converts each `chart-*.svg` to a
  hosted PNG and repoints the `src` at the returned URL, and it matches on that
  filename; an inlined chart can't be matched to its file when an issue has more than
  one, and would be left as a data URI, which Gmail and Outlook drop. See **Charts in
  the HTML** below. Its
  colors are already fixed and validated to the shared palette above (green
  `#568475` gain, red `#D53E50` loss, accent `#9E0142` ticker, see the file's own header
  comment for the full role map), so don't re-derive a palette per issue, and see this
  doc's own **Color convention** section above for the `financial: true` requirement
  on `barChart`. A hand-rolled inline SVG or `ggplot2` (R) is a fallback only for a
  shape `charts.mjs` doesn't cover (reach for its own `compose` escape hatch first).
  **Still consult the `dataviz` skill for chart-FORM choice** (it loads on its own
  trigger for "any chart," so it fires automatically here too): its form heuristic
  picks *which kind* fits the data before you call `charts.mjs`, and its mark-weight,
  axis-treatment, and endpoint-labeling guidance already matches what `charts.mjs`
  draws, since that's what the fork's geometry was validated against.

  **`charts.mjs` never draws its own background** (every function assumes it's being
  composited onto a surface that already exists, true for the carousel's slide canvas,
  never true for this skill's standalone chart files), so every call MUST be wrapped in
  an explicit opaque rect before it's saved, or the surrounding page/email's own
  background shows through wherever a mark or label happens to sit outside the visible
  content, reading as a transparency bug rather than the missing-background-fill it
  actually is (hit for real on the ADRO deep dive: an endpoint label spilled past the
  canvas edge with no rect there to sit on, and looked exactly like a transparency
  problem until traced to the overflow, see the next paragraph). Always wrap like this
  before writing the file:
  ```js
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const full = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fcfcfb"/>${inner}</svg>`;
  ```
  `#fcfcfb` is the same light chart surface `dataviz`'s palette validates against, keep
  it in sync if that reference value ever changes. `scripts/rasterize.mjs` uses the same
  value as its backdrop, so a chart that skipped the wrap still matches one that didn't.

### Charts in the HTML

The `.md` draft references `chart-<slug>.svg`. **The `.html` references
`chart-<slug>.png`**, by filename, in a plain `<img src>`:

```html
<img src="chart-weekly-insights-v2.png" width="536" alt="<every figure, restated>"
     style="display:block;width:100%;max-width:536px;height:auto;">
```

Three rules, all of which exist because email clients are stricter than browsers:

- **Never inline a chart as a `data:` URI.** Gmail and Outlook block `data:` in
  `<img src>` outright, so the chart silently disappears for most of the list. The
  delivery step also can't match an inlined chart back to its source file when an issue
  carries more than one, and will fail the run rather than guess.
- **Never ship SVG to the inbox.** Gmail and others strip it. `scripts/rasterize.mjs`
  converts each `chart-*.svg` to PNG, and delivery uploads that PNG and rewrites the
  `src` to the returned hosted URL. Keep the `.svg` in the folder as the source of truth;
  it just isn't what gets sent.
- **Size in the `<img>`, not in the chart call.** Render at the chart function's natural
  width and let `width="536"` plus `max-width:100%` scale it down. Squeezing the SVG
  itself (passing a small `w`) shrinks the plot area but not the label text, which is how
  a value label ends up clipped off the canvas edge.

Alt text still carries the full figure set, and every figure is still restated as HTML
text near the image, because a reader with images off must lose nothing.

  **Reserve label margin for a series' endpoint.** A `compose` chart's `dot` mark prints
  its label immediately after the dot with no auto-margin (see the comment at that mark
  in `charts.mjs`): a point placed exactly at the domain's right edge pushes its label
  past the canvas, outside the background rect above, same failure mode. Pad the x
  domain past the last real data point (e.g. `domain: [0, (n-1) + 10]` for a ~56-point
  series) so the endpoint lands with room to spare, and check the label's rightmost
  pixel actually lands under `w` before shipping (font-size × char-count is close enough
  to eyeball, or render and grep the `<text>` element's `x` plus its string length).
  Use a **non-zero-based y-axis** for a price series (padded to the data's own range,
  not from 0): a price chart's job is to show how much it actually moved, and a
  zero-based axis on a large-denomination price flattens real volatility into a
  near-straight line.
  **Placement**: put the chart immediately after the sentence or paragraph it's
  illustrating, never floating between two unrelated points (a chart about banks
  belongs right after the banks paragraph, not sandwiched between a rate-decision
  paragraph and a coal-price paragraph it has nothing to do with).
  **Caption, always.** Every chart gets a one-sentence italic caption directly below the
  image explaining what it shows and why it's in this issue, not just alt text (alt text
  is for accessibility/blocked-images, the caption is for a reader looking right at it):
  ```markdown
  ![BBCA share price over the past 90 days, from IDR 6,575 to IDR 6,200 after a June low near IDR 4,850](chart-bbca-price.png)
  *BBCA is still 31% below its August 2025 high of IDR 8,975 (52-week high, sectors.app), the clearest read on the foreign-outflow pressure described above.*
  ```
  Save the result as `chart-<slug>.png` (or `.svg`) inside the issue folder, next to
  `newsletter.md`. A chart is a supplement, never a replacement: state the same headline
  figure in prose or a table too. When a chart isn't worth the setup for a given issue,
  a well-labeled table is a completely acceptable substitute, this is never a blocking
  step.

## Number formatting

- Rupiah is always `IDR`, never `Rp`, in prose, tables, chart labels, and headers alike.
- **≥1 trillion**: compact, two decimals, `IDR 31.40T`.
- **≥1 billion, <1 trillion**: compact, two decimals, `IDR 689.50B`.
- **≥1 million, <1 billion** (the tier with no clean T/B suffix): thousand-separated
  millions, two decimals, unit spelled out: `IDR 5.85 million`, `IDR 128.10 million`.
- **<1 million**: plain thousand-separated, `IDR 10,150`.
- Percentages as `%`, multiples as `x` (`12x earnings`, not `12×` or `12 times`).
- Every ratio explained in one clause on first use: "ROE, profit earned on shareholder
  money, hit 21%."

## Section headings state the finding, not the slot

The bolded names in the skeleton below (**The trigger**, **The read**, **The numbers**,
**Valuation context**, **What to watch**, ...) name a section's *job*, not literal text
to paste in as an H2. Write every actual heading as a short headline that states this
issue's specific finding for that slot, the same way the H1 states the issue's hook
instead of a masthead. A reader skimming just the headings should be able to
reconstruct the issue's argument without reading the body.

- Bad: `## The trigger` (tells you the role, not what happened).
- Good: `## What happened this week` (still fills the trigger role, names it plainly)
  or, when the finding itself fits in the heading, `## Buyback, then a profit beat`.
- Bad: `## Valuation context` on a section explaining why a screener's headline yield
  figure is misleading.
- Good: `## Peer valuation, and what the yield figure actually means`.

Macro-reaction's section 2 already models this ("Winners and losers" / "Who's exposed" /
"The effects", picked by the issue's actual shape, never left as a generic label); apply
the same instinct to every other slot in every issue type, not just that one section.
Never state a causal or comparative relationship in a heading (or body) that the fetched
data doesn't actually support, if two events are simply concurrent, say they're
concurrent, don't imply one caused the other.

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

## Upcoming events closing block (required on every issue except `upcoming-event` itself, confirmed 2026-07-20)

Every broadcast issue this skill delivers ends with a small promo block for Sectors
workshops, live-fetched from a shared Google Sheet, not user-supplied. This is distinct
from the dedicated `upcoming-event` issue type (a full broadcast built around one event,
user-supplied details): this is a standing closing section every *other* type carries,
sourced automatically. Skip it only on `upcoming-event` itself, that type already is the
event promo, a second one would be redundant.

**Placement**: after the issue's own primary CTA, before **Sources**. Order for every
applicable type becomes: main content blocks → primary CTA → **Upcoming events closing
block** → Sources → Appendix → disclaimer footer. It is the last thing a reader sees
before the technical/legal footer, "at the end of the newsletter" as the standing rule.

**Data source and selection logic** (revised 2026-07-20, supersedes the original
nearest-only rule): see `upcoming-events-source.md` in full, summary here. Fetch the
sheet fresh every run (`curl` the CSV export URL in that doc, don't reuse a cached row
from a prior issue). **Include every row still in the future relative to this issue's
send/data-as-of date, not just the nearest one** — one card per event, ordered soonest
first. Drop only rows that have already passed. If every row has passed, drop the whole
block rather than featuring a stale event.

**Content, both Markdown and HTML** (five fields per event, all from that sheet row,
none invented): the event's `posterUrl` as a banner image, `title` as a bold heading,
`description` as one paragraph, `details` (the sheet's JSON array) rendered as a
labelled list in the array's own order and wording, and a **Register here** button
whose `href` is `eventUrl`, styled exactly like every other CTA button in this skill
(see the **Color convention** section's locked CTA button values, `background:#9E0142;
color:#ffffff`). Repeat this five-field unit once per still-upcoming event under one
shared "Upcoming Events" heading, don't repeat the heading per event.

```markdown
## Upcoming Events

![{event[0].title}]({event[0].posterUrl})

**{event[0].title}**

{event[0].description}

- **{event[0].details[0].key}:** {event[0].details[0].value}
  ...(one line per entry, in sheet order)

[Register here]({event[0].eventUrl})

![{event[1].title}]({event[1].posterUrl})

**{event[1].title}**
  ...(repeat the same five-field unit for every remaining still-upcoming row)
```

HTML delivery uses the same five fields per event inside the shared card layout (a
full-width `<img>` for the banner, a bold `<div>` for the title, a `<p>` for the
description, a labelled block for `details`, and the CTA button using the locked
`background:#9E0142;color:#ffffff` pairing), one card per event stacked under the single
"Upcoming Events" heading, each card its own rounded `#fbe9d8` box. Heading copy
("Upcoming Events") stays fixed, don't vary it issue to issue, the five data fields per
event and the button styling may never vary either.

## Appendix: data sources (required for every issue, after Sources, before the disclaimer)

A technical block listing the endpoints actually used in the issue and the fields taken
from each, one endpoint per bullet. **Endpoints and field names only.** Do not say which
section, table or chart the data backed, and do not explain how it was used; the reader is
tracing provenance, not reading a build log. This is mandatory for every issue type this
skill delivers, not a nice-to-have for a deep dive, even a short type gets one, it just has
fewer bullets:

```markdown
**Appendix: Sectors API endpoints (fields used)**
- `company/report/ADRO.JK/` — `valuation.historical_valuation[]`,
  `financials.historical_eps`, `financials.historical_financial_ratio[]`,
  `dividend.yield_ttm`, `dividend.payout_ratio`, `dividend.historical_dividends`,
  `future.company_growth_forecasts`, `future.analyst_rating_breakdown`
- `daily/ADRO.JK/` — `close`
- `companies/` screener — `total_yield[2025]`
- `company/corporate-actions/ADRO.JK/` — `dividend[]`
```

Wrong, in every case: `— 90-day close price series (hero chart)`, `(P/E, P/B vs peer
average)`, `LQ45 constituents ranked by 2025 dividend yield`, `backed the Broker Flow
tables`. Each names a use, a section or a derivation. Name the field, stop.

Rule 6's ban on raw field paths applies to **body copy**, not here: this section exists
specifically so a reader who's finished the piece can trace any number back to its exact
source, that's a credibility feature for someone in verification mode, not the same
reader following the narrative. Group by endpoint (not one bullet per field) so a
reader sees the shape of the pull, not a flat list; every field named must actually have
backed a claim in this issue, an appendix isn't the place to pad with everything that
happened to get fetched. It never substitutes for the inline `(sectors.app)` citation
those same figures already carry in the body, and it never appears before the Sources
list or ahead of the disclaimer. **Required on every issue, every type** (confirmed
2026-07-16): a short type with one or two endpoint calls still gets a short appendix,
proportional to how much was actually fetched, never skipped for length.

**Keep it short** (confirmed 2026-07-20, tightened 2026-08-17): endpoint and fields only,
no prose explaining what a date range covered, why a param was or wasn't used, how a result
got filtered or aggregated client-side, **or which section of the issue the data fed**. All
of that belongs in `queries.md` during drafting, not in the delivered appendix. Also collapse
enumerations: `company/corporate-actions/<TICKER>/`, not the same path followed by the
forty-plus tickers it was called for, and `filings/?limit=30`, not `?limit=30&offset=0..210`. A bullet like `filings/?limit=30&offset=0..210` — filing dates is
correct; a bullet that goes on to explain `start`/`end` filters on transaction date and
silently drops certain days is not, cut it down to the endpoint and field.

**The Appendix ends at its last endpoint bullet** (added 2026-08-31). The only line allowed
after that list is the one-line `instagram.com/sectorsapp` credit when the issue used social
cards. Nothing else follows: no note on how a figure was aggregated, no description of the
window a call covered, no naming of the block a pull fed, no "pinned query" or
"exchange definition" gloss. If a reader would need that to trust the number, the fix is a
clearer sentence in the body, not a footnote here.

## Standard disclaimer footer (fixed text, appended to every issue)

```markdown
---
*This newsletter is data reporting and market commentary, not investment advice or a
recommendation to buy or sell any security. Figures are from sectors.app as of
{data_as_of} unless otherwise cited. Do your own research.*
```

**HTML delivery (fixed markup, confirmed 2026-07-24), use verbatim on every HTML issue**,
last table row before `</table></body>`, filling only the four placeholders (both
`sectors.app` links share the same UTM string, built per the **UTM parameters** section
above: `utm_source=newsletter&utm_medium=email&utm_campaign={content-slug}_{YYYY-MM-DD}
&utm_content=footer`, no `utm_term`/`utm_author` on a footer link). The Instagram link
stays untagged, per the third-party/own-account-not-our-analytics rule above. Accent
`#9E0142` on every link per the **Color convention** section, no exceptions here either.

```html
<tr><td style="padding:20px 32px 30px 32px;">
    <div style="border-top:1px solid #e4cdb4;padding-top:14px;font-size:11.5px;line-height:1.6;color:#8a8a8a;">
      This newsletter is data reporting and market commentary, not investment advice or a recommendation to buy or sell any security. Figures are from <a href="https://sectors.app?utm_source=newsletter&utm_medium=email&utm_campaign={content-slug}_{YYYY-MM-DD}&utm_content=footer" style="color:#9E0142;">sectors.app</a> as of {data_as_of, e.g. 23 July 2026} unless otherwise cited. Do your own research.<br><br>
      Sectors &nbsp;|&nbsp; <a href="https://sectors.app?utm_source=newsletter&utm_medium=email&utm_campaign={content-slug}_{YYYY-MM-DD}&utm_content=footer" style="color:#9E0142;text-decoration:underline;">sectors.app</a> &nbsp;|&nbsp; <a href="https://www.instagram.com/sectorsapp" style="color:#9E0142;text-decoration:underline;">@sectorsapp</a>
    </div>
  </td></tr>
```

## Length guidance

Newsletter prose, not slide fragments: 400-900 words typical across the whole issue.
Vary sentence and paragraph length; simplify word choice, not cadence (inherit
`./writing/core.md` section 3). **`watchlist-performance-digest` is shorter**,
150-300 words outside the table, it's a personalized digest read in a couple minutes
on a phone, not a full briefing, closer to dbquery's nudge-length norm than this
skill's usual newsletter length.

## Worked micro-example (header + one filled section)

```markdown
---
subject: Foreign investors sold the rally
preview: Banks led the week, but the buyers weren't local.
issue_type: weekly-insights-v2
date: 2026-07-11
data_as_of: 2026-07-10
---

# Foreign investors sold the rally

The IDX composite closed the week up, but the money behind the move came from an
unexpected place.

## The week in one line

The index rose 1.8% this week, its best week since March, but foreign investors were
net sellers of IDR 1.2T over the same five days (sectors.app), and the rally was
carried by domestic buying rather than foreign inflows.

## Index & market

![IDX composite, up 1.8% WoW to close the week at its best level since March](chart-idx-composite.svg)
*The index's five-day path, its best week since March even with foreign investors selling into the strength.*

| | This week | Prior week |
|---|---|---|
| **IDX composite** | +1.8% WoW | -0.6% WoW |
| **LQ45** | +1.2% WoW | -0.9% WoW |

...
```
