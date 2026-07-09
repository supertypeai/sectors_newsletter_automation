# Visual language (the brand design system you free-code against)

You compose each **content slide as HTML**. The renderer (`scripts/render.mjs`) wraps your HTML in the brand frame (the stage, the warm-black background, the dot grid + glow, the canvas size, the fonts) so the look can never drift. Your job is the *inside* of the slide: the words, the data, the arrangement.

Two things you do **not** hand-author, the renderer owns them so they stay identical on every piece:
- **The cover and the outro** are brand primitives (use `role: "cover"` / `role: "outro"`, see below). The outro is fixed; never write custom outro HTML.
- **Charts and ticker logos** go in through placeholders (below) so they are always on-brand. Do not hand-draw an SVG chart or `<img>` a logo.

Everything else is yours to build with the tokens and classes here.

## The three laws (these override taste every time)

1. **Gradient = emphasis only.** The pink→gold gradient is the *one brand moment per slide*. It goes on a **single word or number, the verdict**, never a whole title or header. Use `class="gradient-text"` on that one span. More than one gradient per slide, or a fully-gradient headline, is wrong.
2. **Every slide earns a verdict.** A slide is not a number, it is a *claim the number proves*. The headline states the verdict ("Its bad-loan ratio rose as rates climbed"), the figure proves it, an optional one-line `body` adds the so-what. A slide that just labels a number ("EPS GROWTH 2025: 4.9%") and stops is a data dump, fix it or cut it.
3. **Fill with meaning, not filler, and never leave a void.** A slide should breathe, but empty vertical space is *where the verdict goes*, not the goal. If a slide looks empty, you are missing the takeaway, not missing a decoration. Balance the content in the canvas (center it or distribute it), do not pin a headline to the top and a chart to the bottom with a dead zone between.

## Canvas

- The renderer gives you a `.content` box already padded `80px 72px 76px` inside the slide. Put your HTML inside it (the renderer wraps you automatically, you don't write `.content`).
- Formats: `portrait` 1080×1350 (default), `square` 1080×1080, `story` 1080×1920. Author for portrait; keep content clear of the bottom ~120px on portrait.
- You're drawing at native 1080-wide. All sizes below are in those px.

## Design tokens (CSS variables, already in scope)

| token | value | use |
|---|---|---|
| `--bg` | `#0C0A09` | warm-black background (renderer owns it) |
| `--text` | `#F6F1EE` | primary text |
| `--muted` | `#A99F99` | secondary text, labels |
| `--dim` | `#6E6661` | faint text, axis |
| `--brandPink` / `--brandGold` | `#E5337E` / `#DF9439` | the gradient ends |
| `--brandGradient` | `linear-gradient(to right,#E5337E,#DF9439)` | the one brand moment |
| `--gain` / `--loss` | `#1FB36A` / `#E0003B` | up / down (finance semantics, not brand) |
| `--peerBlue` / `--peerPlum` | `#7C93C9` / `#9B7EBD` | peer-series colors 2 and 3 (peer 1 is `--muted`); charts assign these automatically, don't hand-pick |
| `--surface` / `--surface2` | `#1E1916` / `#14100E` | solid fills, tracks |
| `--glassBg` `--glassBorder` `--glassBlur` | see theme.css | the glass card recipe |
| `--sans` / `--mono` | Plus Jakarta Sans / JetBrains Mono | prose / numbers |

Always reference tokens (`color:var(--muted)`), never raw hex, so a token change propagates. Numbers are **always** mono (`class="num"` or `font-family:var(--mono)`); prose is sans.

**Auto-fit, so you don't have to guess a safe size.** A hand-picked font-size for a hero number is a bet on how long the value will be, "12.2%" and "Rp 1,234,567" don't take the same space. Any element classed `value` or `price` (the built-in stat/keyFacts/price components) is auto-shrunk by the renderer after layout until it fits one line, no action needed. For a free-HTML standalone number (hero-style, archetype H1 below), add `autofit` alongside `num`: `class="num autofit"`. Pick the size that looks right for the typical case, the renderer corrects outliers, it never wraps. Two edges: sibling cards in a keyfacts grid (and the cover stat pair) share the row's most-constrained final size so one long value can't make its own card look mismatched; and shrinking has a floor, a value that still can't fit is reported as a render warning naming it (the PNG would show a truncated, therefore WRONG, number), reformat the value when you see that ("Rp 1,234T", not the full integer).

## Type ramp (use these classes, don't invent sizes)

| class | size / weight | use |
|---|---|---|
| `kicker` | 22 mono, gold, uppercase, tracked | the eyebrow above a headline |
| `title` | 46/700 | the slide headline (the verdict) |
| `subhead` | 38/600 | one supporting line under a headline |
| `body` | 34/500, 1.45 | the so-what sentence (2-3 lines max) |
| `label` | 26/600, uppercase, muted | a stat/figure label |
| `caption-t` | 22/500, muted | a chart unit or source line |
| `num` | mono 700 | wraps any number |
| `gradient-text` | the brand gradient on text | the ONE emphasis span |

## Layout primitives

- `<div class="content">` the renderer adds this; it's `flex column`. To **vertically center** a light slide: give your inner stack `style="flex:1;justify-content:center;"`. To **distribute** (headline top, chart middle, verdict bottom): `style="flex:1;justify-content:space-between;"`.
- `<div class="stack" style="gap:40px;">` vertical group.
- `<div class="spacer"></div>` flexes to push siblings apart. Use deliberately; a lone spacer above your only block is what creates the dead-zone void, prefer `justify-content` on the stack instead.
- `<div class="row">` lays children side by side, equal widths. Only pair **narrow** things (two stats, a stat + a short list). Do **not** put two full-width charts in a row, they overflow and shrink to nothing.
- `<div class="glass">…</div>` the frosted card (use for insights, stat groups, summaries). Padding is built in.
- `<span class="delta up|down|flat">▲ +0.97%</span>` the gain/loss pill, usable directly in free HTML (same look as the block-level `delta` fields).

Ticker strings are normalized everywhere: `bbri.jk`, `BBRI.JK`, and `BBRI` all resolve to the same logo, you never need to strip the `.JK` suffix yourself.

## Charts

Charts moved to `references/charts.md` (index table up top: chart kind, the data shape it fits, when to use it; the "Which Sectors API field maps to which chart" list and the `compose` escape hatch live there too). Use that index and read only the entries for the chart kinds you actually picked, not the whole file.

## Logos (placeholder)

```html
<span data-logo="BBCA" style="display:inline-block;width:56px;height:56px;"></span>
```
Real logo renders as the image only (no fill); a missing one falls back to a gradient monogram. Always give it an explicit width/height box.

**Inline mention (small, next to the ticker in running text):** whenever a **content slide's prose** (a title, a body sentence, an insight) names a ticker, mark it with `logo-inline` instead of hand-sizing a logo, it sits inline at 1em (matches the surrounding text size) with the right baseline offset. This applies even for the piece's own single subject, the cover carrying the identity doesn't exempt a content slide that spells the ticker out in a sentence, that was a real gap an eval caught: a slide named "BBRI" in its body with no mark anywhere on the slide.
```html
<span class="logo-inline" data-logo="BBRI"></span>BBRI trades at half the multiple of <span class="logo-inline" data-logo="BBCA"></span>BBCA.
```
Rule of thumb: **once per slide per ticker is enough.** If a slide's prose names the same ticker twice, one mark is fine, you don't need to re-mark every repeat. But never let a slide go with *zero* marks when it names a ticker at least once, that's the miss to avoid. Any `data-logo` for that ticker anywhere on the slide counts (a sized logo box in a header satisfies a body mention). Kicker/label/caption rows (small-caps metadata like "BBRI DIVIDEND YIELD · TTM") are not prose and don't need the mark. `brand-lint.mjs` checks this mechanically: it collects every ticker the deck actually uses (cover `tickers`/`chip`, any `data-logo`, block and table rows, the same registry the renderer resolves logos from) and flags a slide that names one in prose with no mark anywhere on that slide.

## Cover and outro (renderer primitives, not free HTML)

**Cover** (`role: "cover"`): give fields, not HTML. The headline renders in base color with your `emphasis` substring in gradient (the verdict word). No full-title gradient.
```jsonc
{ "role":"cover", "chip":{"ticker":"BBCA"},
  "kicker":"IDX · EARNINGS",
  "headline":"Profit grew. The stock fell 38%.",
  "emphasis":"fell 38%",                       // REQUIRED: the verdict word/number to gradient — an EXACT, case-sensitive substring of the headline (a mismatch renders flat; the lint errors on it)
  "support":"one supporting line",             // ONE of support OR stat, never both
  "stat":{"value":"12%","label":"DIVIDEND YIELD",
          "compare":{"value":"6.8%","label":"10Y BOND"}},  // optional: the numeric hook. compare is optional (a single stat works alone)
  "spark":{"points":[100,98,...],"change":-9.4,"label":"$BBCA · 30D"} }  // optional 30D backdrop; logo rides in the callout
```
**Choosing the stat is an editorial call, not a formatting one.** Ask "what number, seen on its own, makes someone stop scrolling and believe the headline?" It's rarely whichever field was easiest to fetch. If the headline sentence already spells out the numbers ("BBRI yields 12%. Bonds pay 6.8%."), don't repeat them in `stat`, that's redundant, flip the headline to the qualitative verdict ("A high yield the hard way") and let `stat` carry the figures instead. A cover with a bare text sentence and no visual number is a weaker hook than one with a stat, use `stat` by default when you have a number this good.

**Cover visual archetypes** (which backdrop fits which story, don't default to spark out of habit):
- **Solo** (1 ticker): `spark`, a single indexed-price line. The classic single-stock hook.
- **Duel** (2 tickers, a head-to-head): `duel`, both tickers' indexed price overlaid (self solid, peer dashed, same grammar as the `multiline` chart), each line labeled with its ticker at the endpoint so the reader never has to guess which falling line is the subject. A comparison piece whose cover only shows one company's price is telling half the story, an eval caught exactly this (BBCA vs BBRI's cover only featured BBRI).
- **Field** (3-10+ tickers, a sector/screener/ranking piece): no chart backdrop at all, just `tickers` for the logo row/stack. A price-line backdrop stops being readable past 2-3 series; the group's identity is the hook here, the numbers live on the content slides.

**`tickers` always renders the logo(s)**, independent of which (if any) backdrop you pick, this used to only exist nested inside the `spark` callout, so a cover naming a ticker with no spark, or naming 2+ tickers, showed no mark at all. It scales automatically: 1 ticker is a single pill, 2 is two pills with a "VS", 3-6 is a wrapping row of pills, 7+ collapses to an overlapping logo stack (capped at 6) with a "+N" badge, a sector piece's cover should read as "this is about a group," not enumerate every name. `chip:{"ticker":"BBCA"}` still works standalone for a single ticker (legacy shorthand).

**Outro** (`role: "outro"`): fixed brand close (laptop + phone, "Like this post?"). Just let `autoOutro` append it, or add `{ "role":"outro" }`. Never write its copy.

## Archetypes

Archetypes moved to `references/archetypes.md` (family index up top: 5 families, 15 archetypes). Use that index and read only the archetypes you actually picked, not the whole file.

## Anti-patterns (the eval caught all of these)

- **Full-title gradient.** Only the verdict word. (Old covers did this, don't.)
- **Two gradients on one slide.** One brand moment, period.
- **The void.** Headline pinned top, chart pinned bottom, dead space between. Use `justify-content:center`/`space-between`, and if it still looks empty you're missing the verdict.
- **Two wide charts in a `row`.** They overflow and shrink to thumbnails. One chart per row; pair only narrow things.
- **A number with no verdict.** "EPS 4.9%" alone says nothing. "Growth has nearly stopped, 4.9% is the slowest in five years" is the slide.
- **Raw hex / foreign fonts.** Use the tokens and the two brand fonts only.
- **Cramming.** If a slide makes two points, it's two slides.

Run `node scripts/brand-lint.mjs <deck.json>` before rendering, then read the rendered PNGs and fix anything that drifts. The lint ERRORs on: gradient violations (zero or 2+ emphases, an `emphasis` that isn't an exact substring of its headline), prescriptive advice phrasing, em/en dashes, foreign fonts, citing the source as "Sectors API"/bare "Sectors" instead of `sectors.app`, a hand-authored footer, a ticker named in prose with no logo mark, and malformed/unknown chart placeholders (including unparseable `data-spec` JSON). It WARNs on judgment calls (a 10+ word cover headline, raw hex in styles, descriptive "sell shares" phrasing, blocks-path ticker mentions). Layout, only your eyes catch: read every rendered PNG.
