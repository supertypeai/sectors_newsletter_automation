# Newsletter format, the Markdown output contract

The prose equivalent of the carousel skill's `deck-format.md`. Every issue is a single
`.md` file shaped like this, regardless of type.

## Header block (top of the file, before the body)

```markdown
---
subject: <the email subject line>
preview: <the inbox preview/preheader text>
issue_type: weekly-insights-v2 | weekly-wrap | macro-reaction | three-stock-story | single-company-deep-dive | sector-spotlight | monthly-market-pulse | upcoming-event | new-release-feature | watchlist-performance-digest
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
  restates it verbatim (same rule as the carousel caption's first line).
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

- **Bold, `$`-prefixed on first mention per section**: `**$BBCA**`.
- **Link every bolded ticker mention** to its sectors.app profile:
  `[**$BBCA**](https://sectors.app/idx/bbca)`, lowercase ticker, no `.JK` suffix. This
  applies everywhere the ticker is bolded (first mention and any table cell), not just
  once per section, a reader should be able to click through from wherever they land.
  **Inline prose mentions count too, not just table cells** — a bare `$TICKER` typed
  into a paragraph without the bold+link treatment is the single easiest miss, check
  every paragraph, not just tables and chart labels.
- Pair with the company's full name at least once per section:
  `Bank Central Asia ([**$BBCA**](https://sectors.app/idx/bbca))`.
- **No elegant variation.** Don't rotate BBCA → "the lender" → "the banking giant" to
  avoid repetition — reuse the ticker or the company name plainly. This is the same
  AI-tell filter the carousel skill's `writing.md` applies to slide copy.
- **SGX tickers**: same bold/`$`/link treatment, `https://sectors.app/sgx/<lowercase
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

In HTML the separator is `&amp;`, not a bare `&` — an unescaped ampersand in an `href` is
invalid markup and some clients mangle the tail of the URL. In the `.md` draft it's a plain
`&`.

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

## Prose style (newsletter-specific, overrides the carousel's short-declarative slide voice)

The carousel skill's voice guide is written for slide copy, where the goal is a short
declarative a swiper can read in one glance. A newsletter issue is read as continuous
prose, not swiped as fragments, so this issue type asks for the opposite instinct in one
respect: sentences that read the way a person actually drafts, not a stack of clipped
fact statements.

- **No dash as a connector.** Never use an em dash, an en dash, or a spaced hyphen to
  join two clauses or pivot mid-sentence. Use a comma, a period, or "and"/"but" instead.
  A hyphen inside a compound word or a numeric range (`62-65Mt/yr`, `year-on-year`) is
  not a connector and stays as is. This is the single biggest tell of AI-written copy to
  a human reader. The carousel's own AI-tell filter already bans it for slide copy
  (`writing/writing.md`); this reinforces it for
  running prose, where the temptation is stronger because a longer sentence looks like
  it needs a pause.
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
  | **$SMMA** | 15,600 | +12.6% |
  | **$APIC** | 1,895 | +18.4% |

  **Top losers**

  | Ticker | Price (IDR) | Return WoW |
  |---|---|---|
  | **$DSSA** | 1,615 | -20.1% |
  | **$BBCA** | 5,850 | -3.3% |
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
  `references/charts.md`) and write its returned SVG string to `chart-<slug>.svg`. Its
  colors are already fixed and validated to the shared palette above (green
  `#568475` gain, red `#D53E50` loss, blue `#9E0142` ticker, see the file's own header
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
  it in sync if that reference value ever changes.

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
it, for all ten types, not only weekly-wrap and upcoming-event. See
`newsletter/samples/<type-slug>/newsletter.html` for each type's own worked HTML
reference.

**Weekly Insights v2 supersedes Weekly wrap.** Both skeletons are listed while the
migration finishes; pick v2 for a Monday send unless the user names v1. The full
"Sectors Weekly Insights" digest below is weekly-wrap's own skeleton, its
two-column mover cards and event banner are specific to that type's layout. Full recipe
(API source per section, HTML delivery notes) in `workflows/weekly-wrap.md` §2b–2c.

1. **IDX Total Market Cap** — the headline stat (`idx-total` level) with a 3-up snapshot:
   7d (label it "rolling") / 30d / YTD.
2. One-paragraph **the week in one line** — the conclusion, stated first.
3. **Index & market** — IDX total mcap / LQ45 / IDX30 moves as a **this-week vs
   prior-week** table (fetch the prior Mon-Fri for the compare column). Good candidate for
   the issue's one hero chart (the index's daily path over the week).
4. **Weekly Top Movers** — top gainers and top losers as **two side-by-side cards/tables**
   (in HTML; two Markdown tables in the `.md` draft), never one signed column. Mind the
   `top-changes` live-window gotcha in the workflow doc: label movers with the window they
   belong to.
5. **What actually traded** — `most-traded` volume leaders and the featured name's foreign
   flow (a domestic-churn vs foreign-inflow read), short prose.
6. **Sector pulse** — which sub-sectors led/lagged, valuation + 1-week change
   (`subsector/report/{slug}/`). Optional; a table once there are 3+ to compare.
7. **New Filings** — the 5 most recent insider / major-holder disclosures (`filings`) as a
   table: date, holder → ticker, buy/sell, change, post-owned. Structured fields only.
8. **New IPOs** — this week's listings with **first-day change** (`daily[0].close` vs
   offering price) and market cap, as a table, each ticker linked to its report page.
9. **Headlines** — 5 recent IDX-relevant `news` items (title + short body + source link);
   drop off-topic non-IDX stories. Note there is **no 0-100 news score** in the API; rank
   by recency + relevance.
10. **Upcoming Events** — the standard closing block, see **Upcoming events closing
    block** below, not this type's own thing.
11. **The takeaway** — the non-obvious so-what, not a restatement of section 2 — then a
    CTA back to `sectors.app`, **Sources** list (if any web-sourced "why" was used), and
    the disclaimer footer.

### Weekly Insights v2

The successor to Weekly wrap, and the one to reach for on a Monday send unless the user
asks for v1 by name. **Eight blocks, info-packed, no long-form reading anywhere.** Full
recipe in `workflows/weekly-insights-v2.md`.

1. **Masthead + greeting** — issue number, send date, window, data-as-of. Then a bare
   `Good morning!`. No opening hook paragraph, no table of contents.
2. **Key Data Bites** — 8 one-line facts in a tinted box, each **derived from data**, every
   ticker linked. This is where v1's market-level prose sections survive, one line each.
   Nothing here may repeat a Headlines item (see block 6).
3. **Top Weekly Movers** — top gainers and top losers as two side-by-side cards, same as v1.
   Tables only; the ranked-bar chart is not used in this type.
4. **What the Data Unearthed** — the issue's only analysis. Two or three findings, each a
   **join of two sources** (movers × corporate actions, price × foreign flow, volume ×
   filings), each with a heading stating the finding, a social card image, and 3-5 short
   bullets. Never paragraphs. Two images under one heading go side by side; a single image
   runs half width. Closes with a follow-us line (Instagram, Threads).
5. **Insider Filings** — the 5 most recent disclosures as one table: date, holder, ticker,
   buy/sell, shares, stake before → after. Structured fields only, filtered by `timestamp`
   to on-or-before the window's Friday. One short line calling out the standout filing.
6. **Other Major Headlines** — 5 IDX-relevant `news` items, **from news sources**, each with
   an outbound citation. **No category prefix** on the bullets. Closes with a read-more link
   to `sectors.app/indonesia/news`.
7. **What's Ahead** — a **Mon-Fri week-grid calendar** of corporate actions (stock splits,
   dividend ex-dates, AGMs, rights issues) plus a "beyond the week" table for anything
   further out. Built by polling `company/corporate-actions/{symbol}/` across a ticker list.
   Closes with the dividend-calendar link.
8. **CTA** — watchlist for exclusive reports, workflow for alerts, in a tinted panel with the
   magenta button. Then appendix and the disclaimer footer.

Blocks 2 and 6 must not overlap: computed facts in Bites, news-sourced facts in Headlines,
never the same fact twice. This type has **no** takeaway section, no sector-pulse section and
no separate chart-of-the-week; the social cards in block 4 are the issue's visuals.

### Macro-reaction
1. **The news** — what happened in the last ~2 days, cited. Bulleted, stat-first
   bullets once there's more than one discrete fact.
2. **Section heading, pick one that fits the issue's actual shape**: "Winners and
   losers" when the story genuinely splits into two opposing sides (the default, most
   concrete of the three), "Who's exposed" when it's one-directional (everyone affected
   loses or gains together), "The effects" as the plain fallback when neither fits.
   Whichever heading, the content is the same: sectors/tickers likely affected and the
   stated mechanism (a claim made openly, not a hidden assumption).
3. Per-ticker **valuation & fundamentals context** — cheap/expensive vs. own history and
   peers, real fundamentals, disclosed consensus if any (see `compliance.md`). Once
   there are 2+ tickers, lead with a **comparison table** (price, P/E vs. peer average,
   ROE, dividend yield), then a short paragraph per ticker for whatever doesn't fit a
   column.
4. **What to watch** — objective, non-prescriptive close (an upcoming print, an
   ex-dividend date, a macro catalyst).
5. **Sources** list + disclaimer footer.

### Three-stock story
1. Short framing — the thread linking the three picks (a sector, a group, a theme), or
   an honest note that there isn't one and each stands on its own reason.
2. Three **per-stock sections**, each with four sub-parts:
   - *The story* — history + a genuine fun fact, cited.
   - *The people* — founders, major holders, key executives likely to steer it (API +
     cited web).
   - *The numbers* — real fundamentals from the Sectors API, as a small table when it's
     comparing the same metrics across all three picks.
   - *The outlook* — attributed forward statements only (`compliance.md`).
3. Closing line.
4. **Sources** list + disclaimer footer.

### Single company deep dive
1. **The trigger** — one paragraph, the real recent event (earnings, corporate action,
   ownership change) that makes this issue timely. Cited.
2. **The read** — the one-line verdict, benchmarked (beat/missed vs what, cheap/dear vs
   what). Stated before the detail that proves it.
3. **The numbers** — the fundamentals that carry the read, as a small table when several
   metrics or periods compare (revenue/earnings by year or quarter, ROE, margins). Good
   candidate for the hero chart (price over 90 days with the trigger marked, or an
   earnings bar series).
4. **Valuation context** — P/E vs the name's own history and the peer average, dividend
   yield if relevant. Reported as context, never as a buy/sell call.
5. **What to watch** — objective, non-prescriptive close (next print, ex-dividend date).
6. **Sources** list + disclaimer footer.

### Sector spotlight
1. **The hook** — one paragraph, why this sector now (led/lagged the week, a macro
   repricing, earnings season). Cited.
2. **The group** — the sub-sector's own read: median P/E and 1w/ytd cap move
   (`subsector/report`), the benchmark every pick is measured against.
3. **The comparison** — a **Markdown table**, one row per pick, columns = the shared
   metrics that matter for this sector (price, P/E vs group median, ROE, dividend yield),
   then a short paragraph per pick for what doesn't fit a column. State the metric being
   ranked on.
4. **The takeaway** — valuation context, not a recommendation ("cheap vs its own history"
   never "the one to buy").
5. **Sources** list + disclaimer footer.

### Monthly market pulse
Tightest type, tables first. Every section is a trailing-30-day aggregate, never a
single day's snapshot; see `workflows/monthly-market-pulse.md` for exactly how each
metric gets aggregated (most-traded and broker flow have no native range param, so both
are summed client-side from repeated daily calls, the same way every run).
1. **Headline + trend paragraph, no separate "index in one line" heading.** The H1
   states this run's own actual finding (drafted fresh each run from that run's
   `idx-total` trend, a template headline is never reused verbatim run to run), and the
   standfirst paragraph immediately under it carries the index's own 30-day move,
   start/end values and any notable trough/peak in the window. This replaces what used
   to be a separate "Index in one line" section, the same data now opens the issue
   instead of repeating it under its own heading.
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
   `https://sectors.app/idx/broker/ak`, same bold ticker-blue (`#9E0142`) treatment as
   a ticker link, every code cell in both tables gets one.
5. **Appendix: Sectors API endpoints (fields used)**, after Sources and before the
   disclaimer. Always included for this type (see the generic Appendix section below
   for the format; this type doesn't treat it as optional the way a tight daily issue
   would, five distinct endpoints and real client-side aggregation sit behind every
   run, exactly what a reader might want to trace).
6. Disclaimer footer (Sources whenever either paragraph above cites something web-sourced).

Color and ticker convention for this type's HTML delivery: every ticker mention
renders in the shared ticker blue (`scripts/charts.mjs`'s `TICKER`, `#9E0142`), and
every gain/loss reading renders in the shared brand green/red (`GAIN` `#568475` /
`LOSS` `#D53E50`), consistently across every table, the chart, AND any inline prose
mention (a bare `$TICKER` in a paragraph, not just table cells and bar labels, is the
easy miss, same bold-linked-blue treatment applies there too, see the **Ticker-mention
convention** section above).

### Upcoming event
Promo for a Sectors in-house workshop. Content is **user-supplied** (date/venue, agenda,
speaker, registration link, banner), not market data. Ask for all four detail sets first
(workflow doc), never invent them. **Ships as both `newsletter.md` and `newsletter.html`**
(the send-ready email), see `workflows/upcoming-event.md` §4.
1. **Hook headline** — what the participant walks away able to do + the most compelling
   logistical fact (named speaker, hard date, "hands-on, live data").
2. **Banner** — the user's marketing image right after the headline, one-line caption.
3. **Essentials block/small table** — date/time (with timezone), venue/format, who it's
   for. Catchable in one glance. CTA repeated right after this block.
4. **What you walk away with** — a short bold-lead bullet list (4-5 items, no more), each
   bullet opening with the benefit stated as an outcome, not the agenda feature, one
   mechanism sentence after it. Write this section like a CxO deciding whether to expense
   the ticket: time saved, an informational edge, no-technical-background achievability,
   instructor credibility. **No emoji as bullet markers, and no table** for this section,
   the essentials block and any data-teaser table already spend this issue's table
   budget, a third one reads as spreadsheet fatigue in a short promo email. Full
   guidance and the worked example in `workflows/upcoming-event.md`.
5. **Optional short numbered "how we get there" list** — 3-5 items, only if the agenda
   naturally chunks into stages, kept separate from and below the benefit list above so
   it shows sequence without diluting the benefit-first framing.
6. **Optional data teaser** — one real band-checked `sectors.mjs` result showing what
   participants will build (cited `sectors.app`), skip if the agenda speaks for itself.
7. **Speaker(s)** — name + role, a short credibility note works better than a full bio
   dump.
8. **CTA** — the registration link, plainly stated, repeated once near the close (three
   total touches across the issue: hook, essentials, sign-off).
9. Disclaimer footer (Sources only if a data teaser was used). No market-advice framing.

### New release feature
Product enablement, not market analysis. Source is a user-supplied release note (PDF
or Markdown), not a live fetch and not the market API, see
`references/workflows/new-release-feature.md` step 1. Exactly two body sections, ask
for the release note and the feature to highlight before drafting either. **The subject
line, preview text, and headline are about the release only** — never mention the
highlighted feature there, it isn't the issue's hook, it's an add-on beneath it.
1. **Release summary — the issue itself.** H1 headed with a **"Latest Release"** label
   (eyebrow tag in HTML, inline colon-joined in Markdown, e.g. "Latest Release: The
   Straits (3.7.0)"), the same pattern section 2's "Feature Highlight" label uses. A
   brief, sentence-or-two-per-highlight recap of what shipped, pulled only from the
   release note's own Highlights section
   (Sectors release notes tend to run three of these). Omit an Announcement section
   (community events, upcoming workshops) or an Improvements/deprecations section
   entirely if the note has them, those are housekeeping, not release headlines. Not
   an exhaustive changelog, the shape of the release, not every sub-bullet. Closes with
   a **Read more** button linking to the release note's own URL.
2. **Feature highlight — a secondary marketing/education section.** Headed with a
   **"Feature Highlight"** label (an eyebrow tag over a specific title), reads as a
   bonus aside beneath the release summary, not a second headline competing with it.
   One feature, in depth (may not be the release's own headline item, whichever the
   user asked to highlight): what it does, how to use it (steps, where it lives, plan
   tier if gated), and, if it produces data, one real example (a table or figure
   already published in the release note counts, cite it `sectors.app`). **A generated
   chart is not the default here**, a table is usually enough, add one only if it
   carries a takeaway the table doesn't already show. Closes with the CTA: **"Try the
   feature now"** linking to the
   feature's own URL if the user supplied one, otherwise **"Try it yourself now!"**
   linking to `sectors.app`.
3. **Sources** — the release note (title, version if it has one, publish date, link) +
   disclaimer footer.

### Watchlist/sector performance digest
Personalized, per-recipient template, not a broadcast piece. Same structure for every
recipient, only the values (and which tickers/sectors appear) change per
`{{merge_tag}}`.
1. **Greeting + the headline mover** — `{{first_name}}`, then the single biggest
   7-day mover among that recipient's tracked tickers/sectors (by absolute move,
   regardless of where it lands in the table below), stated as fact with a benchmark
   (vs. the IDX composite for an IDX name, vs. its own recent history for an SGX name
   where the composite isn't a fair comparison), same no-bare-percentage rule as every
   other type here.
2. **The ranked table** — up to 5 of the recipient's tracked tickers/sectors. Columns:
   name, **Exchange** (`IDX` or `SGX`, its own column, always shown), 7-day move, one
   peer-comparison figure. **Row order: group by exchange first (IDX rows before SGX,
   alphabetical by country, Indonesia before Singapore), then by 7-day move descending
   within each group** — this is display order, independent of which row is the
   headline mover in step 1, the headline is chosen by absolute significance, the
   table is ordered by exchange then signed move.
   - **Peer comparison column**: P/E vs. peer average for an IDX ticker with peer
     data (`company/report?sections=peers`). For a row where it isn't available yet
     (every SGX ticker, `sections=peers` 400s there), write **"coming soon"**, never
     leave the cell blank and never silently drop the column.
   - A sector-level row shows the sector's own aggregate move (`subsector/report`'s
     `mcap_change.1w`) plus a one-line callout of its top mover in that
     peer-comparison cell (`companies/top-changes` filtered to the sub-sector).
   - **Ticker link**: IDX tickers link `https://sectors.app/idx/<lowercase, no .JK>`
     (existing convention). **SGX tickers link `https://sectors.app/sgx/<lowercase
     bare code>`** (confirmed 2026-07-16, e.g. `https://sectors.app/sgx/d05`).
   - **Sector link**: `https://sectors.app/indonesia/<sub-sector slug>` (confirmed
     2026-07-16, e.g. `https://sectors.app/indonesia/banks`,
     `https://sectors.app/indonesia/consumer-services`), the same kebab slug
     `subsector/report/{slug}/` uses.
3. **Takeaway paragraph, factors and news, never a call** — after the table, a short
   paragraph naming real, dated, factual drivers behind what the table just showed:
   potential factors affecting a tracked ticker/sector's move, related news, or a
   genuinely upcoming event (an earnings date, a disclosed corporate action). Source
   from the Sectors API first (`news/?symbols=` / `news/?sub_sector=`,
   `company/corporate-actions/{symbol}/`), fall back to a cited web search only for
   what the API can't cover (an SGX name's news, since `news/` is IDX-only), same
   citation discipline as `sourcing.md` (inline `(sectors.app)` for API facts, a
   dated named-outlet citation plus a **Sources** entry for anything web-sourced).
   **Not every row needs a factor.** Only include one for a row where a real source
   actually turned something up, never manufacture a narrative to fill every line,
   same non-advice discipline as sector-spotlight and single-company-deep-dive
   throughout, describe what happened and what's scheduled, never what to do about it.
4. **CTA** — back to `sectors.app` to check the full watchlist/workflow, one link.
5. **Sources** (list any web-sourced facts used in step 3, name + date + link, same
   format as every other issue type; Sectors-API-sourced facts only need the standard
   inline `(sectors.app)` citation, no separate Sources entry) + disclaimer footer.

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

A technical block mapping each metric actually used in the issue to its endpoint AND
field, one endpoint per bullet, the specific fields it backed in parentheses. This is
mandatory for every issue type this skill delivers, not a nice-to-have for a deep
dive, even a short type gets one, it just has fewer bullets:

```markdown
**Appendix: Sectors API endpoints (fields used)**
- `company/report/ADRO.JK/` — `valuation.historical_valuation[]` (P/E, P/B vs peer
  average), `financials.historical_eps`, `financials.historical_financial_ratio[]`
  (ROE), `dividend.yield_ttm`, `dividend.payout_ratio`, `dividend.historical_dividends`,
  `future.company_growth_forecasts` (consensus EPS/revenue growth),
  `future.analyst_rating_breakdown`
- `daily/ADRO.JK/` — 90-day close price series (hero chart)
- `companies/` screener — `total_yield[2025]`, LQ45 constituents ranked by 2025
  dividend yield
- `company/corporate-actions/ADRO.JK/` — `dividend[]` history, buyback/capital-reduction
  detail
```

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

**Keep it short** (confirmed 2026-07-20): endpoint and fields only, no prose explaining
what a date range covered, why a param was or wasn't used, or how a result got filtered
or aggregated client-side. That reasoning belongs in `queries.md` during drafting, not in
the delivered appendix. A bullet like `filings/?limit=30&offset=0..210` — filing dates is
correct; a bullet that goes on to explain `start`/`end` filters on transaction date and
silently drops certain days is not, cut it down to the endpoint and field.

## Standard disclaimer footer (fixed text, appended to every issue)

```markdown
---
*This newsletter is data reporting and market commentary, not investment advice or a
recommendation to buy or sell any security. Figures are from sectors.app as of
{data_as_of} unless otherwise cited. Do your own research.*
```

## Length guidance

Newsletter prose, not slide fragments: 400-900 words typical across the whole issue.
Vary sentence and paragraph length; simplify word choice, not cadence (inherit
`writing/writing.md` section 3). **`watchlist-performance-digest` is shorter**,
150-300 words outside the table, it's a personalized digest read in a couple minutes
on a phone, not a full briefing, closer to dbquery's nudge-length norm than this
skill's usual newsletter length.

## Worked micro-example (header + one filled section)

```markdown
---
subject: Foreign investors sold the rally
preview: Banks led the week, but the buyers weren't local.
issue_type: weekly-wrap
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
