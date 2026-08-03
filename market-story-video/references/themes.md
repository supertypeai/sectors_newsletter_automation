# Themes: "noir", "thread", "product"

Three deliberate visual systems, not moods of one design. The first two tell a **market story**
from Sectors data; the third sells a **sectors.app feature**. Pick by what the piece is FOR.

- Telling a market story from data (a ticker, an index event, an ownership structure)? It's
  noir or thread — read on.
- Promoting a product feature (introduce it, demo it, drive to it)? It's **product** — this
  section, then `references/product-reel.md` and `references/voiceover.md` for the full machinery.

## "noir" — reverse-engineered from `indofood-empire.mp4`

The video-native extension of the sectors-carousel brand: warm-black background, top nebula
glow, gold mono kicker, Plus Jakarta Sans headlines with one gradient emphasis word, JetBrains
Mono numbers, a persistent "Sectors" badge top-right and a persistent
`Source: sectors.app · as of {date}` footer bottom-left running the whole video (not
per-scene — one dated stamp for the whole piece, see `sectors-api/data-quality.md`'s "show the
date" rule).

**Use for**: a single company's deep-dive story — history, ownership structure, capital
allocation, a multi-year arc. Anything where the piece builds a case about ONE entity across
several proof points (the `indofood-empire.mp4` reference: what Indomie's parent controls, who
owns it, the payout math, the takeaway).

## "thread" — reverse-engineered from `indonesia-msci-connected.mp4`

A lighter, editorial system: cream/paper background with a faint grid, a single dotted
"thread" line that draws itself continuously top-to-bottom across the ENTIRE video (not
per-scene — it is the one persistent element tying every beat together, the visual metaphor
for "one connected story"), a small marker (a dot or a company logo) riding the thread at each
scene's moment, Lora serif headlines with italic-gradient emphasis, and stacked rounded pill
badges for supporting facts, color-coded (pink = the headline figure, green = a rate/percentage,
dark = a neutral fact).

The thread runs down the **left gutter**, inside the margin left of `SAFE.x`, and its markers
are sized to stay there. It used to wander through the centre of the frame at a much wider
amplitude, which put dots and logos straight through kickers, headlines and chart bars for the
whole runtime; the frosted panel behind a headline hid some of those collisions but nothing
protected a chart or an eyebrow label. Composing a thread story therefore needs no layout
allowance for the line — but if you change `ThreadLine`'s `centerX`/`amplitude`/marker size,
re-check the widest element on screen (the 900px chart box starting at x=90) still clears it.

**Use for**: a market-wide or news-driven story — an index reshuffle, a regulatory shift, a
sector-wide move, anything framed as "here's what happened and why it matters" rather than one
company's internal case. The dotted thread visually means "this is all one connected event."

## "product" — the feature-promo system

The warm-black brand shell (same palette and type ramp as noir, so a feature reel and a market
story read as the same publisher) plus the machinery a market story never needs: a **device
frame** holding a real screen recording or screenshot of the app, a **callout layer** of rings
and pills that point into that footage, a **synthetic cursor** for stills, and a reserved
**talking-head corner**. It carries the brand badge but no dated source footer (there's no
market figure on screen to date-stamp, and a stale date shortens an evergreen promo's shelf
life).

**Use for**: introducing or promoting a sectors.app feature — features intro, features demo,
CTA. It is a different job from a market story, with its own four-beat structure (cover ->
feature -> demo -> cta), its own `length: "reel"` (12-18s), its own roles, and a facts catalog
(`inputs/features.json`) instead of the Sectors API. Everything specific to it lives in
`references/product-reel.md`; the voiceover/talking-head half in `references/voiceover.md`.

## Picking between them

| what the piece is for | theme |
|---|---|
| one company, its structure/history/numbers | noir |
| a single ticker's earnings or dividend story | noir |
| a market/index/regulatory event, several actors | thread |
| "why did the whole market move this week" | thread |
| introduce/demo/promote a sectors.app feature | product |

Market story vs. product promo is a clear split (data story vs. selling the app). Between noir
and thread, if genuinely unsure, ask which lens the user wants rather than guessing — they read
as different products, not different moods of the same one.

## What's shared vs. per-theme

The market-story roles (`cover`/`stat`/`chart`/`breakdown`/`takeaway`) render the same
`storyboard.json` contract in noir and thread — role, headline, emphasis, stat, chart,
breakdown all mean the same thing; only the DECORATION differs (background, kicker style,
headline font, badge/pill treatment, persistent chrome). Composing a market story never
requires deciding per-field which theme you're in, only the top-level `"theme"` key.

One exception worth knowing before you author a benchmarked `stat`: thread's `stat` renderer
draws `stat.value` and `stat.label` only, and **ignores `stat.compare`**. Under thread, put
the benchmark in a `badges` entry ("Peer median: 17x") instead, or the comparison silently
disappears from the render with no lint error to warn you.

The product theme shares noir's palette, type ramp, and the `stat`/`chart`/`breakdown`/
`takeaway` renderers (it reuses noir's components rather than copying them), and adds four new
roles of its own (`feature`/`demo`/`cta`, plus a reworked `cover`). Those four exist only in
the product theme; the `feature`/`demo`/`cta` roles error if used under noir/thread, and the
market-story `chart`/`breakdown` roles merely warn under product (a feature reel proves the
product with a demo, not a market chart).

Charts (`LineChart`, `BarChart`, `OwnershipTree`) are shared components parameterized by a
color palette per theme, so every theme gets the same chart kinds and animation behavior.
