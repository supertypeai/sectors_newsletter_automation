# Charts (the on-brand chart vocabulary)

Split out of `references/visual-language.md` so a runtime agent loads only this file when composing a chart. The core contract (the three laws, canvas, design tokens, type ramp, layout primitives, logos, cover/outro, anti-patterns) stays in `visual-language.md`; archetypes live in `references/archetypes.md`.

**Use this index first.** Pick the kind that fits your data's shape, then read only that kind's own comment block below (search for its `data-chart="kind"` example). You do not need to read every kind to compose one slide. The "Which Sectors API field maps to which chart" list and the `compose` escape hatch both live inside this same file, further down.

## Index

| kind | data shape it fits | when to use |
|---|---|---|
| `bar` | one series of labeled values | a trend across years or periods; add `benchmark` for a sector-median or historical-average reference line |
| `line` | a single time series | price or a metric over time; `area` fill, `startLabel`, `extremes`, and `benchmark` are opt-in add-ons |
| `donut` | 2+ segments summing to ~100% | ownership mix, analyst consensus, a top-level revenue mix; one instant's composition only |
| `radar` | one self vs 2-3 peers across shared axes | a multi-axis scorecard; a shape comparison, not a precise readout, so state at least one concrete number in the body copy too |
| `multiline` | 2+ series on one shared scale | self vs peer(s) over time; use `"index":true` when the series' natural scales differ by more than ~20x |
| `stackedbar` | categories stacked per bar | composition changing across periods (loan mix, funding mix, segment mix by year) |
| `waterfall` | a start total, named +/- contributors, an end total | an earnings bridge or margin walk, only when the contributors actually reconcile to the end total |
| `table` | N entities x M metrics | a screener result or sector roster with no natural self, past ranking's one-metric-plus-delta ceiling |
| `timeline` | dated event rows, same-date events cluster under one header | a filing cluster or corporate-action sequence, when WHEN something happened is the point |
| `scatter` | two independent axes per entity | entities that don't share one natural scale ("cheap AND big"); `yScale:"log"` for a decades-spanning axis |
| `heatmap` | a category x time/metric matrix | which category moved AND when, in one glance; `mode:"sequential"` for magnitude, `mode:"diverging"` for a signed delta |
| `bump` | a ranked leaderboard over days | membership rotating day to day; the story is WHO holds a spot, not a value on a shared axis |
| `sankey` | a multi-level flow decomposition | where something comes from AND where it goes after, past donut's one-level ceiling |
| `compose` | an escape hatch, declarative governed layers | a genuinely new shape none of the 13 named kinds fit (a slope, a dumbbell, a gauge, a candlestick-style range); exhaust the 13 first |

## Charts (placeholders, always on-brand)

Drop a placeholder div; the renderer replaces it with a brand SVG. `data-spec` is **single-quoted** so the JSON inside uses normal double quotes. Numbers in `bars`/`values` are raw (for geometry); `display` is the label you want printed.

**Placeholder shape:** the div must have an **empty body** and the spec must be **single-quoted, valid JSON**; attribute order is flexible and other attributes (a `style` for spacing, a class) are kept, re-emitted on a wrapper around the injected chart. Anything that still doesn't match (a typo'd kind, a double-quoted spec, text inside the div) is removed or left inert **with a loud render warning and a lint ERROR**, never a silent hole. Spec extras that work on every chart kind: `caption` (small muted line above). Sizing: `line` takes `w`/`h`/`strokeWidth`; `multiline`/`stackedbar`/`waterfall`/`scatter` take `w`/`h`; `radar` and `donut` take `size`. `bar` also accepts `legend` and `delta` (same shapes as the quarterlyTrend block). `bar` and `line` both also accept `benchmark` (see below), a dashed reference line for "this value vs. a sector average / historical mean."

```html
<!-- vertical bars: trends, year-over-year. caption optional. -->
<div data-chart="bar" data-spec='{"bars":[{"label":"2021","value":31.4,"display":"31.4"},{"label":"2025","value":57.5,"display":"57.5"}],"caption":"net profit · IDR trillion"}'></div>

<!-- bar + benchmark: a dashed reference line at Y(value), muted, with a right-aligned
     "label · value" tag, so a bar chart can answer "vs what" without the caption carrying it
     (no chart in this skill could show that before). The benchmark's value is folded into the
     SAME min/max the bars themselves scale against, so a benchmark taller than every bar still
     lands inside the plot instead of drawing off it or getting silently clipped. A non-numeric
     benchmark.value warns and drops just the line, the bars still render.
     Sectors mapping: subsector/report/{slug}.statistics.filtered_median_pe as the sector-median
     line over per-company P/E bars, e.g. "did this company re-rate above or below its peers." -->
<div data-chart="bar" data-spec='{"bars":[{"label":"DEWA","value":2.67},{"label":"BBTN","value":4.12},{"label":"JPFA","value":4.44}],"benchmark":{"value":6.8,"label":"SUBSECTOR MEDIAN P/E"},"caption":"trailing P/E, ×"}'></div>

<!-- line: price/series. area:true fills under it. sized 852x150 by default; pass w/h to fit.
     Prints its own endpoint dot + label automatically (the end value, or the %-change from the
     first point when the series doesn't start at 0), same convention as multiline's endpoint,
     no field needed, you don't opt into it.
     startLabel (opt-in): anchors the STARTING value at the left, so the endpoint's %-change
     reads against a real number instead of thin air (there's no y-axis; with only the endpoint
     labeled, the slope's magnitude is a guess). Pass `true` for the raw start value, or a
     string to label it your way ("100" for an indexed series, "Jan" for a date). The start
     reads quiet (muted, smaller); the endpoint stays the loud verdict.
     extremes (opt-in): also labels the interior peak and trough with their values (the
     endpoints are skipped, they already carry start/end numbers): a y-sense without a grid. -->
<div data-chart="line" data-spec='{"values":[100,104,112,96,101,88,84.4],"area":true,"startLabel":"100","w":920,"h":260}'></div>

<!-- line + benchmark: the same dashed reference line as bar, above, for a series instead of
     discrete bars, e.g. a 5-year average annual earnings line over an earnings-per-year run
     built as one `line` (or the equivalent `bar`, if you'd rather show discrete years).
     Sectors mapping: financials.historical_financials's per-year earnings, averaged over the
     trailing 5 years, as the benchmark against the same years' own line. -->
<div data-chart="line" data-spec='{"values":[38.2,44.1,51.7,49.3,57.5],"benchmark":{"value":48.2,"label":"5Y AVG"},"w":920,"h":260}'></div>

<!-- donut: ownership / mix. size px (square). keep <=420 so it fits. Give each segment a
     `label` once you have 3+ (analyst consensus, revenue mix): the renderer auto-builds a
     "label · pct%" legend so every slice has a readable number, not just the one centerLabel
     callout. A 2-segment donut (the other segment is trivially 100-minus) can skip label.
     A segment's `label` and the chart's `centerLabel`/`centerSub` are plain strings (only
     `pct` itself must stay the share of the whole, geometry needs it for the arc), so any of
     them can carry an absolute figure alongside the percentage, e.g. a segment `label` of
     "Public · 42% · IDR 310T", to show an ownership slide's absolute value with no renderer
     change. -->
<div data-chart="donut" data-spec='{"segments":[{"pct":45,"color":"#1FB36A","label":"Strong Buy"},{"pct":30,"color":"#DF9439","label":"Buy"},{"pct":15,"color":"#A99F99","label":"Hold"},{"pct":10,"color":"#E0003B","label":"Sell"}],"centerLabel":"45%","centerSub":"STRONG BUY"}'></div>
```

Negative bar values render in `--loss` automatically. For a **declining-trend** ("growth is fading") story, feed the actual declining values as bars, the shrinking heights tell it. Bars label every point when ≤6; past that they label first, last, **and the series' min and max** (the narratively load-bearing points survive the thinning), and past 7 bars the x-axis labels print every other one. `donut` segments' `pct` values are **percentages of a whole** (they should sum to ~100), not absolute values; convert absolutes to shares before writing the spec. The renderer checks this after coercion and warns (naming the actual sum) if segments land more than 2 points off 100, a `pct` list that only sums to 35 used to render a mostly-empty ring with no signal anything was wrong; it never rescales your numbers to fill the ring, that would draw a shape the data didn't have. `stackedbar` segment values have no unit of their own either, name the unit in the `caption` or legend labels.

`benchmark` (`bar`/`line`, opt-in) is `{"value":number,"label":string,"display?":string}`: one dashed reference line at the value's own position on the chart's shared scale, plus a small right-aligned "label · value" tag (`display` prints in place of the raw `value` when you want a pre-formatted string, e.g. `"6.8×"` instead of the bare number `6.8`, same value/display split every other chart primitive here uses). Use it whenever the verdict is relative to a reference point the chart can show directly, a sector median, a historical average, a policy target, rather than making the reader hold that number in their head while reading the bars/line. `value` must be a real number; a missing or non-numeric one warns and drops just the reference line (the bars/line still render). The benchmark's `value` is folded into the chart's own min/max before the axis is drawn, so a benchmark outside the data's own range (a sector average well above every bar in a cheap-stock screener) still lands inside the plot instead of drawing off it or getting silently clipped.

```html
<!-- radar: a multi-axis scorecard, one subject vs peers. axes ≤7, short labels (one word
     or a tight abbreviation, e.g. "Div Yield" not "Dividend Yield per Share") or they'll crowd;
     the renderer warns past 7 (labels will crowd, it still renders, just cut to the most
     discriminating axes). Radar is a SHAPE chart (relative position, not a precise readout:
     no per-vertex numbers print on it, that's the nature of the chart type, same as any
     published radar/spider chart). Because of that, the body copy MUST state at least one
     concrete number from the data ("BBRI's ROE (78) trails BBCA's (85)"), not just a
     qualitative comparison, or the slide is silent on every number the chart is actually
     built from.

     Every axis value must be >=0: the chart geometry clamps a negative value to 0, so -10 and
     0 draw the IDENTICAL vertex, actively misleading rather than merely imprecise (a reader
     can't tell "this axis is zero" from "this axis is negative" on the shape alone). The
     renderer warns naming the series and axis when this happens; it doesn't change the
     geometry (radar can't draw a negative value at all), so a genuinely signed metric belongs
     in `bar` instead, which draws negatives correctly.

     maxValue scales EVERY axis by the SAME number, so it only works when every axis is
     already on one comparable scale: point_summaries' point/maxpoint*100 (below) qualifies,
     RAW RATIOS DO NOT. Feeding real ratios of different natural ranges (ROE ~20, CASA ~85,
     loan growth ~14) through one shared maxValue doesn't distort by competitive position, it
     distorts by unit: an axis with a small natural ceiling pins near center regardless of
     how strong that value actually is, and a reader (and a careless agent) will misread that
     as a weakness. For a raw-ratio radar, either normalize every value to 0-100 by its own
     realistic ceiling before writing values (what an eval had to reconstruct by hand), or
     pass maxValue as an ARRAY matching axes' order, one ceiling per axis, e.g.
     "maxValue":[25,100,100,20] for [ROE,CASA,LDR,Growth], and the renderer then does the
     per-axis division for you and there's no manual arithmetic to get wrong. -->
<div data-chart="radar" data-spec='{"axes":["ROE","NPL","CASA","Div Yield","Growth"],"series":[{"name":"BBRI","self":true,"values":[78,55,60,85,40]},{"name":"BBCA","values":[85,80,90,50,55]}],"maxValue":100}'></div>

<!-- multiline: several series on one shared, comparable scale (e.g. indexed price, a ratio
     vs. its peer average over time). Only the self series can fill an area. Every line prints
     its own endpoint dot + %-change-from-start label (auto, no field needed): a shape with
     no numbers forces the reader to trust separate body text to know how much anything moved.
     (A series that legitimately starts at 0 has no defined %-change; it keeps its dot and
     labels the raw end value instead.)
     startLabel (opt-in): anchors ONLY the self series' starting value at the left (a start
     label on every peer too would crowd the left edge; each peer's endpoint %-change already
     says how much it moved). -->
<div data-chart="multiline" data-spec='{"series":[{"name":"BBRI","self":true,"area":true,"values":[100,98,103,96,90]},{"name":"BBCA","values":[100,102,101,105,108]}],"startLabel":true}'></div>

<!-- multiline "index":true: EVERY series shares ONE min/max scale (that's what makes them
     "comparable" in the first place), which silently breaks the moment two series live on
     genuinely different natural scales, e.g. daily/{symbol} closes for BBCA (~IDR 9,000-9,800)
     next to a small-cap peer (~IDR 150-200): the small-cap's whole range is under 2% of BBCA's,
     so its line pins to one y value and reads as "flat, unmoving" when it may have moved just
     as much in percentage terms. Feeding pre-indexed values by hand (dividing every point by
     the series' own first value, times 100) works but invites a baseline slip, indexing off
     the wrong point, or indexing one series and forgetting the other. "index":true does the
     SAME rebase mechanically and consistently: every series is divided by ITS OWN first value
     and multiplied by 100 before the chart's shared scale is computed, so every line starts at
     exactly 100 and both are visually comparable regardless of raw price. The renderer also
     warns (even without "index":true) when two series' scales differ by more than ~20x, naming
     both series and suggesting the fix, rather than rendering the smaller one flat with no
     signal anything is wrong. A series can't be indexed if its FIRST value is 0 (divide by
     zero) or non-numeric; that series is dropped whole, with a warning naming it, same as any
     other sick series (see sanitizeSeries above). A dropped series is honest, a line indexed
     against the wrong baseline is not. -->
<div data-chart="multiline" data-spec='{"index":true,"series":[{"name":"BBCA","self":true,"values":[9420,9500,9650,9380,9800]},{"name":"SMALLCAP","values":[182,175,190,168,195]}]}'></div>

<!-- stackedbar: composition across categories (segment/product/funding mix per year).
     segments stack bottom-up; give each an explicit color, and a caption `legend` naming
     them (`legend[i]` describes `segments[i]` of every bar, matched by position). The legend
     auto-appends each category's value from the MOST RECENT bar ("Micro · 48"), the total
     above each bar was never enough, that only ever gave the whole, never a category's share.

     Segments must be non-negative, a stacked bar can't represent a signed composition; a
     negative `value` is dropped (rendered as 0, with a warning naming the bar and segment)
     rather than distorting every other segment's height, put a signed series in `bar` (handles
     negatives directly) or `waterfall` (built for a walk of +/- contributors) instead. Colors
     you don't set are auto-assigned the same way peer series are (segment 0 gets the brand
     gradient, later ones cycle 3 peer colors), so more than 4 uncolored segments in one bar
     mathematically reuse a color and the renderer warns, give every segment past the 4th its
     own explicit `color`. -->
<div data-chart="stackedbar" data-spec='{"bars":[{"label":"2024","segments":[{"value":45,"color":"#E5337E"},{"value":22,"color":"#DF9439"}]},{"label":"2025","segments":[{"value":48,"color":"#E5337E"},{"value":21,"color":"#DF9439"}]}],"legend":[{"label":"Micro","color":"#E5337E"},{"label":"Consumer","color":"#DF9439"}]}'></div>

<!-- waterfall: a start total, named +/- contributors, an end total (an earnings bridge, a
     margin walk, "what actually moved the number"). Mark the anchor bars isTotal:true, they
     draw full-height from zero; every other bar floats between the running total before and
     after it. Two evals independently needed this ("revenue grew but margin compressed,
     because X and Y outgrew it") and had no way to show the STEPS, only A's shape and B's
     shape on separate slides, forcing the reader to mentally reassemble the walk. isTotal
     bars render in the brand gradient; positive deltas green, negative deltas red: the one
     chart type that breaks from brand color for a universally-understood convention.

     THE CHART IS SELF-CHECKING: if your contributors don't actually sum to the stated end
     total, the connector before the final bar will visibly NOT reach it, a real gap, not a
     rendering bug. That's the renderer telling you the data doesn't reconcile (see
     sectors-api/data-quality.md's operating_pnl non-reconciliation landmine, exactly what an
     eval hit trying to build a bank's earnings bridge from exposed fields). Don't force a
     waterfall over data you can't make add up, an eval that hit this stuck to the one
     decomposition that DID reconcile (revenue = NII + non-interest income) rather than
     fabricate a plausible-looking bridge; drop back to bar/stackedbar + prose instead. -->
<div data-chart="waterfall" data-spec='{"bars":[{"label":"Q1 2025","value":14.31,"isTotal":true,"display":"14.31"},{"label":"+NII","value":1.3},{"label":"-Provision","value":-0.66},{"label":"Q1 2026","value":16.01,"isTotal":true,"display":"16.01"}]}'></div>

<!-- table: N tickers x M metrics, all visible at once (a screener result, a sector roster).
     ranking/comparison (deck-format.md) cap at ONE metric + a delta per row; three evals
     independently hit that ceiling trying to show 5-10 tickers against more than one metric
     (P/E AND yield, say). Not a chart, a plain grid, columns are shared across every row (the
     renderer handles this, don't hand-build per-row tables). Reach for this instead of
     forcing a second ranking slide or, worse, a radar/multiline built from unrelated entities
     with no natural "self" (see the guardrail below). Rows auto-number 1..N down the left
     (so order them by the metric that justifies the ranking); a row also takes "name" (shown
     instead of the bare ticker) and "logoUrl" (override for a missing logo).

     Every row needs a "name" or "ticker" (missing warns and renders blank), and "values" must
     have exactly one entry per column (a length mismatch warns naming the row and misaligns
     every value after the gap); a cell that's null or not text/number (an object, an array)
     also warns and renders an empty cell rather than a fabricated placeholder. Mark the
     subject "self":true on a row that happens to be the piece's own ticker among peers (bold
     name, gold rank number), same convention as peerBars' r.self, most tables have no natural
     self at all and that's fine, leave it unset. Keep values compact ("IDR 1,234T", not the
     full integer): an unusually long value widens its whole column (columns are shared grid
     tracks across every row) and can crowd or overflow the card. -->
<div data-chart="table" data-spec='{"columns":["P/E","Yield","Mkt Cap"],"rows":[{"ticker":"DEWA","values":["2.67×","1.2%","IDR 18T"],"self":true},{"ticker":"BBTN","values":["4.12×","4.8%","IDR 21T"]}]}'></div>

<!-- timeline: dated event rows for a filing cluster or corporate-action sequence: an eval
     needed to show "4 lonely filings over 6 months, then 6 crammed into one afternoon" and
     had nothing but prose or a bar chart (which collapses same-day events into one bar,
     erasing simultaneity). Consecutive events sharing the EXACT SAME `date` string group
     under one header instead of repeating it; a cluster of same-session events should
     therefore share one coarse date label ("3 Mar 2026, afternoon") with the precise time in
     `detail`, not each get a distinct per-minute timestamp as `date`, or every event gets its
     own header and the clustering effect you built this for is lost. -->
<div data-chart="timeline" data-spec='{"events":[{"date":"12 Sep 2025","label":"Commissioner buys 50,000 shares"},{"date":"3 Mar 2026, afternoon","label":"President Commissioner buys 317,900 shares","detail":"14:26 · IDR 6,982/share"},{"date":"3 Mar 2026, afternoon","label":"Director A buys 200,000 shares","detail":"14:29 · IDR 6,982/share"}]}'></div>

<!-- scatter: two independent axes at once ("who's cheap AND big"), for entities that don't
     share one natural scale the way bar/multiline's y-axis does. A peers report's pe_ttm vs
     market_cap (~10 peers) is exactly this case: radar's 3-peer-color ceiling can't hold a
     10-way comparison, and table shows the same ten numbers without the CLUSTERING read (who's
     cheap AND big vs cheap AND small looks identical in a column of numbers, not in a
     scatter). `self` is the subject, a gradient-filled dot with its own `(x, y)` values printed
     beside it; every other point is a muted dot. `points.length` <=6 labels everyone; past 6,
     only `self` plus the min/max outlier on EACH axis get a label (the shape from the
     unlabeled dots still carries the clustering read; the labels carry the specific numbers a
     reader needs). `xScale`/`yScale`:"log" is for a decades-spanning axis (`market_cap` spans
     low-trillions to a hundred-trillion-plus on IDX); a non-positive value under a log axis
     can't be placed (log of 0 or a negative is undefined) and is dropped, named in a warning.
     `size` (optional, per point) draws a bubble via SQRT scaling (so a 4x bigger number reads
     as ~2x the visual size, matching how area is actually perceived), capped so the biggest
     bubble can't dwarf the plot; state what `size` means in the `caption`, there's no separate
     size legend. At most one `self`; a second one warns and demotes to peer (first wins, same
     "first self wins" convention radar/multiline's `resolveSeriesColors` already uses). Past
     ~12 points the dot field itself gets crowded, the renderer warns and suggests `table`.
     `displayX`/`displayY` (optional, per point) are pre-formatted strings ("11.9×", "IDR 689T")
     printed in place of the raw `x`/`y`, the same value/display split every other chart here
     uses; the axis's own min/max text reuses whichever point's displayX/displayY holds that
     extreme value, so the axis edge can never disagree with the label sitting next to it. -->
<div data-chart="scatter" data-spec='{"xLabel":"P/E (trailing)","yLabel":"Market cap","yScale":"log","points":[{"x":11.9,"y":689500000000000,"label":"BBCA","self":true,"displayX":"11.9×","displayY":"IDR 689T"},{"x":9.4,"y":205000000000000,"label":"BBRI","displayX":"9.4×","displayY":"IDR 205T"},{"x":7.1,"y":142000000000000,"label":"BMRI","displayX":"7.1×","displayY":"IDR 142T"},{"x":14.2,"y":98000000000000,"label":"BBNI","displayX":"14.2×","displayY":"IDR 98T"}]}'></div>

<!-- heatmap: a category x time/metric matrix, one primitive covering three data shapes that
     used to force an either/or choice. shareholders-composition's holder-type x month mix is
     the clearest case: showing the TREND (who's accumulating/distributing) meant stackedbar,
     showing a SNAPSHOT (one month's mix) meant donut, and nothing showed both dimensions,
     category AND time, at once. `rows`/`cols` are labels, `values` is row-major numbers
     (`values[i][j]` is `rows[i]` x `cols[j]`). `mode`:"sequential" (default) shades every cell
     in brand pink, alpha scaled by `value`/the matrix's own max, for a magnitude with no sign
     (a ratio, a headcount). `mode`:"diverging" colors a cell `--gain` (positive) or `--loss`
     (negative), alpha by `|value|`/the matrix's own largest-magnitude cell, zero near-
     transparent, for a change that DOES have a sign (a month-over-month delta), so a cluster
     of red/green cells reads the shift at a glance before you read a single number. Every cell
     still prints its own value; `display` (optional, `[[strings]]` matching `values`' shape)
     overrides the raw number the same way `bar`'s `display` does, write deltas as
     "+1.2pp"/"-0.8pp" this way rather than a bare signed float. A non-numeric cell renders
     blank with a warning naming its row/col; a `values` row whose length doesn't match `cols`
     warns once for the row (not once per missing cell); an unknown `mode` warns and falls back
     to "sequential". Past cells narrower than ~56px (`rows.length`/`cols.length` vs the 936px
     content width) the renderer warns the grid is crowding and still renders, trim rows/cols
     or split into more slides.
     Sectors mapping: `shareholders-composition/{symbol}.data[]` month over month, the 9 holder
     categories (individual/insurance/pension_fund/corporate/mutual_fund/
     financial_institutions/securities_companies/foundation/other, each `_l` local + `_f`
     foreign) as rows, months as cols, each cell that category's month-over-month delta in
     shares (`mode`:"diverging"); `financials.historical_financial_ratio[]` metrics
     (profitability/leverage/liquidity/efficiency fields) as rows, years as cols, each cell the
     ratio itself (`mode`:"sequential", the default). -->
<div data-chart="heatmap" data-spec='{"mode":"diverging","rows":["Individual","Insurance","Mutual fund","Pension fund"],"cols":["Sep","Oct","Nov","Dec"],"values":[[120000,-85000,45000,-30000],[-15000,22000,-8000,5000],[300000,-120000,-60000,90000],[-5000,-12000,18000,-4000]],"display":[["+120K","-85K","+45K","-30K"],["-15K","+22K","-8K","+5K"],["+300K","-120K","-60K","+90K"],["-5K","-12K","+18K","-4K"]],"caption":"month-over-month change in shares held, by holder type"}'></div>

<!-- bump: a ranked leaderboard over time (rank 1..N down the left, days across the bottom),
     for a story that's about WHO holds a spot, not a value on a shared axis: the daily
     top-5-by-volume leaderboard is exactly this shape, membership rotates day to day and the
     story is "who's in the top 5, and who never left." `days`:[{date,entries}], each day's
     `entries` already in rank order (index 0 = rank 1, no separate rank field). A symbol
     absent from a day BREAKS its line into a new segment, by design: a name that drops off
     the tracked slots for a stretch and comes back is a different shape from one that never
     left, and a connector drawn straight across the gap would erase that difference. The
     re-entry point after a break gets its own small label so the line's identity survives the
     gap.

     COLOR: only ONE symbol ever gets the brand gradient, either the explicit `highlight`, or
     (if you omit it) whichever symbol holds rank 1 on EVERY day, the same "same name every
     single day" pattern the most-traded endpoint doc calls a story on its own. Every other
     symbol renders in the SAME muted treatment; a bump chart can easily involve 8+ distinct
     names (a 10-day top-5 leaderboard rotates through a dozen), far past the 3-peer-color
     ceiling radar/multiline enforce, so distinct-coloring every line was rejected as louder,
     not more informative. Identity for the muted lines comes from their own endpoint label
     (symbol + final rank + the last day's value/display, when given), never from a palette.
     If the highlighted symbol's rank-1 streak covers 2+ consecutive tracked days, it prints a
     small "#1 · ALL N DAYS" (or "N STRAIGHT DAYS") annotation; an explicit `highlight` that
     never actually held rank 1 simply doesn't get that annotation, its endpoint label still
     carries its real final rank.

     Sanitize/warn: a duplicate symbol within one day keeps the first occurrence, warns naming
     the day; an empty `days` or a single day warns (a 1-day bump is a `ranking`, not a bump
     chart); past ~6 rank slots or ~14 days warns about crowding, still renders. -->
<div data-chart="bump" data-spec='{"days":[{"date":"23 Jun","entries":[{"symbol":"GOTO","value":6367,"display":"6.4B"},{"symbol":"BUMI","value":3325,"display":"3.3B"},{"symbol":"BIPI","value":1254,"display":"1.3B"}]},{"date":"24 Jun","entries":[{"symbol":"GOTO","value":4306,"display":"4.3B"},{"symbol":"BUMI","value":2059,"display":"2.1B"},{"symbol":"BRMS","value":1596,"display":"1.6B"}]},{"date":"25 Jun","entries":[{"symbol":"GOTO","value":9934,"display":"9.9B"},{"symbol":"BUMI","value":4995,"display":"5.0B"},{"symbol":"ZATA","value":2403,"display":"2.4B"}]}],"caption":"top 3 by volume, per day"}'></div>

<!-- sankey: a multi-level flow decomposition ("where does the revenue actually go"), for a
     tree that keeps splitting (revenue into segments, then into cost vs. gross profit, then
     gross profit into operating income vs. operating expense, then operating expense into its
     own sub-buckets), a donut only ever shows ONE level of that tree at a time. `links`:
     [{source,target,value,display?}], nodes are DERIVED from the links (no separate node
     list, a name that appears as both a `target` in one link and a `source` in another is
     automatically a middle node). Node bars sit in layers left to right (by topological
     depth, roots = names that never appear as a `target`); a bar's height is proportional to
     its throughput (the larger of what flows in vs. out), and every node prints its own name
     + total, not just the ribbons touching it.

     UNIT: `unit` (optional, e.g. `"T"` for "IDR trillion") is appended directly to every
     printed number, node totals AND link values alike, not just stated once in the `caption`,
     since a sankey this dense (TLKM's real tree prints 18 node totals and up to 17 link values on
     one canvas) has numbers far from the caption at the top, so the promise ("every chart
     carries its own numbers") holds better when the unit travels WITH each number instead of
     being inferred from a caption a reader may never look back at. Pre-scale `value`s to a
     sane range before writing the spec (divide raw IDR by 1e12 for `"T"`), the same
     "values are strings/numbers you pre-formatted" convention every other chart here uses.

     BRAND MOMENT: the gradient goes on the single DOMINANT root-to-leaf chain, not one
     isolated link: start at the biggest root, always follow the biggest outgoing link,
     until a leaf. That chain tells "where most of the money actually ends up" as one
     coherent thread; every node bar stays neutral regardless of whether it sits on the
     chain, so this is still ONE brand moment even though it spans several ribbons.

     SELF-CHECK: a node with both inflows and outflows whose sums disagree by more than 1.5%
     draws a visible hatched gap at the shortfall (never silently stretches either side to
     fit) AND the renderer warns, naming the node and both sums; sectors-api/data-quality.md
     documents that most real P&L trees do NOT reconcile, so this chart makes that visible
     instead of hiding it, the same "never fabricate to fit the frame" reasoning as
     waterfall's self-checking connector gap.

     AUTO-COLLAPSE: a link under ~2% of the root total is a collapse candidate, but only
     merges when a TARGET has 2+ such candidates (a lone small link merged alone would just
     rename that one real segment "Other (1)", losing its name for no decluttering benefit);
     the renderer warns naming exactly what got folded into the new "Other (n)" pseudo-source.
     Tuned against TLKM's real 17-edge tree below: it renders with NOTHING collapsed, every
     one of its 8 revenue segments (even the 0.3%-of-total "Fixed line telephone revenue")
     stays its own named sliver.

     Sanitize/warn: a non-numeric or non-positive `value` drops the link, named; a link whose
     `source` equals its `target` drops, named; a cycle (A -> B -> A) drops the CLOSING link
     (a layered layout needs a DAG), named, since a layered layout has no direction to draw a loop
     in. Caps: past ~24 links or ~5 layers, warns the diagram will run wide/thin.

     Sectors mapping: `get-segments/{symbol}.revenue_breakdown[]{value,source,target}` IS
     already Sankey edges (see sectors-api/endpoints.md), the full cascade from named revenue
     segments through Total Revenue, Cost of Revenue/Gross Profit, and Operating Income/
     Operating Expense down to its own cost sub-buckets. TLKM's real FY2024 tree reconciles
     EXACTLY at every level (8 segments sum to Total Revenue; Cost of Revenue + Gross Profit
     sum to Total Revenue; Operating Income + Operating Expense sum to Gross Profit; the 5
     opex sub-buckets sum to Operating Expense). `donut` still owns the simpler "top-level
     revenue mix" slide (top 4-5 segments + an Other bucket, one instant's composition, see
     the donut mapping above); reach for `sankey` when the story is the FULL decomposition,
     not just where revenue comes from but where it goes after. -->
<div data-chart="sankey" data-spec='{"unit":"T","caption":"TLKM FY2024 revenue, cost, and expense tree","links":[{"source":"Cellular telephone revenue","target":"Total Revenue","value":6.26},{"source":"Fixed line telephone revenue","target":"Total Revenue","value":0.479},{"source":"Interconnection revenues","target":"Total Revenue","value":9.187},{"source":"Data, internet and IT services revenues","target":"Total Revenue","value":94.338},{"source":"Network revenues","target":"Total Revenue","value":3.179},{"source":"IndiHome revenues","target":"Total Revenue","value":26.262},{"source":"Lessor transactions","target":"Total Revenue","value":3.029},{"source":"Others","target":"Total Revenue","value":7.233},{"source":"Total Revenue","target":"Cost of Revenue","value":41.202},{"source":"Total Revenue","target":"Gross Profit","value":108.765},{"source":"Gross Profit","target":"Operating Income","value":42.386},{"source":"Gross Profit","target":"Operating Expense","value":66.379},{"source":"Operating Expense","target":"Depreciation and amortization","value":32.643},{"source":"Operating Expense","target":"Personnel","value":16.807},{"source":"Operating Expense","target":"Interconnection","value":6.88},{"source":"Operating Expense","target":"General and administration","value":6.225},{"source":"Operating Expense","target":"Marketing","value":3.824}]}'></div>
```

`radar` and `multiline` share the same self/peer grammar: exactly one series gets `"self":true` (drawn solid in the brand gradient, on top), every other series is a peer and is drawn dashed and muted, auto-colored so a legend swatch always matches its line (never hand-pick peer colors, the renderer keeps them in sync). The renderer adds the legend automatically from `series[].name` (it renders for a single series too). A radar `maxValue` array shorter than `axes` silently falls back to 100 for the missing entries, give every axis its ceiling.

**Both are a one-subject-vs-2-3-peers tool, not an N-way one, and the renderer enforces this.** There are only 3 distinct peer colors; a 4th peer mathematically reuses the 1st peer's exact color, and the render logs a warning when that happens (`radar: N peer series exceeds the 3 distinct peer colors available`) rather than shipping two indistinguishable lines silently. An eval independently confirmed this two ways: reading the code (peer colors cycle `mod 3`) and rendering a real 5-series radar (two lines came out the same gray). If your story has 4+ genuinely comparable entities, or entities that don't share a natural "self" (a screener's result set, not one company vs its peers), reach for **table** above instead.

**Every chart is a promise: it must carry its own numbers, not just its shape.** An eval caught multiline shipping as a bare shape (a legend of names, zero values anywhere), forcing the reader to trust separate body copy to know how much anything moved, that's rule 10's "silence is a broken promise" from the other side, a visual silently omitting the number it exists to show. bar, line, donut, multiline, stackedbar, waterfall, table, timeline, scatter, heatmap, bump, and sankey all now print their own numbers by default (bar and waterfall label every bar's value, line and multiline print an endpoint value or %-change, donut auto-builds a label-plus-percentage legend, stackedbar labels each bar's total plus its in-place segment values, table IS the numbers, timeline's rows carry the data as text, scatter labels self plus each axis's outlier with its value, heatmap prints every cell's own value, bump prints the rank numbers down the left plus each line's final-day value, and sankey prints every node's own total plus its largest link values); radar is the one deliberate exception (see above) precisely because it's a shape-comparison chart type, not because numbers don't matter there too. `line` used to be an undocumented second exception (it printed nothing at all), now fixed, so radar is genuinely the only one. A `compose` chart (the escape hatch below) is held to the same promise mechanically: one that prints no number at all warns, so a novel shape can't quietly become the exception radar earned on purpose.

**Which Sectors API field maps to which chart** (the API is far richer than one chart per slide suggests, look here before defaulting to a bare stat):
- `peers[].peers_data.companies[].point_summaries` (value/competitive/future/financials/dividend, each `{point,maxpoint}`) → **radar**, this is a ready-made scorecard, normalize each `point/maxpoint*100` and feed the company itself as `self`. Check each axis actually **discriminates** across the companies first (an eval found "future" scored 100/100 for 10 different bank peers, a flat, meaningless spike), see `sectors-api/data-quality.md`. If an axis doesn't vary, build the radar from real individual ratios instead, and give it a per-axis `maxValue` array (see the radar comment above), a shared single `maxValue` silently distorts raw ratios of different scales.
- `valuation.historical_valuation[]{pe/pb/ps, *_peer_avg, year}` → **multiline**, self = the company's own ratio path, one peer series = the peer average, same years.
- `future.company_growth_forecasts[]{eps_growth,revenue_growth,estimate_year}` → **multiline**, two self-company series (no "peer" here, pick one as `self` for the fill and leave the other un-filled) or a **bar** if you only need one metric.
- `daily/{symbol}.close` for two tickers whose raw prices sit on very different scales (a blue chip vs. a small-cap peer) → **multiline** with **`"index":true`** (see the multiline comment above), never hand-indexed raw closes; the same field pair also feeds a cover **`duel`** backdrop, which accepts the same `"index":true`.
- `get-segments/{symbol}` `revenue_breakdown[]{value,source}` → **donut** for the top-level revenue MIX only (top 4-5 segments plus an "Other" bucket, one instant's composition; a >6-slice donut, or a 17-segment one, TLKM has that many, is unreadable no matter the chart type, so the editorial cut happens before the render, not in it). The SAME field's full `{value,source,target}` cascade, previously discarded past the `target === "Total Revenue"` filter, now feeds **sankey** instead when the story is the full decomposition (where revenue comes from AND where it goes after, cost of revenue vs. gross profit, operating income vs. expense, expense sub-buckets), see the sankey comment above.
- `dividend.historical_dividends`, `financials.historical_financials`, `daily/{symbol}` (single metric) → **bar** (year-over-year) or **line** (daily price). Add `benchmark` (see above) when the verdict is relative to a reference point the chart can show directly: `subsector/report/{slug}.statistics.filtered_median_pe` as the sector-median line over per-company P/E bars, or a trailing 5-year average of `financials.historical_financials` earnings as the benchmark over that same series' own line/bars.
- `ownership.major_shareholders[]` → **donut** (already the pattern).
- `future.analyst_rating_breakdown{strong_buy..strong_sell}` → **donut**, reporting consensus is fine (hard rule 2), recommending it is not, caption it "consensus" not a call to action.
- `financials_sector_metrics` bank composition (CASA, loan mix) over multiple periods → **stackedbar**.
- `foreign-flow/{symbol}.data[].net_foreign_inflow` (daily net foreign buying/selling) → **bar**, positive/negative days color automatically (`--gain`/`--loss`), the shape over a window tells the "foreign funds are leaving/returning" story on its own.
- `broker-summary/{symbol}/top.top_buyers[]`, `broker-activity/{code}/top.top_accumulations[]` (who's loading up on/distributing a stock) → the `ranking` helper block (deck-format.md), a league table of broker codes + net value, not a new chart type.
- `shareholders-composition/{symbol}.data[]` local-vs-foreign ownership shift by holder type, month over month → **stackedbar** (each month a bar, local/foreign as segments) if you're showing the *shift* across just a couple of series, **donut** if you only need one month's snapshot, or **heatmap** (`mode:"diverging"`, holder categories as rows, months as cols, each cell the month-over-month delta) when the story is BOTH which category moved AND when, in one glance. Check how many months actually came back first (`sectors-api/data-quality.md`, the current year can silently return partial months).
- `peers[].peers_data.companies[]{pe_ttm,market_cap,net_income}` (a peers report's ~10-way company list) or `brokers/top.results[]{gross,net}` (today's market-wide most-active brokers) → **scatter**, two independent axes at once ("cheap AND big," "high gross AND net-buying") that neither radar (3-peer ceiling) nor table (no clustering read) can show; `market_cap`'s low-trillions-to-hundred-trillion-plus range on IDX is exactly the case `yScale:"log"` exists for.
- `financials.historical_financial_ratio[]{profitability,leverage,liquidity,efficiency}` several metrics across several years → **heatmap** (`mode:"sequential"`), a metric x year matrix in one glance instead of one bar chart per metric.
- `financials.historical_financials` revenue/opex/provision/interest-expense line items across two periods, when they genuinely reconcile to the earnings delta → **waterfall**, the start-period earnings as one `isTotal` bar, each line item's YoY change as a floating bar, the end-period earnings as the closing `isTotal` bar. Verify the math actually adds up before you build it (see the waterfall comment above), a lot of bank/company P&L fields don't cleanly reconcile.
- `companies/screen` or any screener recipe returning 4-10 tickers you want to compare on 2+ metrics at once (P/E and yield, say) → **table**, not a second `ranking` slide and not a radar (wrong shape for unrelated entities with no natural "self").
- `filings/{symbol}` an insider-buying/selling cluster, or `corporate_actions/{symbol}` a sequence of dated events → **timeline**, group same-session events under one coarse date label (see the timeline comment above) so a cluster reads as a cluster. `corporate_actions` mixes event types (`dividend`, `stock_split`, `agm`, `right_issue`, `warrant`, `bonus`); filter to ONE type before building the timeline, mixing them loses each type's own cadence, a dividend clip every quarter reads nothing like an AGM once a year.
- `most-traded/` `{date: [{symbol,volume}]}` across a multi-day window → **bump**, map each date key to one `days[].date` and its top-N array (already rank-ordered) to that day's `entries`; check first whether one symbol holds rank 1 the ENTIRE window (`sectors-api/endpoints.md` calls this pattern a story on its own), it becomes the auto-detected `highlight` with no field needed. `companies/top-changes` gainers/losers across several `periods` is the same shape (rank by period instead of by day) if the membership itself rotates period to period.
- `companies/top-changes` `top_gainers`/`top_losers` for a single classification × period (not the multi-period membership-rotation case above) → the `ranking` helper block (deck-format.md), rank + logo + name + value + delta, the plain "who moved most today/this week" shape.
- `most-traded/` a single day's top-N array (not the multi-day window above) → `ranking` for one metric, or `table` if you're also showing price alongside volume.
- `report.ownership.institutional_transaction_flow[]` → **bar** with sign coloring, the same shape as the `foreign-flow` mapping above (positive/negative bars color themselves via `--gain`/`--loss`).
- `report.future.technical_rating_breakdown` oscillator/moving-average indicator arrays → **do not chart**, 26 mixed-unit trading-desk signals sit below this format's altitude. Use the summary `donut` instead (`technical_rating_breakdown.summary{buy,sell,neutral}`, same pattern as the `analyst_rating_breakdown` mapping above).
- `news.results[].dimension` scores → **do not chart**, news is a hook source for the "why now" research step (SKILL.md step 1), not a data slide; charting a dimension score would present research metadata as if it were a market figure.

### compose: build a chart none of the 13 named kinds fit

The 13 kinds above carry almost every IDX story. `compose` is the escape hatch for the rare shape none of them fit: a slope or dumbbell, a lollipop, a gauge, a candlestick-style range, a bespoke annotated plot. **Reach for it only after checking that no named kind works** (a slope is often just a 2-point `multiline`; a lollipop is often a `bar`). It exists so a genuinely new shape doesn't force you to hand-roll `<svg>`, which is forbidden (the lint ERRORs on raw `<svg>`, because hand-rolled SVG escapes every brand law).

You describe the chart **declaratively** as governed layers and the renderer assembles it from the same primitives the named kinds use, so a composed chart still cannot drift off-brand:

- **Colors are semantic tokens only**, never raw hex: `self` (the subject, drawn in the brand pink→gold when `gradient:true`), `gain`/`loss` (the +/− greens/reds), `peer0`/`peer1`/`peer2` (the 3 peer colors, same ceiling as radar/multiline), `muted`, `text`. A raw hex or a 4th peer is a lint ERROR.
- **`gradient:true`** on a `line`/`area`/`bar`/`path` paints it in the house pink→gold. That's the one brand moment; use it on the subject, not everything.
- **Numbers render in mono automatically**, and the promise is enforced: a compose chart that prints **no** number at all (no axis ticks, no dot/refLine label, no value label) warns. Give it at least one real figure.
- **Coordinates are DATA values**, mapped through the scales you declare (`x`/`y`: `linear`, `band` for categories, or `log`); omit a scale and it's auto-derived from your points (bar/area force `0` into the y-range so bars stay honest). Axes are **opt-in** (`axes:{x,y}`); leave them off for a shape that reads without a grid, turn them on when position carries the meaning.

Marks: `line`, `area`, `bar`, `dot` (a 3rd element in a point `[x,y,"label"]` labels it), `rect`, `path` (`close`/`fill` optional), `refLine` (`axis`+`value`+`label`, a dashed reference), `label` (`at:[x,y]`, or pixel coords with `px:true`), `legend`.

<!-- compose: a slope chart (2-point trend per company): a shape no named kind draws cleanly.
     band x for the two periods, one gradient self line + one muted peer line, each end-labeled,
     a dashed sector refLine, y-axis on so the ROE scale is legible. -->
<div data-chart="compose" data-spec='{"caption":"ROE, FY24 → FY25","x":{"type":"band","domain":["FY24","FY25"]},"y":{"type":"linear","domain":[0,30]},"axes":{"y":{"label":"ROE %","ticks":[0,15,30]},"x":{}},"layers":[{"mark":"line","points":[["FY24",18.4],["FY25",24.1]],"gradient":true,"width":5},{"mark":"line","points":[["FY24",16.0],["FY25",15.2]],"color":"peer0","width":4},{"mark":"dot","points":[["FY25",24.1,"BBRI 24.1%"]],"color":"self"},{"mark":"dot","points":[["FY25",15.2,"sector 15.2%"]],"color":"peer0"},{"mark":"refLine","axis":"y","value":15,"label":"sector median 15%","color":"muted"}]}'></div>

