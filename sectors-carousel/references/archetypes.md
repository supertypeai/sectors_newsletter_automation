# Archetypes (the slide layout library)

Split out of `references/visual-language.md` so a runtime agent loads only this file when picking a slide layout. The core contract (the three laws, canvas, design tokens, type ramp, layout primitives, logos, cover/outro, anti-patterns) stays in `visual-language.md`; the chart placeholder vocabulary lives in `references/charts.md`.

**Use this index first.** Pick the archetype that fits the slide's job, then read only that archetype's own entry below. You do not need to read all fifteen to compose one slide. Remember the two rhythm rules from `SKILL.md` step 7 while picking across a deck: no two adjacent content slides share a family, and density alternates, no two dense slides back to back.

## Family index (5 families, 15 archetypes)

| family | archetypes | anchor | density | when to use |
|---|---|---|---|---|
| Hero | H1 The Verdict Number | stat | sparse | a single figure IS the story |
| Trend | T1 The Arc, T2 The Duel, T3 The Cluster, T4 The Leaderboard | chart | medium (T4 dense) | a chart across time: one series, self vs peer, dated events, or a rotating leaderboard |
| Scorecard | S1 The Fact Grid, S2 The Field, S3 The Map, S4 The Roster, S5 The Grid | grid / chart | dense | several metrics or entities at once |
| Breakdown | B1 The Mix, B2 The Shift, B3 The Bridge, B4 The Flow | chart | medium (B4 dense) | composition: a snapshot, a shift across periods, a bridge, or a multi-level flow |
| Closer | C1 The Payoff | prose | sparse | the closing verdict slide, no chart, right before the outro |

## Archetypes (copy, adapt, keep the floor high)

Fifteen named archetypes across five families. Each is tagged on four axes, **family**
(what kind of slide this is), **anchor** (the one dominant element), **density** (sparse /
medium / dense), **structure** (`centered` / `distributed`). The tags aren't decoration,
they're what the variation and rhythm checks in `SKILL.md` step 7 run against: **no two
adjacent content slides share a family**, and **density alternates** (no two dense slides
back to back). Picking archetypes on purpose, not by inertia, is what keeps an 6-8 slide
deck from reading as "chart, chart, chart, chart." Every one of the 13 named `data-chart` kinds
now anchors a named archetype, table, timeline, and waterfall included (added from real
eval convergence), and scatter, heatmap, bump, and sankey too, so the library covers the
full chart vocabulary, not just its original six. (`compose` is the 14th kind but anchors no
archetype on purpose: it's the rare-shape escape hatch, not a recurring layout, so it stays out
of the rhythm library.)

### Family: Hero (the single number, sparse)

**H1 · The Verdict Number** — `anchor:stat` `density:sparse` `structure:centered`. One big number is the whole slide; use when a single figure IS the story (a valuation low, a yield high).
```html
<div class="stack" style="gap:24px;flex:1;justify-content:center;">
  <div class="label">P/E, TRAILING</div>
  <div class="num autofit" style="font-size:172px;line-height:0.92;">12.4×</div>
  <div class="body">The cheapest <span class="logo-inline" data-logo="BBCA"></span>BBCA has traded in three years. <span class="gradient-text">Down from 21.5×</span> in 2024.</div>
</div>
```

### Family: Trend (a chart across time, medium density)

**T1 · The Arc** — `anchor:chart` `density:medium` `structure:distributed`. The workhorse: a single series (bar or line) proving a change over time.
```html
<div class="stack" style="gap:34px;flex:1;justify-content:space-between;">
  <div>
    <div class="kicker">EARNINGS · YOY</div>
    <div class="title" style="margin-top:14px;">Profit kept <span class="gradient-text">climbing</span> for five years</div>
    <div class="caption-t" style="margin-top:10px;">annual net profit · Rp trillion</div>
  </div>
  <div data-chart="bar" data-spec='{"bars":[…]}'></div>
  <div class="body">Net profit rose 83% since 2021. The verdict is on the multiple, not the earnings.</div>
</div>
```

**T2 · The Duel** — `anchor:chart` `density:medium` `structure:distributed`. Same shape as The Arc, but the chart is a `multiline` (self vs. a peer or peer average over the same window), so the verdict is relative, not absolute.
```html
<div class="stack" style="gap:28px;flex:1;justify-content:space-between;">
  <div>
    <div class="kicker">INDEXED PRICE · 30D</div>
    <div class="title" style="margin-top:14px;"><span class="logo-inline" data-logo="BBRI"></span>BBRI <span class="gradient-text">underperformed</span> its closest peer</div>
  </div>
  <div data-chart="multiline" data-spec='{"series":[{"name":"BBRI","self":true,"area":true,"values":[…]},{"name":"BBCA","values":[…]}]}'></div>
  <div class="body"><span class="logo-inline" data-logo="BBCA"></span>BBCA gained 9% while BBRI slipped 15.6% over the same window.</div>
</div>
```

**T3 · The Cluster** — `anchor:chart` `density:medium` `structure:centered`. A `timeline` of dated events, grouped by same-session cluster; reach for it when the story is WHEN something happened (a quiet stretch, then a burst), not a value moving on a shared axis.
```html
<div class="stack" style="gap:20px;flex:1;justify-content:center;">
  <div class="title">A quiet stretch, then a <span class="gradient-text">cluster</span> in one afternoon</div>
  <div data-chart="timeline" data-spec='{"events":[{"date":"12 Sep 2025","label":"Commissioner buys 50,000 shares"},{"date":"3 Mar 2026, afternoon","label":"President Commissioner buys 317,900 shares","detail":"14:26 · Rp 6,982/share"},{"date":"3 Mar 2026, afternoon","label":"Director A buys 200,000 shares","detail":"14:29 · Rp 6,982/share"}]}'></div>
</div>
```

**T4 · The Leaderboard** — `anchor:chart` `density:dense` `structure:distributed`. A `bump` chart, a ranked leaderboard over time; reach for it when the story is WHO holds a spot, membership rotating day to day, not a value trending on a shared scale.
```html
<div class="stack" style="gap:20px;flex:1;justify-content:space-between;">
  <div>
    <div class="kicker">TOP 5 BY VOLUME · 7D</div>
    <div class="title" style="margin-top:14px;">One name never left the <span class="gradient-text">top spot</span></div>
  </div>
  <div data-chart="bump" data-spec='{"days":[…]}'></div>
  <div class="body">ABCD held rank 1 every single day; the other four slots rotated through six different names.</div>
</div>
```

### Family: Scorecard (several metrics at once, dense)

**S1 · The Fact Grid** — `anchor:grid` `density:dense` `structure:centered`. 2-4 keyfacts, use 2 or 4, never a 3+1 orphan.
```html
<div class="stack" style="gap:40px;flex:1;justify-content:center;">
  <div class="title">The funding base is the moat</div>
  <div class="b-keyfacts cols-2">
    <div class="glass card"><div class="label">CASA RATIO</div><div class="value num">84.3%</div></div>
    <div class="glass card"><div class="label">NPL RATIO</div><div class="value num">1.65%</div></div>
    <div class="glass card"><div class="label">ROE</div><div class="value num">20.4%</div></div>
    <div class="glass card"><div class="label">YIELD TTM</div><div class="value num">6.0%</div></div>
  </div>
</div>
```

**S2 · The Field** — `anchor:chart` `density:dense` `structure:centered`. A `radar` scorecard, self vs 2-3 peers across several axes at once, `peers[].peers_data.companies[].point_summaries` is built for exactly this.
```html
<div class="stack" style="gap:28px;flex:1;justify-content:space-between;">
  <div>
    <div class="kicker">PEER SCORECARD</div>
    <div class="title" style="margin-top:14px;"><span class="logo-inline" data-logo="BBRI"></span>BBRI <span class="gradient-text">leads</span> on scale, not efficiency</div>
  </div>
  <div data-chart="radar" data-spec='{"axes":["ROE","NPL","CASA","Div Yield","Growth"],"series":[{"name":"BBRI","self":true,"values":[…]},{"name":"BBCA","values":[…]}]}'></div>
  <div class="body">Across five scorecard axes, BBRI trails <span class="logo-inline" data-logo="BBCA"></span>BBCA on asset quality (80 vs 55) and funding cost.</div>
</div>
```

**S3 · The Map** — `anchor:chart` `density:dense` `structure:centered`. A `scatter` plot, two independent axes at once (cheap AND big); reach for it when entities don't share one natural scale the way bar/multiline's y-axis does, and the clustering itself is the point, not just each entity's own number.
```html
<div class="stack" style="gap:20px;flex:1;justify-content:center;">
  <div class="title">Cheap AND big is the <span class="gradient-text">rare</span> combination</div>
  <div data-chart="scatter" data-spec='{"xLabel":"P/E, trailing","yLabel":"Market cap","yScale":"log","points":[…]}'></div>
</div>
```

**S4 · The Roster** — `anchor:chart` `density:dense` `structure:centered`. A `table`, N tickers x M metrics all visible at once; reach for it past ranking's one-metric-plus-delta ceiling, a screener result or sector roster with no natural "self."
```html
<div class="stack" style="gap:20px;flex:1;justify-content:center;">
  <div class="title">Five cheapest blue chips, three metrics at once</div>
  <div data-chart="table" data-spec='{"columns":["P/E","Yield","Mkt Cap"],"rows":[…]}'></div>
</div>
```

**S5 · The Grid** — `anchor:chart` `density:dense` `structure:centered`. A `heatmap`, a category x time/metric matrix in one glance; reach for it when the story is BOTH which category moved AND when, not just one snapshot or one trend line. (Scorecard, not Breakdown: a heatmap's cells are independent measurements across two axes, not parts summing to a whole the way donut/stackedbar/waterfall/sankey are, so it sits with the family's other "many data points at once" members.)
```html
<div class="stack" style="gap:20px;flex:1;justify-content:center;">
  <div class="title">Where the <span class="gradient-text">accumulation</span> happened last month</div>
  <div data-chart="heatmap" data-spec='{"mode":"diverging","rows":[…],"cols":["Sep","Oct","Nov","Dec"],"values":[…]}'></div>
</div>
```

### Family: Breakdown (composition, medium density)

**B1 · The Mix** — `anchor:chart` `density:medium` `structure:centered`. A `donut`, one instant's composition (ownership, analyst consensus, a segment mix cut to top-N + Other).
```html
<div class="stack" style="gap:34px;flex:1;justify-content:center;">
  <div class="title">Family <span class="gradient-text">still</span> holds control</div>
  <div data-chart="donut" data-spec='{"segments":[{"pct":54.9,"color":"#E5337E"},{"pct":45.1,"color":"#3A332E"}],"centerLabel":"54.9%","centerSub":"FOUNDING FAMILY"}'></div>
  <div class="body">One shareholder still holds an outright majority, five years after the IPO.</div>
</div>
```

**B2 · The Shift** — `anchor:chart` `density:medium` `structure:distributed`. A `stackedbar`, the same composition's mix changing across periods (loan book mix, funding mix, revenue segment mix by year).
```html
<div class="stack" style="gap:28px;flex:1;justify-content:space-between;">
  <div>
    <div class="kicker">LOAN BOOK MIX</div>
    <div class="title" style="margin-top:14px;">Micro-lending is <span class="gradient-text">most</span> of the book</div>
  </div>
  <div data-chart="stackedbar" data-spec='{"bars":[{"label":"2023","segments":[…]},{"label":"2025","segments":[…]}],"legend":[…]}'></div>
  <div class="body">Micro-lending has held near half the loan book for three straight years.</div>
</div>
```

**B3 · The Bridge** — `anchor:chart` `density:medium` `structure:distributed`. A `waterfall`, a start total, named +/- contributors, an end total; reach for it when the verdict is what actually moved a number (an earnings bridge, a margin walk), not just its before/after shape.
```html
<div class="stack" style="gap:20px;flex:1;justify-content:space-between;">
  <div class="title">What actually moved <span class="logo-inline" data-logo="BBNI"></span>BBNI's earnings</div>
  <div data-chart="waterfall" data-spec='{"bars":[…]}'></div>
  <div class="body">Revenue grew across every line. A bigger loan-loss provision cost more of it than opex did.</div>
</div>
```

**B4 · The Flow** — `anchor:chart` `density:dense` `structure:distributed`. A `sankey`, a multi-level flow decomposition; reach for it when a donut's one level of the tree isn't enough, the story is where something comes from AND where it goes after.
```html
<div class="stack" style="gap:20px;flex:1;justify-content:space-between;">
  <div class="title">Most of it comes from <span class="gradient-text">one place</span></div>
  <div data-chart="sankey" data-spec='{"unit":"T","links":[…]}'></div>
</div>
```

### Family: Closer (no chart, sparse prose payoff)

**C1 · The Payoff** — `anchor:prose` `density:sparse` `structure:centered`. The closing verdict slide, right before the outro, no chart, no grid, just the synthesis.
```html
<div class="stack" style="gap:28px;flex:1;justify-content:center;">
  <div class="title">The exit was about <span class="gradient-text">Indonesia</span>, not the bank.</div>
  <div class="glass"><div class="body">ROE held at 20.4% through six months of selling. When MSCI flagged Indonesia's transparency, foreign funds trimmed their most liquid position. Net Q2 outflow: Rp 8.9T. The November review is the next checkpoint.</div></div>
</div>
```

Rankings and comparisons in running prose (a league table, top buyers/sellers) still don't get their own archetype. The line that separates the two: every named `data-chart` kind anchors a named archetype, all 13 of them now, but `ranking`/`comparison` are `blocks[]` helpers from `deck-format.md`, not chart kinds, so they decorate whichever family's anchor they're dropped into rather than anchoring one themselves. `compose` is the other non-anchoring kind, deliberately: it's the escape hatch for a one-off shape, not a repeatable layout, so it earns no family slot.

