# Themes: "noir" vs "thread"

Two distinct, deliberate visual systems, not a light/dark toggle on one design — each was
reverse-engineered from a real reference video the team already produced. Pick the theme by
**story shape**, not by preference.

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

**Use for**: a market-wide or news-driven story — an index reshuffle, a regulatory shift, a
sector-wide move, anything framed as "here's what happened and why it matters" rather than one
company's internal case. The dotted thread visually means "this is all one connected event."

## Picking between them

| story shape | theme |
|---|---|
| one company, its structure/history/numbers | noir |
| a market/index/regulatory event, several actors | thread |
| a single ticker's earnings or dividend story | noir |
| "why did the whole market move this week" | thread |

If genuinely unsure, ask which lens the user wants rather than guessing — the two read as
different products, not different moods of the same one.

## What's shared vs. per-theme

Both themes render the exact same `storyboard.json` scene contract (see
`storyboard-format.md`) — role, headline, emphasis, stat, chart, breakdown all mean the same
thing regardless of theme. Only the DECORATION differs: background, kicker style, headline
font, badge/pill treatment, and the persistent chrome (noir's corner badge + footer vs.
thread's drawn line + markers). This is deliberate: composing a story never requires deciding
per-field which theme you're in, only the top-level `"theme"` key.

Charts (`LineChart`, `BarChart`, `OwnershipTree`) are shared components parameterized by a
color palette per theme, not reimplemented per theme, so both themes get the same chart
kinds and the same animation behavior.
