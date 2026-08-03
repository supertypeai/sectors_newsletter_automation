# Sectors Carousel

A Claude Code Agent Skill that turns a topic into a finished Instagram carousel about the Indonesian stock market (IDX): real numbers from the Sectors API, a story written with deliberate craft, rendered to on-brand PNG slides that match the Sectors Content Studio look.

It runs locally through Claude Code on macOS or Windows. No design tools, no manual layout.

## Quick start

1. **Install once** (downloads the renderer's bundled Chromium):
   ```bash
   npm install
   ```
2. **Add your Sectors API key** (for live data):
   ```bash
   export SECTORS_API_KEY=your_key
   ```
3. **Use it from Claude Code.** Just ask, for example:
   - "Make a carousel about BBCA's latest earnings."
   - "Turn this week's IDX banking story into slides."
   - "What's a good IDX post this week?" then "build it."

   Claude reads `SKILL.md`, finds the story, pulls the data, writes the slides, and renders the PNGs into `output/`.

4. **Sanity-check the renderer** anytime with the worked example deck:
   ```bash
   node scripts/brand-lint.mjs samples/bbri-yield-vs-bonds.deck.json
   node scripts/render.mjs    samples/bbri-yield-vs-bonds.deck.json
   ```
   Slides land in `output/bbri-yield-vs-bonds/`.

## What you get

PNG slides at 2160×2700 (2x retina; the renderer also does 1080×1350 with `--scale 1`): a cover hook, content slides built from the block vocabulary (stats, price + 52-week range, earnings/dividend bars, ownership donut, peer bars, and more), and the fixed brand outro. Dark glassmorphism, the pink→gold brand gradient, real ticker logos, Plus Jakarta Sans + JetBrains Mono.

## Where things live

- **`SKILL.md`** how Claude uses the skill (the pipeline). Start here to understand the flow.
- **`references/`** the house style, the deck.json contract, the writing craft, and the Sectors API + data-quality rules.
- **`docs/`** maintainer research behind the data layer (endpoint reference, data catalog, screener deep-dive, test report).
- **`scripts/`** the renderer (`render.mjs` + `blocks.mjs` + `charts.mjs`), the lint, and the one-time asset builds.
- **`assets/`** the frozen house style: `styles/` (CSS with the fonts embedded), `logos.json`, cover art, brand art.

## Non-negotiables

Every figure on a slide comes from real Sectors data or a cited source (never fabricated), and the content is descriptive, never investment advice. See `references/sectors-api/data-quality.md` and `references/writing/brand-voice.md`.

---
Visual system ported from the internal `social-media-agent` (Remotion) project. Writing craft adapted from the [content-skills](https://github.com/artemnovitckii/content-skills) pack (MIT).
