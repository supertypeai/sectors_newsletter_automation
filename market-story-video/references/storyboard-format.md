# Storyboard format (the `storyboard.json` contract)

`node scripts/render.mjs <storyboard.json> --out <dir>` turns this JSON into an MP4, either a
10-15s short or a ~45-75s long-form piece (see `"length"` below and `references/length.md` for
which fits the ask). You (the agent) author the storyboard; the renderer (Remotion) is
deterministic. Every value must be real (see `sectors-api/data-quality.md`) and on-voice
(`writing/writing.md`). Run `node scripts/storyboard-lint.mjs <storyboard.json>` before
rendering.

## Envelope

```jsonc
{
  "theme": "noir",              // "noir" | "thread" | "product" — see themes.md
  "length": "short",            // "short" (10-15s, default) | "long" (~45-75s) | "reel" (12-18s, product only) — see length.md
  "tickers": ["BBRI"],           // every ticker this piece is about (omit for a product reel, which names none)
  "sourceDate": "9 Jul 2026",    // bare date, stamped once for the whole video (noir only; thread/product have no footer)
  "scenes": [ /* Scene objects, see below */ ],
  "outro": {                     // optional; omit for the default brand sign-off
    "headline": "Know who owns it.",
    "emphasis": "owns it.",      // exact substring of headline — the one gradient word
    "tagline": "sectors.app/idx/bbri"   // see the tagline rule below
  }
}
```

Set `"outro": false` to suppress the outro entirely (rare — almost every piece should end on
the brand sign-off, same as the carousel's `autoOutro`).

**Tagline is the story's link back to its source, not a slogan.** For a single-ticker story
(one entry in `tickers`), it must be that ticker's own page: `sectors.app/idx/<ticker>`,
lowercase (e.g. `sectors.app/idx/pgeo`, `sectors.app/idx/bbca`) — a viewer who wants to verify
a number should land exactly where it lives, not on the homepage. Omitting `outro` entirely
gets this for free (the renderer fills it in from `tickers[0]`); only hand-author a `tagline`
when the story covers 2+ tickers or a theme/sector with no single ticker page, in which case
`sectors.app` (bare) is the fallback.

## Scene

Every scene needs `role` and `duration` (seconds); everything else is role-appropriate. The
five market-story roles are below. The product theme adds three more (`feature`/`demo`/`cta`)
and a reworked `cover` — those are documented in `references/product-reel.md`, not here.

```jsonc
{
  "role": "cover" | "stat" | "chart" | "breakdown" | "takeaway",  // + feature|demo|cta in the product theme
  "duration": 3.0,                 // seconds. 1.2-6s is the readable range per scene (motion.md)
  "kicker": "IDX · DIVIDENDS",      // small eyebrow label, optional but almost always present
  "headline": "A high yield, the hard way.",
  "emphasis": "hard way",          // EXACT substring of headline — the one gradient word (lint ERRORs on a mismatch)
  "body": "one supporting line",   // optional, chart/stat scenes only
  "tickers": ["BBRI"],             // tickers THIS scene names — drives the logo(s)/thread marker shown
  "stat": { "value": "12%", "label": "DIVIDEND YIELD", "compare": { "value": "6.8%", "label": "10Y BOND" } },
  "chart": { "kind": "bar" | "line", /* see below */ },
  "breakdown": { "kind": "list" | "ownership", /* see below */ },
  "badges": [ { "text": "Float rule 7.5% → 15%", "color": "pink" } ],  // "thread" theme only
  "marker": { "kind": "dot" | "logo", "color": "pink" }                // "thread" theme only, optional override
}
```

### `role: "cover"` — the hook

The opening beat. Headline + emphasis is the hook (same discipline as the carousel's cover:
one gradient word, the verdict, not a data dump). Optionally carries `tickers` (renders a
small logo row) and/or `stat` (the numeric proof, with an optional `compare`).

### `role: "stat"` — a single figure IS the story

A big gradient number plus label, optionally a `compare`, optionally a one-line `headline`
underneath giving it a verdict. Use when one number carries the whole beat (carousel's H1
"Verdict Number" archetype, ported to video).

### `role: "chart"` — a trend across time or a small breakdown

```jsonc
"chart": { "kind": "bar", "bars": [ { "label": "2025", "value": 56.7, "display": "56.7" } ], "caption": "IDR T · net profit" }
"chart": { "kind": "line", "values": [100, 108, 121, 91, 88], "peakLabel": "ATH 9,174", "lowLabel": "IDR 775 · 8 Jun", "endLabel": "IDR 940 · now", "caption": "down ~31% this year" }
```
`bar` grows sequentially bar-by-bar; `line` draws on left-to-right with an area fill and up to
three optional call-outs, each only appearing once the drawn line has actually reached that
point: `peakLabel` above the series' highest value, `lowLabel` below its lowest, `endLabel`
next to the final/current point (alongside its dot) — use `lowLabel`/`endLabel` whenever the
story's beat is specifically about a trough-then-recovery shape, so the reader sees the exact
low and current price, not just the line's general direction. Only these two chart kinds exist
in v1 — reach for `role: "breakdown"` with `kind: "ownership"` for a parent/child structure
instead of forcing it into a chart.

### `role: "breakdown"` — composition or structure

```jsonc
"breakdown": { "kind": "list", "items": [ { "label": "PALM OIL", "sub": "plantations" }, { "label": "FLOUR", "sub": "Bogasari mills" } ] }
"breakdown": {
  "kind": "ownership",
  "nodes": [ { "ticker": "AALI", "name": "Indofood Sukses Makmur" }, { "name": "Indofood CBP", "sub": "the Indomie maker" } ],
  "links": [ { "pct": "80%" } ]
}
```
`ownership`'s `nodes.length` must equal `links.length + 1` (top-to-bottom chain). A holding
entity with no ticker just omits `ticker`.

### `role: "takeaway"` — the pre-outro verdict

A short, plain statement, never advice-framed (hard rule 2 — describe, don't prescribe). This
is the beat right before the brand sign-off; keep it to one sentence.

## Timing

Total video length (all scenes + the ~2.2s outro) must land in the story's target band for
`storyboard.length`:

| `length` | total target | scene count | `scripts/storyboard-lint.mjs` |
|---|---|---|---|
| `"short"` (default) | 10-15s | 3-6 scenes | errors outside 9-16s, warns outside 10-15s |
| `"long"` | 45-75s | 8-18 scenes | errors outside 40-80s, warns outside 45-75s |

Fewer scenes than the band and the piece feels thin; more and no single beat gets room to land.
See `references/length.md` for how to pick between the two and how a long-form beat sequence
differs from a short one.

## Rules the renderer assumes you followed

- `emphasis` is an EXACT, case-sensitive substring of its `headline` (mirrors the carousel's
  `brand-lint.mjs` emphasis-match ERROR) — a mismatch throws at render time here, not just a
  lint warning, since there is no separate "flat fallback" render path.
- Values in `stat`/`chart`/`breakdown` are pre-formatted display strings (`"IDR 689T"`,
  `"22.4×"`); `chart.bars[].value`/`chart.values` are raw numbers used only for geometry.
- No em/en dashes anywhere (brand voice, `writing/writing.md` §3) — the lint catches this.
- `badges`/`marker` are meaningful only in the "thread" theme; the noir theme ignores them.

See `samples/bbri-vs-bonds.storyboard.json` (noir) and
`samples/msci-relegation.storyboard.json` (thread) for complete worked examples.
