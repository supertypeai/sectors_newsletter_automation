# Sectors Carousel House Style

The visual source of truth for every carousel this skill produces. Ported from the Sectors Content Studio Remotion renderer (the `social-media-agent` project) and adapted for standalone HTML rendering. The render pipeline (`scripts/render.mjs` + `assets/`) implements these exact tokens; when you plan a deck, pick blocks and write copy that fit this language so output stays on-brand and recognizable across pieces.

Read this to answer three questions: **what a slide is made of**, **which visual block says which thing**, and **how the intro/outro stay consistent**.

---

## 1. Canvas & formats

- **Portrait `1080 × 1350` (4:5)** is the default and the one to design for. Instagram gives 4:5 the most feed height.
- **Square `1080 × 1080` (1:1)** is also supported.
- **Story `1080 × 1920` (9:16)** is also supported (`format:"story"`); the outro devices scale by canvas height automatically.
- Everything is built at **1080px logical width**. Heights change per format; width never does.
- A carousel is **3-10 slides**. Cover + 3 to 8 content slides + outro is the normal range. Deck length follows the story's depth, not a fixed count.

---

## 2. The constant slide frame

Every **content** slide is three background layers plus a padded content box. This is what makes any slide instantly read as "a Sectors slide."

| Layer | What | Value |
|---|---|---|
| 0 background | warm near-black (never pure `#000`) | `--bg` = `#0C0A09` |
| 1 nebula | top-anchored pink atmospheric glow | `radial-gradient(ellipse 80% 55% at 50% 0%, rgba(229,51,126,0.20), transparent 70%)` |
| 2 dot grid | faint tiled dots | `radial-gradient(circle, rgba(246,241,238,0.10) 1.5px, transparent 1.5px)`, tile `30px 30px` |
| content | the padded flex column | padding `80px 72px 76px` (`PAD_TOP / PAD_X / PAD_BOT`) |

- **Content slides have no ticker chip in the header**; they lead with their headline. Company identity lives on the cover: the chip row driven by the `tickers` field (one pill / two pills + VS / a wrapping row / a capped stack, see §8), or, on a legacy single-ticker spark cover, the small logo inside the spark callout. The `priceSnapshot` block keeps its own in-card ticker chip, and prose mentions carry the `logo-inline` mark (see `visual-language.md`).
- **Content slides have no footer.** The **cover** and **outro** carry the same footer: the Sectors mark + "Sectors" wordmark on the left; Instagram + `@sectorsapp`, a globe + `sectors.app`, a divider, then `supertype.ai` on the right.
- Content width (the usable stage) is `1080 − 72·2 = 936px`.

---

## 3. Color tokens (exact)

| Token | Hex / value | Role |
|---|---|---|
| `--brandPink` | `#E5337E` | primary brand, gradient **start** |
| `--brandGold` | `#DF9439` | brand accent, gradient **end**, the solid interactive accent |
| `--gain` | `#1FB36A` | up / positive (data only) |
| `--loss` | `#E0003B` | down / negative (data only) |
| `--bg` | `#0C0A09` | base canvas |
| `--surface` | `#1E1916` | card / fill surface |
| `--surface2` | `#14100E` | raised / track surface |
| `--text` | `#F6F1EE` | primary text (warm white) |
| `--muted` | `#A99F99` | secondary text |
| `--dim` | `#6E6661` | tertiary text |
| `--brandGradient` | `linear-gradient(to right, #E5337E 0%, #DF9439 100%)` | the one brand gradient |
| `--border` | `rgba(246,241,238,0.12)` | hairline |
| `--border2` | `rgba(246,241,238,0.07)` | faint hairline / gridlines |

**Color usage laws (do not break these, they carry the brand):**
1. The **pink→gold gradient is ONE brand moment per slide**, a headline word, the hero number, or a key bar. Gradient everything and it reads cheap.
2. **Solid gold `#DF9439` = accent/interactive**, kicker eyebrows, CTA pill, a single highlighted value. Never use red for "a control" (red means loss).
3. **Green/red are reserved for data**, an up/down change, a gain/loss. Never decorative. A red slide title is a bug.
4. Text hierarchy is **warm-white → muted → dim**, never opacity hacks on pure white.

---

## 4. Typography ramp (exact)

Two families: **Plus Jakarta Sans** for all prose; **JetBrains Mono** for every number, ticker, price, and percentage (always `font-feature-settings:"tnum"` for tabular alignment).

| Role | size px | weight | family | line-height | tracking | case | use |
|---|---|---|---|---|---|---|---|
| display | 104 (84 once the headline passes 22 characters) | 800 | sans | 1.06 | -0.035em | normal | cover headline |
| title | 46 | 700 | sans | 1.08 | -0.02em | normal | content slide headline, quote |
| subhead | 38 | 600 | sans | 1.25 | 0 | normal | CTA line, intro support |
| body | 34 | 500 | sans | 1.45 | 0 | normal | prose, bullets |
| label | 26 | 600 | sans | normal | 0.05em | UPPERCASE | card label, delta pill, eyebrow |
| caption | 22 | 500 | sans | normal | 0 | normal | axes, footnotes, timestamps |
| statHero | 172 | 700 | **mono** | 0.92 | -0.02em | normal | the one hero number on a slide |
| statValue | 80 → 64 → 48 | 700 | **mono** | 1 | 0 | normal | stat-card values (step down by length) |
| coverStat | 88 | 700 | **mono** | 1 | -0.02em | normal | the cover's stat hook (`stat.value`) |
| number | 36 | 700 | **mono** | normal | 0 | normal | inline values, table cells |
| **kicker** | 22 | 500 | **mono** | normal | 0.16em | UPPERCASE | the gold eyebrow above a headline |

The **kicker** is the signature idiom: a short gold mono eyebrow (e.g. `IDX · EARNINGS`) above the headline. Use it on most content slides.

**Auto-fit is the real safety net, not the size steps.** The sizes above are starting points, not guarantees: a value's actual length (a currency figure vs. a bare percentage) can still overflow a fixed card. `render.mjs` auto-shrinks any element classed `value`, `price`, or `autofit` after layout until it fits one line, so pick the size that looks right and let the renderer correct for outliers, don't hand-tune per value. Two edges of that mechanism: sibling cards in one `keyFacts` grid (and the cover stat pair) all share the row's most-constrained final size, so one long value shrinks its neighbors with it rather than reading as a mistake; and a value that still can't fit at the shrink floor is reported as a render warning naming the value, because the PNG would otherwise show a silently truncated (wrong) number, reformat the value when you see it.

---

## 5. Surfaces & atoms (exact)

**Glass card** (the one surface, used for stat cards, insight, quote, most figure cards):
```
background: rgba(28,23,20,0.42);
backdrop-filter: blur(22px) saturate(135%);
border: 1px solid rgba(246,241,238,0.14);
border-radius: 22px;
box-shadow: 0 12px 38px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(246,241,238,0.08);
padding: 30px 34px;        /* default */
```
Never put `overflow:hidden` on a card; let content breathe to the edge.

**Analyst take** = the `insight` glass card (gold eyebrow + a one-take paragraph); the original project's "callout footnote" component was never ported, don't reach for it. **Peer comparison** has three shapes, by scale: `peerBars` (horizontal bars, one metric), the `radar` chart (archetype S2 "The Field", one subject vs 2-3 peers across up to 7 axes), and the `table` grid (N tickers × M metrics, past radar's peer-color ceiling). Analyst *consensus* is a `donut` of `analyst_rating_breakdown` (reported, never endorsed).

**Delta pill**: `padding 7px 16px; border-radius 999px; mono 700 26px;` background `rgba(gain,0.12)` or `rgba(loss,0.12)`, text in gain/loss.

**Ticker chip**: logo (52px rounded square, falls back to a gradient monogram) + pill (`background:--surface; border:1px --border; border-radius:999px; padding:9px 20px; mono 600 26px`) showing `$TICKER` with the `$` in `--dim`.

**Footer strip** (cover/outro only): the Sectors mark + "Sectors" wordmark (no trailing dot) on the left; on the right, Instagram glyph + `@sectorsapp`, globe glyph + `sectors.app`, a 1px divider, then muted `supertype.ai`. Cover and outro use the same footer.

Radii: general `16px`, card `22px`, pills/CTA `999px`.

---

## 6. The grid (guidance, not law)

The original engine packs blocks on a 12-column grid and auto-scales each cell to fit. **We deliberately do NOT port that auto-fit (`FitToCell`) behavior**, it produced cramped, evenly-stuffed slides. Our layout is simpler and story-first: **one idea per slide, generous breathing room, deliberate pairing.** Use the grid as a measuring guide, not a packing algorithm.

- 12 columns over the 936px stage: col `56px`, gap `24px` (pitch `80px`). Row unit `64px`, gap `24px` (pitch `88px`).
- A portrait content slide holds roughly **11-13 rows** of content comfortably. Past ~13 it feels crowded → split into two slides.
- **Half-width pairing:** two `cols:6` cards sit side by side. Pair them deliberately (a stat beside a related stat). **Never leave a lone half-width card with dead space beside it**, make it full width instead.
- **Balance vertically.** A light slide centers its stack (`justify-content:center`); a distributed slide anchors headline top, verdict bottom (`space-between`). Content never just stacks from the top with a dead zone under it, that's exactly §9.5's void. (An earlier draft said "top-aligned, don't center"; that predates the void law and the archetype system, and was wrong.)

---

## 7. Block vocabulary

These are the visual "words." Each carousel slide is built from one **lead block** (the point) plus at most one supporting block. Choose the **most specific** block for the angle, a purpose-built figure beats a generic stat. `Render status`: ✅ = implemented in the v1 renderer; ⏳ = known in the vocabulary, not yet rendered (the renderer skips it with a warning, so prefer ✅ blocks until ⏳ ones land).

### Prose blocks
| kind | purpose | render |
|---|---|---|
| `headline` | kicker eyebrow + bold title; leads most content slides | ✅ |
| `subhead` | one muted supporting line under a headline | ✅ |
| `body` | a short prose paragraph (2-3 sentences max) | ✅ |
| `bullets` | gradient-dot list, 2-4 items | ✅ |
| `insight` | glass card, gold eyebrow + an analyst-style take | ✅ |
| `quote` | glass card with a big gradient `"` glyph, attributed | ✅ |
| `cta` | gradient pill + a follow line (rare on content slides) | ✅ |

### Figure / data blocks (the hard numbers)
| kind | purpose | data source | render |
|---|---|---|---|
| `stat` | one label + one big mono number; `hero` mode = the 172px centrepiece | any single field | ✅ |
| `keyFacts` | 2-col label-over-number grid (3-6 facts) | report.overview/valuation | ✅ |
| `priceSnapshot` | ticker + price + change + sparkline | daily | ✅ |
| `rangeBar` | 52-week low→high track with a position marker | all_time_price | ✅ |
| `quarterlyTrend` | ≤8-quarter bar trend (revenue/earnings) | quarterly financials | ✅ |
| `dividendHistory` | per-year dividend columns (≤6) + optional yield line | report.dividend | ✅ |
| `ownership` | top shareholders as labeled bars (or a donut) | major_shareholders | ✅ |
| `peerBars` | labeled horizontal bars vs peers, self row highlighted | peers / screener | ✅ |
| `ranking` | league table: rank # + logo + name + value + delta | top-changes / screener | ✅ |
| `comparison` | logo rows with a value + delta per row | screener / multi-ticker | ✅ |
| `valuation` | side-by-side multiples vs peer + a verdict pill | report.valuation | ⏳ |
| `foreignFlow` | daily net-foreign-flow bars + net total | foreign-flow | ⏳ |
| `priceArea` | full-width annotated price area chart | daily | ⏳ |
| `relativeToIndex` | two rebased-to-100 lines (stock vs index) | daily + index-daily | ⏳ |
| `transaction` | insider filing: holder + action + shares/value | filings | ⏳ |
| `segments` | revenue-mix bars | segments | ⏳ |
| `timeline` | dated event rows, grouped by same-day cluster | filings / corporate_actions | ✅ (via `data-chart="timeline"`, see below) |

**In practice, free-code is the primary path, not this table.** Ten fresh eval runs this round each built a full deck from scratch; all ten free-coded 100% of their slides and none used the structured `blocks[]` kind system above. Treat the ✅ rows as a convenience for a slide that maps cleanly onto one (still real, still fine to use), and the ⏳ rows as a legacy wishlist this account hasn't needed, not a promise something will land — if a story needs one of those shapes, free-code it (every ⏳ shape above is buildable in HTML against `references/visual-language.md` today, an eval already did it for `foreignFlow` and `priceArea`/`relativeToIndex`-equivalents with zero friction).

**The `data-chart` vocabulary is 13 named kinds, not `blocks[]` kinds** (documented in `references/charts.md`, not the table above): `bar`, `line`, `donut`, `radar`, `multiline`, `stackedbar`, `waterfall`, `table`, `timeline`, `scatter`, `heatmap`, `bump`, `sankey`. Every one of them anchors a named archetype in `references/archetypes.md`'s archetype library (15 named archetypes across 5 families, see its "Archetypes" section), so start from the shape of your data, a ranked leaderboard, a flow decomposition, a category x time matrix, and let the archetype library tell you the family, density, and structure to build the slide in, rather than defaulting to `bar`/`line` out of habit. `charts.md` also documents which Sectors API field maps to which chart, and a worked example for each.

**A 14th kind, `compose`, is the escape hatch, not a paved-road kind.** When a story genuinely needs a shape none of the 13 fit (a slope, a dumbbell, a gauge, a candlestick-style range), `compose` lets the agent build it declaratively from governed layers instead of hand-rolling `<svg>` (which the lint forbids outright, because raw SVG escapes the brand). It's the deliberate answer to "trust the agent to compose, but keep it on brand": the shape is free, but every brick is governed, semantic-only colors (no raw hex), the house pink→gold as the one gradient, mono numerals, and the "every chart is a promise" check enforced with a warning. Because it anchors no archetype and reintroduces the drift risk the named kinds designed away, it's a last resort: exhaust the 13 first (a slope is often a 2-point `multiline`; a lollipop is often a `bar`). Full grammar and a worked example live in `references/charts.md`'s "compose" section.

---

## 8. Cover & outro conventions (keep these consistent)

The intro and outro are the brand bookends. They barely change piece to piece, which is the point.

**Cover slide (`role: cover`):**
- Gold **kicker** (e.g. `IDX · EARNINGS SNAPSHOT`).
- A **display headline** (the hook, see `references/writing/viral-hooks.md`), 104px (84px past 22 characters), 1-3 short lines, rendered in **base text colour with one `emphasis` word/number in gradient** (the verdict). Never a full-title gradient, that dilutes the one brand moment. The `emphasis` field is required and must be an exact, case-sensitive substring of the headline (the renderer matches it literally).
- **One** support: a subhead line OR a stat (`stat.value`/`stat.label`, optionally `stat.compare` for a two-figure comparison like "12% vs 6.8%"). Not both, not a stack. Pick the stat(s) that best prove the headline; if the numbers are already in the headline sentence, don't repeat them here, use a qualitative headline instead so the stat carries the figures.
- Optional backdrop, matched to the story shape: **`spark`** (one ticker's faint pink→gold price line + a glass callout pill `[logo] $TICKER · 30D · ±x%`) or **`duel`** (exactly 2 tickers' indexed lines, self solid in the gradient, peer dashed and muted, each line labeled with its ticker at the endpoint so the cover is never unattributable). 3+ tickers is the "Field" archetype instead, no chart backdrop at all, just the `tickers` logo row/stack, a price-line backdrop stops being readable past 2-3 series. Independent of the backdrop, the **`tickers` field always renders the chip row**: 1 ticker = a single pill, 2 = two pills with a VS, 3-6 = a wrapping row, 7+ = a capped overlapping logo stack with a "+N" badge. The legacy single-ticker spark cover embeds its one logo in the callout and skips the standalone row.
- The footer is identical to the outro footer (mark + "Sectors"; IG/globe handles + `supertype.ai`).
- A cover is a hook, not a meal. Don't crowd it.

**Outro slide (`role: outro`), fixed brand close, do NOT write custom copy for it:**
- Headline `Like this post?` (with `post` in gradient).
- Sub line: `Stay informed and discover more research on our website.`
- A website **search-pill CTA**: a rounded outline pill with a magnifier glyph + `sectors.app`.
- Top-right pink glow (not the centered nebula), the device illustration bleeding off the bottom, and the ruled FooterStrip (`@sectorsapp · sectors.app · supertype.ai`).
- The renderer appends a default outro automatically; you only choose whether to include it (you almost always should).

---

## 9. Composition principles (the storytelling-on-a-slide layer)

This is where we want to beat the original, not copy it. The visual grammar serves the story:

1. **One slide = one beat = one verdict.** Each slide makes a single point and *states it*: the headline is the verdict ("Its bad-loan ratio rose as rates climbed"), the figure proves it, an optional one-line body adds the so-what. A slide that only labels a number ("EPS 4.9%") and stops is a data dump, fix it or cut it. If a slide makes two points, it's two slides.
2. **Lead with the most specific visual.** A `quarterlyTrend` beats a generic `stat` for an earnings story; a `rangeBar` beats prose for "where it trades." Match the block to the claim.
3. **The deck is an arc** (cover hook → build → payoff → outro). No two adjacent content slides lead with the same block kind unless the data demands it. See `references/writing/storytelling.md`.
4. **Numbers are mono, claims are sans.** Every figure is a real API value (see `references/sectors-api/data-quality.md`, never fabricate). A number with no source does not go on a slide.
5. **Breathe, but never leave a void.** A confident, uncrowded slide beats a stuffed one, don't inflate it with filler blocks. But empty vertical space is *where the verdict goes*, not the goal: a headline pinned to the top with a chart at the bottom and a dead zone between is a broken slide, not a sparse one. Balance the content in the canvas (center it, or distribute headline / figure / verdict). If a slide looks empty, you're missing the takeaway.
6. **One brand moment per slide** (the gradient), on the verdict word only. Never a full-title gradient. Everything else is text hierarchy + the data colors.

---

*Token provenance: `social-media-agent/src/schema/theme.ts` (palette), `src/remotion/theme/tokens.ts` (derived tokens), `src/remotion/theme/ramp.ts` (type ramp), `src/core/gridLayout.ts` (+ `theme/layout.ts`) (grid). Values frozen here so the renderer and the planner agree without reading the original project.*
