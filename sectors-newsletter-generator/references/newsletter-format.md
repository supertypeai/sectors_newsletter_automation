# Newsletter format, the Markdown output contract

The prose equivalent of the carousel skill's `deck-format.md`. Every issue is a single
`.md` file shaped like this, regardless of type.

## Header block (top of the file, before the body)

```markdown
---
subject: <the email subject line>
preview: <the inbox preview/preheader text>
issue_type: weekly-wrap | macro-reaction | three-stock-story | single-company-deep-dive | sector-spotlight | daily-market-pulse | upcoming-event | new-feature-release
date: <YYYY-MM-DD, the issue/send date>
data_as_of: <YYYY-MM-DD, the API's as-of date>
---
```

- **`subject`**: ≤ ~9 words. States the verdict or hook, not a category. Passes the same
  test as a carousel cover headline — "trades at 12x, near a 5-year low" beats "This
  Week in Banks." No hype, no advice framing (never "3 stocks to buy now").
- **`preview`**: ~40-90 characters. Re-angles the subject with a second detail; never
  restates it verbatim (same rule as the carousel caption's first line).
- **`issue_type`**: one of the built workflow slugs, matches the folder/file naming in
  the delivery convention (see SKILL.md).
- **`date`** and **`data_as_of`**: the API "today" lags ~1 day (UTC), so these can differ
  from the actual send date. Always show both.

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
- Pair with the company's full name at least once per section:
  `Bank Central Asia ([**$BBCA**](https://sectors.app/idx/bbca))`.
- **No elegant variation.** Don't rotate BBCA → "the lender" → "the banking giant" to
  avoid repetition — reuse the ticker or the company name plainly. This is the same
  AI-tell filter the carousel skill's `writing.md` applies to slide copy.

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
- **One hero chart per issue, optional but encouraged.** Pick the single name or series
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
  colors are already fixed and validated (see the file's own header comment for the role
  map and why GAIN/LOSS renders blue/red, not green/red on this palette), so don't
  re-derive a palette per issue. A hand-rolled inline SVG or `ggplot2` (R) is a fallback
  only for a shape `charts.mjs` doesn't cover (reach for its own `compose` escape hatch
  first).
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

- Rupiah as `IDR` — `IDR 10,150` for a price, `IDR 689.5T` for a compacted large
  figure.
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
The full "Sectors Weekly Insights" digest. **Delivered as a send-ready HTML email
(`newsletter.html`), not just Markdown** — the two-column mover cards, colored +/- cells,
CTA button and event banner don't survive plain Markdown, and the revamp's whole point is
a self-contained, data-backed email with **no PDF attachment**. Keep a `newsletter.md`
draft for review; ship the `.html`. Full recipe (API source per section, HTML delivery
notes) in `workflows/weekly-wrap.md` §2b–2c.

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
10. **Upcoming event** — the current Sectors workshop promo block, if one is running
    (details sourced as in `workflows/upcoming-event.md`, never invented).
11. **The takeaway** — the non-obvious so-what, not a restatement of section 2 — then a
    CTA back to `sectors.app`, **Sources** list (if any web-sourced "why" was used), and
    the disclaimer footer.

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

### Daily market pulse
Tightest type, tables first, built to read in under a minute.
1. **Index in one line** — up/down and whether broad or led by a handful.
2. **Top gainers** and **top losers** — two small tables (never a signed column).
3. **Most traded** — a short table (ticker, volume, price).
4. **Flow/broker line** — one line only if there's a genuine signal; skip rather than pad.
5. Disclaimer footer (Sources only if a "why" line was web-sourced). No hero chart unless
   one name genuinely warrants it.

### Upcoming event
Promo for a Sectors in-house workshop. Content is **user-supplied** (date/venue, agenda,
speaker, registration link, banner), not market data. Ask for all four detail sets first
(workflow doc), never invent them.
1. **Hook headline** — what the participant walks away able to do + the most compelling
   logistical fact (named speaker, hard date, "hands-on, live data").
2. **Banner** — the user's marketing image right after the headline, one-line caption.
3. **Essentials block/small table** — date/time (with timezone), venue/format, who it's
   for. Catchable in one glance.
4. **Agenda** (short list) + **speaker(s)** (name + role).
5. **Optional data teaser** — one real band-checked `sectors.mjs` result showing what
   participants will build (cited `sectors.app`), skip if the agenda speaks for itself.
6. **CTA** — the registration link, plainly stated, repeated once near the close.
7. Disclaimer footer (Sources only if a data teaser was used). No market-advice framing.

### New feature release
Product enablement, not market analysis. Source is the release page, not the market API.
1. **What you can now do** — one line, the capability, not a hype opener.
2. **How to use it** — where it lives, the steps, the plan tier if gated; link the docs
   recipe if one exists.
3. **Optional real example** — if the feature produces data, one real band-checked
   `sectors.mjs` result showing what it surfaces (as capability demo, never a buy call).
4. **Sources** — the release page (and docs recipe) + disclaimer footer.

## Appendix: data sources (optional, after Sources, before the disclaimer)

A technical block mapping each metric actually used in the issue to its endpoint AND
field, one endpoint per bullet, the specific fields it backed in parentheses:

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
list or ahead of the disclaimer. Optional per issue: add it when a reader might
plausibly want to trace the pull (a deep dive, a spotlight built on a screener query),
skip it on a tight daily-pulse issue where it'd outweigh the content.

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
`writing/writing.md` section 3).

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
