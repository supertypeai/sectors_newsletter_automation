# Length: "short" vs "long"

A third axis alongside theme (noir/thread) and narrative approach (storytelling/teaser) — see
`references/themes.md` and `references/narrative-approaches.md` for the other two. All three
are independent choices: any theme can pair with any length and any narrative approach.

## The two targets

| `storyboard.length` | total duration | scene count | fits |
|---|---|---|---|
| `"short"` (default) | 10-15s | 3-6 scenes | a single hook, one or two proof beats, a Reel/Short/TikTok meant to be watched in one pass |
| `"long"` | ~45-75s | 8-18 scenes | a fuller arc — a company's history timeline, its structure, several numbers, a fun fact — that needs more than a couple of proof beats to land |
| `"reel"` | 12-18s | 3-6 scenes | a product feature reel only (theme `product`): cover -> feature -> demo -> cta. See `references/product-reel.md`; the rest of this file is about market stories |

`scripts/storyboard-lint.mjs` and `scripts/render.mjs` both read `storyboard.length` (defaults
to `"short"` if the field is omitted, so existing storyboards need no change) and validate
against the matching band — see `storyboard-format.md`'s Timing section for the exact
thresholds.

## Picking between them

Ask, don't guess — the two are different production costs (a long-form render takes longer and
needs more scenes' worth of real, cited numbers) and different products, same as noir/thread.
Default recommendation: **short** for a single fresh news hook (an earnings beat, a dividend
announcement, a single surprising stat) where the story fits in one breath; **long** when the
ask explicitly wants a fuller history/timeline treatment of a company, or when step 2's beat
list survives ranking with 4+ genuinely distinct proof points (a short piece would have to cut
half of them).

## Building a long-form beat sequence

A long-form story is not a short story with padding — every added scene still has to prove
something new (the same portability test `scenes.md` applies to short pieces). A useful
beat-budget starting point for a company deep-dive (noir theme, storytelling approach):

1. `cover` — the hook (2.5-3.2s)
2. `breakdown` or `chart` — origin/founding fact, or the earliest data point in the timeline
3. `chart` — a multi-year metric (revenue, profit, price) with `peakLabel`/`lowLabel`/`endLabel`
4. `breakdown` (`kind: "ownership"`) — who controls it now
5. `stat` — the fun fact: an unusual number that doesn't fit the main trend line but is real
   and cited (ownership concentration, a founder's stake, a decades-old dividend streak, a
   record no peer holds)
6. `chart` or `stat` — a second proof point, recent, tying the history back to now
7. `takeaway` (or a teaser close, see `narrative-approaches.md`)

Adjust scene count/order to what the actual beats support — never insert a scene just to hit
the 8-scene floor. If the researched story only sustains 5 solid beats, ship it as `"short"`
instead of stretching thin ones to fill a long-form slot.
