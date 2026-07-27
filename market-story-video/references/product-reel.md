# Product feature reels (the "product" theme)

A third theme alongside noir and thread, for a different job. Noir and thread tell a **market
story** from Sectors data. The product theme sells a **sectors.app feature**: what it does, the
app actually doing it, and where to go. Same brand shell, same render pipeline, same hard rules
against fabrication and advice. What differs is the subject (a product, not a ticker) and three
new pieces of machinery: a device frame to hold real app footage, a callout layer that points
into that footage, and a reserved corner for a talking head.

Read this file only when building a product reel. For a market story, ignore it entirely and
work from `themes.md` (noir/thread), `scenes.md`, and `storyboard-format.md` as before.

## The shape of a reel

Four beats, always in this order, 12-18 seconds total (`length: "reel"`):

1. **`cover`** — the hook. State the PROBLEM the viewer already has, not the feature name.
   Nobody stops scrolling for a product noun. "Six tabs to answer one question" earns the next
   ten seconds; "Introducing our Search Engine" does not.
2. **`feature`** — name the thing and say what it does for the viewer in one line. This is the
   only beat where the product name is the hero. The name renders in the brand gradient (the
   scene's one emphasis moment), with up to three capability chips under a one-line promise.
3. **`demo`** — the app working. This is the beat the whole reel exists to deliver, so it gets
   the longest duration and the least competing copy: one short headline above the device
   frame, the callouts inside it, nothing else. A reel with no demo is a claim with no proof.
4. **`cta`** — the close. One line, the brand mark, and the exact path a viewer types. The reel
   ends here, so set `"outro": false` (the CTA already carries the sign-off).

You can run two demo scenes back to back if the feature has two distinct moments worth showing,
but the demo(s) together should be at least a third of the reel's runtime. `storyboard-lint.mjs`
checks the four-beat structure, the ordering, the `outro: false` rule, and the demo share.

## Where the facts come from: `inputs/features.json`

Never describe a feature from memory. `inputs/features.json` is the source of truth: each entry
carries the feature's on-screen `name`, its `promise`, its capability `chips`, the strongest
`proof` fact, the `demo` asset, and the `cta` path. Compose the `feature`/`cover`/`cta` scenes
FROM that entry so two reels shipped a month apart describe the feature the same way.

If the feature isn't in the catalog, do not invent an entry. Ask the user for the promise, the
proof, and the destination; write the entry; then compose from it. Set the storyboard's
top-level `feature` key to the catalog key you built from, so the claims stay traceable.

Every entry has a `verified` field naming what it's grounded in. An entry whose claims you can't
tie to the product surface (a screenshot, a release note, a product owner's word) is a claim to
confirm with the user before it reaches a rendered frame, not a claim to ship.

## The demo scene in detail

```jsonc
{
  "role": "demo",
  "duration": 5.6,
  "kicker": "IN THE APP",
  "headline": "Type the question the way you'd say it.",
  "emphasis": "the way you'd say it.",
  "media": {
    "kind": "shot",                 // "clip" (a screen recording) | "shot" (a still)
    "src": "inputs/shots/search.png",
    "device": "browser",            // "browser" (default) | "phone" | "bare"
    "url": "sectors.app",           // browser frame only: what the fake address bar reads
    "pan": {                        // the Ken Burns move; OR use "focus" for a static hold
      "from": { "x": 0.7, "y": 0.18, "zoom": 1.0 },
      "to":   { "x": 0.7, "y": 0.18, "zoom": 1.45 }
    }
  },
  "callouts": [
    { "at": 1.1, "text": "Ask in plain English", "anchor": { "x": 0.706, "y": 0.169 }, "side": "below" }
  ],
  "cursor": [                       // a synthetic pointer path, mainly for a "shot"
    { "at": 0.3, "x": 0.4, "y": 0.55 },
    { "at": 1.4, "x": 0.6, "y": 0.169, "click": true }
  ],
  "body": "Companies, sectors, investors, all from one box."
}
```

### Coordinates are fractions of the SCREEN, not the canvas

Every `focus`, `pan`, `callout.anchor`, and `cursor` point is a 0-1 fraction of the app screen
inside the bezel: `{x:0.5, y:0.5}` is the middle of the app regardless of which device frame the
scene picked or how it's sized. This is what keeps a ring pinned to the search bar still pinned
to the search bar when the scene zooms in. To place a callout, open the screenshot, read the
target's position as a fraction of the image, and use that. The renderer applies the pan's
zoom to the anchor for you, so you author the anchor against the un-zoomed image.

### clip vs shot

- **`clip`** — a screen recording (`.mp4`/`.mov`/`.webm`). Use `trim: [start, end]` in SOURCE
  seconds to cut the segment you want; make the trimmed length match the scene `duration`
  (within ~0.3s) or the footage freezes on its last frame or gets cut short. A recording already
  has its own cursor, so do NOT add a synthetic `cursor` over a clip (two pointers show).
- **`shot`** — a still (`.png`/`.jpg`). No motion of its own, so this is where `pan` (a slow
  push/drift) and a synthetic `cursor` path do the work of making a screenshot read as an
  interaction. A `click: true` keyframe draws a ripple at that point.

### Callouts and cursor

A callout is a ring pinned into the footage plus a short pill naming what the viewer is looking
at. Keep it to a label (under 6 words) and to at most three per scene; give each an `at` time
with enough hold left in the scene to read (the lint warns under 0.6s). `side` puts the pill
left/right/above/below the ring; near a frame edge, point it inward. Pills are allowed to spill
past the bezel, so an edge callout won't get clipped.

The synthetic cursor eases through its keyframes in order (times must strictly increase). Use it
to walk the viewer's eye to the thing the callout names, landing a `click` where the interaction
happens.

## Footage you don't have yet

Compose the whole storyboard first, pointing `media.src` at where the file will live
(`inputs/demo/<name>.mov` for a recording, `inputs/shots/<name>.png` for a still). The lint and
the renderer both error if the file is missing, so you'll know exactly what to capture. For a
first draft with nothing recorded, the sample reuses `assets/brand/app-overview.png` (a real
sectors.app screenshot that ships with the skill) as a `shot` — a legitimate stand-in for the
overview/search surfaces, not for a feature it doesn't show.

Put recordings in `inputs/demo/` and stills in `inputs/shots/` (both git-ignored). `render.mjs`
resolves a relative `src` against the storyboard file first, then the skill root, and copies
each referenced file into `public/media/` so Remotion can serve it.

## The reel and the market-story roles

A product reel is a "product"-theme storyboard, so it may only use the product roles
(`cover`/`feature`/`demo`/`cta`) plus the shared `stat`/`takeaway` if a beat genuinely needs a
bare number or a closing line. `chart` and `breakdown` render (they reuse noir's components) but
the lint warns: a feature reel proves the product with a demo, not with a market chart. The
feature roles (`feature`/`demo`/`cta`) do NOT exist in noir/thread and error there.

## Worked example

`samples/financial-search-feature.storyboard.json` is a complete 14s reel: problem hook, the
Financial Search Engine named with three chips, a demo panning across the real overview
screenshot with two callouts and a cursor path, and a CTA to `sectors.app`. It has a talking-head
slot reserved (see `voiceover.md`). Start from it rather than a blank file.
