# Scene kinds (the story's building blocks)

Unlike the carousel's 15 slide archetypes across 5 families, even a long-form video only has
room for a double-digit handful of scenes, so the scene vocabulary is deliberately small:
**five roles**, each doing one job. Pick the role by what the beat needs to prove, not by
habit. Both themes render the same five roles (see `themes.md` for how the decoration
differs). A `"short"` storyboard (10-15s) uses 3-6 of them; a `"long"` storyboard (~45-75s)
chains more proof scenes back to back — see `references/length.md` for how that chain is built
and `references/narrative-approaches.md` for how the ending (`takeaway` vs. a teaser) changes
with the chosen narrative approach.

## Index

| role | job | anchor | typical duration |
|---|---|---|---|
| `cover` | the hook — open the story | headline + optional stat/logos | 2.5-3.2s |
| `stat` | one figure IS the beat | a big gradient number | 2.2-3.0s |
| `chart` | a trend across time | a bar or line chart | 3.0-3.8s |
| `breakdown` | composition or structure | a numbered list or ownership tree | 2.6-3.6s |
| `takeaway` | the closing verdict, pre-outro | a single plain sentence | 1.6-2.2s |

An automatic brand outro (~2.2s) appends after the last authored scene unless
`"outro": false`. Never author outro copy beyond `headline`/`emphasis`/`tagline` — same
convention as the carousel's fixed outro primitive.

## `cover`

The opening beat carries the hook: headline + `emphasis` (the one gradient word, the verdict
— never the whole headline). Optionally add `tickers` (a small logo row) and/or `stat` (the
numeric proof with an optional `compare`). Don't put a chart here — the cover's job is to make
someone keep watching for 10 more seconds, not to prove anything yet.

```jsonc
{ "role": "cover", "duration": 3.0, "kicker": "IDX · DIVIDENDS",
  "headline": "A high yield, the hard way.", "emphasis": "hard way",
  "tickers": ["BBRI"],
  "stat": { "value": "12%", "label": "DIVIDEND YIELD", "compare": { "value": "6.8%", "label": "10Y BOND" } } }
```

## `stat`

One number is the whole beat. Use when a single figure, seen large, needs no chart to land
("Sultan stocks. 96% owned by insiders."). Add a one-line `headline` underneath only if the
number needs a verdict spelled out; a genuinely self-explanatory number (a payout ratio next
to its own label) doesn't.

```jsonc
{ "role": "stat", "duration": 2.6, "kicker": "PAYOUT RATIO",
  "stat": { "value": "85%", "label": "OF NET PROFIT PAID OUT" },
  "headline": "The dividend isn't growing. It's being defended.", "emphasis": "defended." }
```

## `chart`

A trend needs to be SEEN changing, not just stated. `bar` for a small number of discrete
periods (3-5 years of a metric); `line` for a continuous path with a peak or a crash worth
marking (`peakLabel`). Always pair the chart with a `caption` naming the unit, and optionally
a `body` line that states the so-what once the chart has had time to register.

```jsonc
{ "role": "chart", "duration": 3.4,
  "headline": "In two days, it vanished.", "emphasis": "vanished.",
  "chart": { "kind": "line", "values": [100,108,121,132,126,108,91,88,90], "peakLabel": "ATH 9,174", "caption": "down ~31% this year" },
  "body": "$80B erased. Worst rout in ~30 years." }
```

## `breakdown`

Structure or composition, not a trend. `list` for "what this entity controls/consists of"
(a numbered rundown, 2-5 items). `ownership` for a parent -> child (-> grandchild) stake
chain — the one place a story shows WHO owns WHAT, which is Sectors' whole reason to exist,
so don't skip the logo on a node that has a ticker.

```jsonc
{ "role": "breakdown", "duration": 3.2, "kicker": "WHO OWNS THE NOODLE MAKER",
  "breakdown": { "kind": "ownership",
    "nodes": [ { "name": "Indofood Sukses Makmur" }, { "ticker": "ICBP", "name": "Indofood CBP", "sub": "the Indomie maker" } ],
    "links": [ { "pct": "80%" } ] } }
```

## `takeaway`

One plain sentence, the verdict the whole piece was building to — when the narrative approach
is **storytelling** (see `references/narrative-approaches.md`). Never advice-framed ("buy",
"sell", "should hold") — hard rule 2 applies here exactly as it does in the carousel skill.
"A high yield can be a warning, not a reward." states a finding; "You should sell" prescribes
one. If a draft takeaway reads like the second, rewrite it as the first before it ships.

When the narrative approach is **teaser**, the final `takeaway` scene does NOT resolve the
question the piece raised — it names the open question plainly and points at where the answer
lives (the outro `tagline`, or an explicit "part 2" mention), still never advice-framed. See
`references/narrative-approaches.md` for the copy pattern.

## Sequencing a story (which roles to combine)

A `"short"` (3-6 scene) story almost always follows: **`cover` -> one or two proof scenes
(`chart` / `stat` / `breakdown`, whichever the beats actually need) -> `takeaway`**. There's no
fixed "always follow chart with stat" rule the way the carousel enforces family/density
alternation across 8 slides — at 3-6 scenes there usually isn't a repeat to worry about. If a
story DOES repeat a role (two `chart` scenes back to back, say a price crash then a recovery),
that's fine as long as each proves something new; the tell that it's NOT fine is if the second
one could caption the same chart with different numbers and still sound right (the same
portability test the carousel's step-7 self-review uses).

A `"long"` (8-18 scene) story is the same shape stretched: **`cover` -> a chain of proof scenes
covering more ground (history/origin, structure, a metric over more years, a fun fact,
ownership) -> `takeaway`**. More scenes means more ROOM for a history-timeline beat (a `chart`
or `breakdown` scene dated years apart) and a fun-fact beat (usually a `stat` or `breakdown`
scene) that a short piece has no room for — see `references/length.md`'s beat-budget table.

## Marker and badge decoration (thread theme only)

Every scene in a "thread" story rides a marker on the drawn thread line
(`scene.marker`, defaults to a colored dot, or a company logo if the scene names a ticker).
`badges` (stacked pills) are the thread theme's way to show 1-3 short supporting facts next
to a `stat` or `breakdown` scene (a rate change, a comparison figure, a regulatory fact) — see
`samples/msci-relegation.storyboard.json`'s stat scene for a worked example. Don't use badges
in a noir story; the noir theme has no renderer for them.
