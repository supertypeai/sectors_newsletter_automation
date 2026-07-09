# Deck format (the `deck.json` contract)

`scripts/render.mjs <deck.json>` turns this JSON into PNG slides. You (the agent) write the deck; the renderer is deterministic. Every value you put here must be real (see `sectors-api/data-quality.md`) and on-voice (see `writing/brand-voice.md`). Choose blocks per `house-style.md`.

## Deck

```jsonc
{
  "format": "portrait",          // "portrait" (1080x1350, default) | "square" (1080x1080) | "story" (1080x1920)
  "footer": { "handle": "@sectorsapp", "site": "sectors.app", "attribution": "supertype.ai" },
  "autoOutro": true,             // default true, appends the standard outro if you didn't add one
  "slides": [ /* Slide objects */ ]
}
```

## Slide

A content slide carries **either** `html` (the primary path, free-code) **or** `blocks` (the helper library). Cover and outro are renderer primitives with their own fields.

```jsonc
{ "role": "cover" | "content" | "outro",   // default "content"
  "chip": { "ticker": "BBCA" },             // cover: drives the small logo in the spark callout. logoUrl optional override.
  "asOf": "13 Jun 2026",                    // content only: renders as "As of 13 Jun 2026 · sectors.app" — give a bare date, the "As of" prefix is added for you (an eval wrote "asOf":"updated 13 Jun 2026" and got "As of updated 13 Jun 2026"). POLICY: stamp it on any content slide whose figures are as-of a date (prices, ratios, flows) unless the slide already carries its own dated source caption; data-quality.md rule 5 ("show the date") is otherwise unenforceable. Only claim the precision you actually have ("Jun 2026" beats an invented day).
  "html": "<div class=\"stack\" ...>…</div>",// content: agent-authored HTML against references/visual-language.md (PRIMARY)
  "blocks": [ /* Block objects */ ] }        // content: OR the semantic helper blocks below
```

### Free-HTML content slides (primary)

Author the slide body as HTML using the brand classes/tokens in **`visual-language.md`** (which has copy-paste patterns). The renderer wraps it in the brand frame, so don't write the stage, background, or footer. Placeholders (charts, logos) keep those elements on-brand, `data-spec` is single-quoted so its JSON uses double quotes (attribute order is flexible and extra attributes survive on a wrapper, but the spec must be valid single-quoted JSON and the div body empty; violations warn at render and ERROR in lint, see `references/charts.md`'s "Placeholder shape"):

```html
<div data-chart="bar"        data-spec='{"bars":[{"label":"2025","value":57.5,"display":"57.5"}],"caption":"Rp T","benchmark":{"value":48.2,"label":"5Y AVG"}}'></div>
<div data-chart="line"       data-spec='{"values":[100,98,103],"area":true,"w":920,"h":260,"benchmark":{"value":97,"label":"90D AVG"}}'></div>
<div data-chart="donut"      data-spec='{"segments":[{"pct":55,"color":"#E5337E"}],"centerLabel":"55%","centerSub":"CONTROLLING"}'></div>
<div data-chart="radar"      data-spec='{"axes":["ROE","NPL","CASA"],"series":[{"name":"BBRI","self":true,"values":[78,55,60]},{"name":"BBCA","values":[85,80,90]}],"maxValue":100}'></div>
<div data-chart="multiline"  data-spec='{"series":[{"name":"BBRI","self":true,"area":true,"values":[100,98,103]},{"name":"BBCA","values":[100,102,101]}]}'></div>
<div data-chart="stackedbar" data-spec='{"bars":[{"label":"2025","segments":[{"value":48,"color":"#E5337E"},{"value":21,"color":"#DF9439"}]}],"legend":[{"label":"Micro","color":"#E5337E"},{"label":"Consumer","color":"#DF9439"}]}'></div>
<div data-chart="waterfall"  data-spec='{"bars":[{"label":"Q1 2025","value":14.31,"isTotal":true,"display":"14.31"},{"label":"+NII","value":1.3},{"label":"Q1 2026","value":16.01,"isTotal":true,"display":"16.01"}]}'></div>
<div data-chart="table"      data-spec='{"columns":["P/E","Yield"],"rows":[{"ticker":"DEWA","values":["2.67×","1.2%"]}]}'></div>
<div data-chart="timeline"   data-spec='{"events":[{"date":"3 Mar 2026, afternoon","label":"Director buys 200,000 shares","detail":"14:29 · Rp 6,982/share"}]}'></div>
<div data-chart="scatter"    data-spec='{"xLabel":"P/E","yLabel":"Market cap","yScale":"log","points":[{"x":11.9,"y":689500000000000,"label":"BBCA","self":true,"displayX":"11.9×","displayY":"Rp 689T"},{"x":9.4,"y":205000000000000,"label":"BBRI","displayX":"9.4×","displayY":"Rp 205T"}]}'></div>
<div data-chart="heatmap"    data-spec='{"mode":"diverging","rows":["Individual","Insurance"],"cols":["Nov","Dec"],"values":[[45000,-30000],[-8000,5000]]}'></div>
<div data-chart="bump"       data-spec='{"days":[{"date":"23 Jun","entries":[{"symbol":"GOTO","value":6367,"display":"6.4B"},{"symbol":"BUMI","value":3325}]},{"date":"24 Jun","entries":[{"symbol":"GOTO","value":4306},{"symbol":"BUMI","value":2059}]}]}'></div>
<div data-chart="sankey"     data-spec='{"unit":"T","links":[{"source":"Cellular","target":"Total Revenue","value":6.26},{"source":"Total Revenue","target":"Cost of Revenue","value":41.2},{"source":"Total Revenue","target":"Gross Profit","value":108.77}]}'></div>
<span data-logo="BBCA" style="display:inline-block;width:56px;height:56px;"></span>
```
`radar`/`multiline` share one grammar: mark the subject `"self":true` (brand gradient, solid), every other series is a peer (dashed, muted, auto-colored, no fill). Never set `self` on more than one series, and never exceed 3 peers (only 3 distinct peer colors exist; the renderer warns if you do; reach for `table` past that). `multiline` auto-prints each series' endpoint %-change (a series starting at 0 gets its raw end value instead); every series shares ONE min/max scale, so two series on very different natural scales (a price vs. a ratio, a blue chip vs. a small-cap) collapse the smaller one to a flat line, set `"index":true` on the spec (also accepted on the cover's `duel`) to rebase every series to 100 at its own first value first, rather than hand-indexing the raw values yourself; the renderer warns when it detects a >20x scale mismatch and `index` isn't set; `donut` segments take an optional `label` (auto-builds a "label · pct%" legend, add it once you have 3+ segments) and `pct` values are shares of ~100, never absolute values; `stackedbar`'s `legend[i]` auto-appends `segments[i]`'s value from the most recent bar, and every segment tall enough to hold text prints its own value in place (consistently across bars); segments must be non-negative (a negative `value` is dropped and warned, put signed data in `bar`/`waterfall` instead), and more than 4 uncolored segments in one bar reuse a color (give each an explicit `color`, same 4-total ceiling as radar/multiline peers). `waterfall` bars need `isTotal:true` on the anchor bars (usually first/last); it's self-checking, a contributor sum that doesn't reach the final total shows as a visible gap, not a silent mis-render. `table` columns are one shared grid across every row; rows auto-number 1..N and accept `name`/`logoUrl`, plus an optional `self:true` (bold name, gold rank number, same convention as peerBars' `self`) for the rare table that does have a natural subject among its rows. Every row needs a `name` or `ticker`, and `values` needs exactly one entry per column; a missing name, a values/columns length mismatch, or a null/non-primitive cell all warn (naming the row) and render an empty cell rather than fail silently. `timeline` groups consecutive events sharing the exact same `date` string under one header, give same-session events a shared coarse date label if you want them to read as a cluster. `scatter` is the one chart with two INDEPENDENT axes (no shared min/max): `points:[{x,y,label,self?,size?,displayX?,displayY?}]`, at most one `self` (a second warns and demotes to peer), `xScale`/`yScale:"log"` for a decades-spanning axis (a non-positive value under log is dropped, warned), <=6 points labels everyone, past that only `self` + each axis's min/max outlier get a label, and past ~12 points the renderer warns to reach for `table` instead. `heatmap` is a category x period grid, one primitive for a trend a single chart couldn't show before (a category x TIME matrix, not one or the other): `rows`/`cols` are labels, `values` is row-major numbers, `mode:"sequential"` (default, brand pink) for an unsigned magnitude or `mode:"diverging"` (`--gain`/`--loss`) for a signed delta, an optional `display:[[strings]]` overrides a cell's printed value, and cells narrower than ~56px (too many rows/cols for the canvas) warn but still render. `bar` and `line` both also accept `"benchmark":{"value":number,"label":string,"display?":string}`, a dashed reference line (a sector average, a historical mean) so the chart can answer "vs what" without the caption carrying it; its `value` is folded into the chart's own scale so it always lands inside the plot, and a missing/non-numeric `value` warns and drops just the line (see `references/charts.md`'s bar/line sections for worked examples). `bump` is a ranked leaderboard over time: `days:[{date,entries:[{symbol,value?,display?}]}]`, each day's `entries` already in rank order (index 0 = rank 1, no separate rank field); a symbol absent from a day breaks its line (by design) into a new segment, and the re-entry point after a break gets its own small label. Only ONE symbol ever gets the brand gradient (the explicit `highlight`, or a symbol auto-detected to hold rank 1 on EVERY day), everyone else renders in the same muted treatment and is identified by an endpoint label, not a color, since a bump chart routinely has far more than 3 distinct names in play; a duplicate symbol within one day keeps the first occurrence and warns, an empty/1-day `days` warns (use `ranking`/`table` instead), and past ~6 rank slots or ~14 days warns about crowding. `sankey` is a multi-level flow decomposition: `links:[{source,target,value,display?}]`, nodes are DERIVED from the links (a name that's both a `target` and a `source` elsewhere is automatically a middle node), laid out in layers by topological depth; a node's bar height is proportional to its throughput (the larger of in-sum/out-sum) and every node prints its own name + total. `unit` (e.g. `"T"`) is appended to every printed number, node totals and link values alike, not just stated once in a caption, since a dense sankey can put numbers far from the caption. The gradient goes on the single dominant root-to-leaf chain (biggest root, then always the biggest outgoing link, to a leaf), not one isolated link. A node whose inflow and outflow disagree by more than 1.5% draws a visible hatched gap AND warns, naming the node and both sums, rather than silently stretching either side to fit; links under ~2% of the root total collapse into an "Other (n)" pseudo-source per target, but only when a target has 2+ such small links (a lone one merged alone would just lose its name for nothing). A non-numeric/non-positive `value` or a `source === target` link drops (warned); a cycle (A -> B -> A) drops the link that closes it (warned, a layered layout needs a DAG); past ~24 links or ~5 layers warns the diagram will run wide/thin. Sizing extras: `caption` on every kind; `w`/`h` on line/multiline/stackedbar/waterfall/scatter/bump/sankey (`strokeWidth` on line); `size` on radar/donut (also per-point on `scatter`, for a bubble radius); `maxTotal` on stackedbar to pin a shared scale across charts. See `references/charts.md` for which Sectors API field maps to which chart, and its "every chart is a promise" note on why these all print their own numbers.

Laws: the headline states the **verdict**, gradient (`class="gradient-text"`) goes on **one** word only, balance the canvas (no voids). Run `scripts/brand-lint.mjs` before rendering.

**Cover slide** uses these fields instead of `blocks`/`html`:
```jsonc
{ "role": "cover", "tickers": ["BBCA", "BBRI"],  // every ticker this piece is about — always renders as a logo row/stack, see below. "chip":{"ticker":"BBCA"} still works for a single ticker (legacy, kept for backward compat)
  "kicker": "IDX · EARNINGS SNAPSHOT",      // gold mono eyebrow
  "headline": "Profit grew. The stock fell 38%.", // the hook, base colour
  "emphasis": "fell 38%",                   // REQUIRED: the verdict word/number, the only gradient on the slide. Must be an EXACT case-sensitive substring of headline (mismatch renders flat; lint ERRORs)
  "support": "one supporting line",         // ONE of support OR stat, never both
  "stat": { "value": "12%", "label": "DIVIDEND YIELD",
            "compare": { "value": "6.8%", "label": "10Y BOND" } }, // optional: the stat(s) that prove the hook. compare is optional too (single stat is fine)
  "spark": { "points": [100,98,...,124], "change": 4.2, "label": "$BBCA · 30D" },  // optional 30D backdrop for ONE ticker; logo rides in the callout
  "duel": { "series": [ { "name":"BBCA", "self":true, "values":[100,98,...] }, { "name":"BBRI", "values":[100,102,...] } ],
            "index": true } }  // optional 2-ticker indexed-price backdrop (exactly 2 series, the head-to-head "Duel" archetype), the comparison sibling of spark, using the same self/peer grammar as multiline. 3+ tickers is the "Field" archetype instead, no chart backdrop, just the `tickers` logo row/stack (see visual-language.md's "Cover visual archetypes"). ONE of spark OR duel, never both. `index:true` (optional) rebases both series to 100 at their own first value before the shared scale is computed, same mechanism and same reason as multiline's `index:true` (see `references/charts.md`'s multiline section). Use it whenever the two tickers' raw prices sit on very different scales, e.g. a blue chip vs. a small-cap peer. Without it, the renderer warns when two series' scales differ by more than ~20x (the smaller one would otherwise render as a flat, information-free line).
```
`tickers` drives the logo row independent of whether you also give `spark`/`duel`: 1 ticker is a single pill, 2 is two pills with a "VS", 3-6 is a wrapping row, 7+ is a capped overlapping stack with a "+N" badge. Each entry can be a bare string or `{ "ticker":"BBCA", "logoUrl":"..." }` to override a missing logo, same as `chip.logoUrl`. A cover can also carry `blocks` (rendered under the hook), rarely needed. See `visual-language.md`'s "Cover visual archetypes" for which of spark/duel/logo-row-only fits which story shape.

`stat` is the numeric hook: pick the figure (or two, compared) that most directly proves the headline, not whatever's easiest to fetch. If the headline sentence already states the numbers ("BBRI yields 12%. Bonds pay 6.8%."), don't also repeat them in `stat`, it reads redundant, make the headline the qualitative verdict instead ("A high yield the hard way") and let `stat` carry the figures. Numbers in `stat.value`/`stat.compare.value` render plain (no gradient, no wrap risk, auto-sized), the headline's `emphasis` still owns the one brand gradient moment.

**Outro slide** is fixed brand copy; usually you just let `autoOutro` add it. To include explicitly: `{ "role": "outro" }`. Optional overrides: `{ "role":"outro", "outro": { "headline":"...", "emphasis":"...", "support":"...", "url":"sectors.app" } }` — an override headline is escaped like all deck copy and takes the same one-gradient-word `emphasis` grammar as the cover.

**The semantic blocks helper library moved to the appendix at the bottom of this file (legacy/optional).** Free HTML above is the primary path and the way to build anything the blocks don't cover.

## Rules the renderer assumes you followed

- **Values are strings you pre-formatted** for display (`"Rp 689T"`, `"22.4×"`, `"+11.4%"`); chart `value`/`pct`/`dps` are raw numbers used only for geometry.
- Keep content within the canvas height. Overflow is clipped; a sparse slide is better than a crammed one.

See `samples/bbri-yield-vs-bonds.deck.json` for a complete worked example (a story-first, free-HTML deck: every slide states a verdict, gradient is emphasis-only).

## Appendix: semantic blocks (legacy/optional)

Free HTML (above) is the primary authoring path; the blocks below are an optional helper library, useful only when a slide maps cleanly to one of these shapes.

`delta` objects everywhere are `{ "dir": "up"|"down"|"flat", "text": "+0.97%" }`.

### Prose
| kind | fields |
|---|---|
| `headline` | `kicker?`, `title`, `emphasis` (the one verdict substring to gradient; full-title gradient is not supported, gradient is emphasis-only) |
| `subhead` | `text` |
| `body` | `text` |
| `caption` | `text` (small muted line, e.g. a chart unit) |
| `bullets` | `items: [string]` (2-4) |
| `insight` | `kicker?`, `text` (glass card, analyst-style take) |
| `quote` | `text`, `attribution?` |
| `cta` | `text`, `handle?` |

### Figures (numbers must be real API values)
| kind | fields |
|---|---|
| `stat` | `label`, `value` (string, pre-formatted), `sub?`, `hero?:true` (the 172px centrepiece, bare), `gradient?:true`, `size?:"s1"\|"s2"\|"s3"`, `delta?` |
| `keyFacts` | `facts: [{ label, value, sub? }]` (2-6; 2 cols for ≤2 or exactly 4 facts, so 4 is a clean 2×2, else 3 cols; avoid 5, it orphans) |
| `priceSnapshot` | `ticker`, `logoUrl?`, `price` (string), `change` (delta), `asOf?`, `spark: [number]` |
| `rangeBar` | `label?`, `low`, `high`, `current` (numbers, for the marker), `lowText?`, `highText?`, `currentText?` (display strings); or pass `pct` (0-1) directly |
| `quarterlyTrend` (or `chart`) | `caption?`, `bars: [{ label, value:number, display? }]`, `delta?`, `legend?: [{ label, color? }]`, `benchmark?: { value, label, display? }` (dashed reference line, see the `bar`/`line` `data-chart` note above) |
| `dividendHistory` | `years: [{ year, dps:number, display? }]` (≤6), `summary?: { facts: [{ label, value, gradient? }] }` |
| `ownership` | `holders: [{ name, pct:number, color?, display? }]`, `donut?:true` (default), `centerSub?` (e.g. "CONTROLLING") |
| `peerBars` | `metric`, `rows: [{ name, value:number, ratio?, display?, self?:true }]` (highlight the subject with `self`) |
| `ranking` | `rows: [{ rank?, ticker?, name?, logoUrl?, value, delta? }]` (league table) |
| `comparison` | `rows: [{ ticker?, name?, logoUrl?, value, delta? }]` |

### Layout helpers
| kind | fields |
|---|---|
| `row` | `blocks: [Block]`, lay child blocks side by side (use for a deliberate half-width pair) |
| `spacer` | none, pushes following content down (e.g. to sit a chart near the bottom) |

- **One lead block per content slide** (plus at most one support). If a slide makes two points, split it.
- A block kind not yet implemented is skipped with a warning (see `house-style.md` for ✅ vs ⏳ kinds). Prefer ✅ kinds.
