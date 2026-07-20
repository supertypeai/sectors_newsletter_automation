---
name: sectors-carousel
description: >-
  Generate on-brand Instagram carousel posts about the Indonesian stock market (IDX) from
  live Sectors financial data. Use whenever the user wants a carousel, social post, slides,
  or "content" about an IDX-listed company or ticker (BBCA, BBRI, TLKM, GOTO, ASII, BMRI, ...),
  about Indonesian-market news, earnings, dividends, valuations, ownership, foreign flows, or
  sector/screener rankings. Trigger even when the user just says "make a carousel about GOTO",
  "do a post on Indonesian banks", "turn BBCA's earnings into slides", or "what's a good IDX
  story to post this week", this skill handles the whole pipeline from topic to finished
  1080x1350 PNG slides in the Sectors house style. Do NOT use it for non-IDX markets, for plain
  text captions with no slides, or for editing an existing image.
---

# Sectors Carousel

Turn a topic into a finished, on-brand Instagram carousel about the Indonesian stock market: a real story found by research, real numbers from the Sectors API, slides that each land a verdict, rendered to PNG in the Sectors house style.

The thing that makes a carousel worth posting is **insight, not data**. A slide is never "here is a number", it is "here is what this number *means*". You are an editor with a point of view, not a dashboard. Two disciplines carry the whole skill:

- **Story first.** You find the angle by *research*, before you touch the data. The web tells you what story is worth telling this week; the Sectors API gives you the verified numbers to prove it. Skipping the research step is the difference between a post people save and a data dump they swipe past.
- **On-brand by construction.** You *free-code* each slide as HTML against the brand design system (`references/visual-language.md`). The renderer owns the brand frame, the fonts, the cover and outro, and draws charts and logos for you, so the look can never drift while you stay free to compose whatever the story needs.

## The pipeline

Work top to bottom. Each stage names the reference to open when you reach it; don't pre-load everything. First time on this machine, run **Setup** (bottom of this file), a one-time `npm install`, before step 7 needs to render; nothing earlier in the pipeline depends on it, so it's fine to do now or right before you render.

### 1. Understand the ask, then find the story (web search, not optional)

**First, check whether the request actually points at something.** Three shapes land here, and only two are ready to research:
- **A subject is named** ("BBCA", "the telecom selloff", "Indonesian banks", "TLKM vs EXCL"): proceed straight into this stage, no need to check in.
- **The choice is explicitly delegated** ("what's a good IDX story this week", "surprise me", "find something worth posting", "you pick"): also proceed straight in, per "if the ask is open" below, that's the whole point of that branch, the user already told you to use your judgment.
- **Neither.** A bare "let's make a carousel" / "create a post" / "generate content" names no subject and delegates nothing. Don't spend a web search or an API call guessing what the user meant, that's real time and real credits spent on a direction they might not have wanted. Ask one quick question instead: what to cover (a ticker, a comparison, a sector, a theme), and offer "you pick something timely" as one answer, so a user who genuinely wants your editorial judgment can say so in three words rather than being forced to name a subject just to satisfy the question. Once you have an answer, you're in one of the first two cases, proceed accordingly.

Settle the **subject** (a ticker, a head-to-head, a sector, a market theme) and **format** (default portrait 1080×1350). Then **use web search to find why this story matters now**: a fresh earnings release, a notable move, a dividend or buyback, a regulatory or macro shift (a BI rate decision), an index reshuffle, a flow story. This is mandatory even when the data alone looks interesting, the research is what gives the piece a reason to exist and a non-obvious angle. The web picks the **narrative**; the API supplies the **numbers**. Never let an unverified number from an article onto a slide.

**Recent is the story; history is the proof, not the headline.** The lead has to be something that actually happened or changed recently, not a standing fact that's always been true. A multi-year streak, a long-run ratio, a peer comparison is real evidence, it belongs in the beats to prove the recent thing is genuine or unusual, but it can't be what the piece is *about*. If the "why now" search above comes up empty for a subject, that's a sign to pick a different one, not to fall back on a history-only piece, see `references/writing/storytelling.md`'s editorial laws for the full rule and worked example.

**If the ask delegates the choice to you** (see above), **don't start with a blind web search, start with the API's own discovery signals**, they're cheap, fast, and give concrete, verifiable, timely candidates before you spend a search on a guess:
1. Run 2-3 of these first: `companies/top-changes` (biggest movers, several periods), a couple of the ready screener recipes in `sectors-api/endpoints.md` §2 (dividend aristocrats, fastest growers, best banks by ROE, scarcity/threshold cuts, founder/tycoon cross-company reach), `most-traded` (check for a symbol topping the whole window, not just one day), or recent `filings` (an insider-cluster pattern narrated in the filing itself).
2. Pick the 2-3 candidates that look most postable (surprising, benchmarkable, has a clear non-obvious lens) and *then* web-search each one specifically for the "why now", corroborating the angle rather than fishing for one blind.
3. Present the pick with a one-line "why this, why now", and proceed, you're the editor, not asking the user to choose from a menu.

This reverses the old approach (open-ended web search first) because the API signals are strictly cheaper and more verifiable than hoping a web search surfaces something concrete, and it's what actually distinguishes "here's today's mover list" from an editorial pick with a reason to exist.

### 2. Form the story hypothesis (before you fetch data)
Write, for yourself, the **thesis** in one line and the **beats** that prove it, one beat per slide. Open `references/writing/writing.md` sections 1 (the arc) and 2 (the cover hook), and find the **non-obvious lens**, the real story is rarely the headline price move. Open `references/writing/storytelling.md` / `references/writing/viral-hooks.md` only when you need their full worked examples. Each beat is a *claim you will need a number to prove*. This list is your shopping list for the next stage.
- **Every beat needs a benchmark.** A number alone is not a finding, "87% payout" means nothing until the reader knows what's normal. Pair each headline figure with a comparison anchor: the company's own history, a peer, or a category norm. If you can't find one, the beat is probably a restated fact, not an insight, dig further or cut it.
- **Rank the beats before you write a word of copy.** Name the single most surprising, hardest-to-explain-away number in your shopping list. That one earns the top third of the deck (the cover or slide 2-3), never a clause buried in the closer. Save the mechanism/explanation slides for the middle; lead with the finding, not the buildup to it.

### 3. Fetch the data that proves the beats (Sectors API)
Open **`references/sectors-api/README.md`**, then `data-quality.md` (it overrides every number you're about to pull) and `endpoints.md` for the exact calls, in that order, matching the README's own reading order.
- Pull only what your beats need. Most single-stock pieces get nearly everything from one `company/report/{ticker}` call (overview, valuation, financials, dividend, ownership, peers) plus `daily/{ticker}` for price; rankings use the screener (`companies/`, structured `where`/`order_by`) or `top-changes`; smart-money uses `foreign-flow`/brokers.
- **Fetch with the helper, don't hand-write curl**: `node scripts/sectors.mjs "company/report/BBCA/?sections=overview,dividend" [--save file]` handles the auth gotchas once (raw key with NO `Bearer`, a real `User-Agent` or Cloudflare 403s, the v2 base `https://api.sectors.app/v2`), prints clean JSON to stdout, reports credits spent (the `limit-consumption` header) to stderr, and fails loudly on any non-200. **Several beats' calls fetch in ONE invocation** with several paths plus `--save-dir <dir>`, not one round trip per path. The key is in `config.json` (`sectorsApiKey`); `SECTORS_API_KEY` env overrides it. It works out of the box for the team.
- **`data-quality.md` is non-negotiable**: never fabricate or estimate, omit any value that is null/missing/implausible, check against the plausibility bands, and scrutinise *peer/aggregate* fields too (a peer-average P/B can be garbage). Derive a metric only from real fields and only when the derivation is sound (e.g. CASA from current + savings / deposits).
- **If a call fails, read the error class from `sectors.mjs`'s loud stderr before you retry anything.** A 401/403 is an auth problem (check the key in `config.json` or `SECTORS_API_KEY`); stop and say so rather than guessing. A 429 means the quota is exhausted for now; stop spending further calls. A 400 means the recipe is malformed, re-check it against `endpoints.md`'s syntax before you retry, don't just resend the same broken query. A 404 means the symbol doesn't exist; check the ticker. A network error or a 5xx is transient; retry once. If the failure persists after that, or the quota is gone: stop, name which beat is blocked, and either re-angle around the data you already have (step 4's logic) or tell the user before spending further budget. **Never substitute a plausible number for a failed fetch** (hard rule 1).

### 4. Validate and refine (data shapes the story, never the reverse)
Look at what came back. If a number is missing or implausible, **drop that beat and re-angle** around what is real, this is how GOTO with no dividend and no P/E still becomes a clean turnaround story. If you drop a data point, omit it openly, never silently curate the data to fit a prettier trend, and that openness has to land on the artifact that ships, not just in the chat message where you flag the drop: if a chart excludes a year, an entity, or a value, say so in the slide's caption or body copy, the way `sectors-api/data-quality.md`'s paired-filings case already models it (a collapsed custodian/beneficial-owner pair disclosed in the slide's own detail copy, not just to the user). If the data contradicts the thesis, change the thesis.
- **If a beat claims something changed, fetch the change, not just the current value.** "The yield is high because the price fell" is a mechanism, not a finding, if you assert it, pull the actual price/ratio history that shows the fall. A slide that states a mechanism without the trend that proves it is a claim the reader has to take on faith, that's the data dump in disguise.

### 5. Present the draft for approval (before you build a single slide)

Once step 4 leaves you with beats backed by real numbers, stop before composing the deck. Free-coding and rendering 4-8 brand-compliant slides is the most expensive part of this pipeline, in your effort and in the user's review time; catching a wrong angle here costs one short message, catching it after a full deck is built costs a rebuild. Share a short draft, not final copy:

- **The thesis**, one line (from step 2, updated if the data changed it).
- **The cover hook** you'd use, and which word or number would carry the `emphasis`.
- **The beats**, one line each, in the order you'd tell them, each with its proof number and benchmark, e.g. "BBRI's dividend yield is 12%, almost 2x the 10Y bond's 6.8%." This is the outline, not the slide copy.
- **Your recommendation, stated plainly**: which beat is the strongest or most surprising and why it should lead. If you weighed another angle and set it aside (a different ticker, a different lens on the same one, a beat that didn't survive `data-quality.md`), say so in one line, that's useful signal even though you didn't pick it.

Then wait for the user. They can approve as-is, redirect entirely (a different subject or angle, back to step 1), or fine-tune (swap a beat, change the lead, cut something), all before you spend another web search, API call, or token composing slides for a direction that wasn't right.

**Skip this checkpoint only when the user already told you not to check in** ("don't wait for approval", "just build it", "run it end to end"), proceed straight to composing and just state what you decided as you go. This is the same signal as step 1's "explicitly delegated" case, the two usually travel together.

### 6. Compose the deck (free-code, every slide a verdict)

**If composing or rendering surfaces something that breaks the thesis you already got approved** (not just swaps which beat leads, but undercuts the verdict itself), stop and check back with the user the same way step 5 did. Re-angling a beat within an approved thesis is normal judgment; quietly re-angling the thesis itself after approval is not, it's the same checkpoint step 5 exists for, just triggered later.

Open **`references/visual-language.md`** and write a `deck.json` (see `references/deck-format.md`), starting from the envelope below rather than a blank file (derived from `samples/bbri-yield-vs-bonds.deck.json`, valid by construction):

```json
{
  "format": "portrait",
  "slides": [
    {
      "role": "cover",
      "tickers": ["BBRI"],
      "kicker": "IDX · DIVIDENDS",
      "headline": "A high yield, the hard way.",
      "emphasis": "hard way",
      "spark": { "points": [100, 104, 110, 106], "change": 4.2, "label": "$BBRI · 30D" },
      "stat": { "value": "12%", "label": "DIVIDEND YIELD", "compare": { "value": "6.8%", "label": "10Y BOND" } }
    },
    {
      "role": "content",
      "asOf": "Jun 2026",
      "html": "<div class=\"stack\"><div class=\"kicker\">THE YIELD GAP</div><div class=\"title\">Profit <span class=\"gradient-text\">fell</span> again</div><div data-chart=\"bar\" data-spec='{\"bars\":[{\"label\":\"2025\",\"value\":56.7,\"display\":\"56.7\"}]}'></div><span class=\"logo-inline\" data-logo=\"BBRI\"></span></div>"
    }
  ]
}
```

This is the **envelope** only: headline/emphasis, tickers, a spark backdrop, a stat, a gradient-text span, one valid chart `data-spec`, a `logo-inline` mark, `asOf`. Which chart kind, which archetype, how many slides, and the actual copy are governed by `visual-language.md`, `references/charts.md`, and `references/archetypes.md`, not this skeleton.

For each content slide, author the HTML against the design system:
- **The headline states the verdict** ("Its bad-loan ratio rose as rates climbed"); the figure proves it; an optional one-line `body` adds the so-what. No slide is just a labelled number.
- **Gradient = emphasis only**: the one brand moment per slide goes on a single verdict word or number (`class="gradient-text"`), never a whole title.
- **Before picking any chart, check `references/charts.md`'s "Which Sectors API field maps to which chart" list by name.** 13 named kinds (bar, line, donut, radar, multiline, stackedbar, waterfall, table, timeline, scatter, heatmap, bump, sankey); pick deliberately for the data's shape, not habit. Only if none of the 13 fit, reach for the 14th, `compose` (see `charts.md`'s "compose" section); a slope is usually a 2-point multiline, a lollipop usually a bar.
- **Charts and logos via placeholders** (`<div data-chart=…>`, `<span data-logo=…>`) so they're always on-brand; a raw `<svg>` in slide HTML is a lint ERROR, use `compose` instead for a shape the named kinds don't cover. **Every time a slide's prose names a ticker, mark it**: wrap it `<span class="logo-inline" data-logo="TICKER">`, once per slide per ticker is enough but never zero, even for the piece's own subject. `brand-lint.mjs` errors if a slide names a ticker with no mark.
- **Balance the canvas**, no dead-zone voids; if a slide looks empty, you're missing the verdict, not a decoration.
- **Pick each slide's archetype on purpose** (`references/archetypes.md`'s fifteen, across five families: Hero, Trend, Scorecard, Breakdown, Closer). Don't let two adjacent slides fall into the same family, and alternate density, no two dense slides back to back.
- **The cover's stat is an editorial choice.** Give the cover a `stat` (see `visual-language.md`, `deck-format.md`), the figure that best proves the hook, not whichever's easiest to fetch. If the headline already states the numbers, don't repeat them in `stat`, make the headline qualitative instead and let `stat` carry the figures.
- **The cover carries a representative image of the subject.** Every cover should show the thing the story is about, layered behind the hook via `coverArt` (see `deck-format.md`). A ticker is an abstraction; a jar of Tiger Balm, a bottle, a handset, a storefront is something a reader recognises before they have read a word. `brand-lint.mjs` WARNs on a cover without one. The step:
  1. **Find an official asset.** The company's own site (product pages, press kit, newsroom) first, then Wikimedia Commons. Prefer a product/subject shot on a plain background, which cuts out cleanly.
  2. **Prepare it**: `node scripts/coverart.mjs <url-or-path> --ticker BBCA` writes `assets/coverart/BBCA.png`, removing the background, trimming, and downscaling. Read that script's header for the two failure modes worth knowing (why it flood-fills instead of thresholding, and why soft shadows need `--crop` or `--shadow`). It prints warnings when the cutout looks wrong.
  3. **Look at the PNG**, then render the cover and look again. A halo, a hole punched through the subject, or a surviving grey shadow is worse on the dark canvas than no art at all.
  4. **Place it**: the cover picks up `assets/coverart/<TICKER>.png` automatically, so a bare `"coverArt": { "width": "72%", "top": "13%", "right": "-8%" }` is usually the whole deck-side change (tune those three plus `opacity` per image; the art is inlined at render time, so deck.json stays small).
  - **When there is no honest image, say so and move on.** An index move, a foreign-flow story, a 40-name screener, or a company whose only available photo is a stock-library office building: skip it, and note in your handover that the cover has no art and why. A generic or misleading photo is a worse cover than a clean one, and a watermarked or third-party-attributed asset must never ship (see `sectors-api/endpoints.md`'s SGX logo note for the case that already burned us).
- **The cover's backdrop matches the story shape, not habit.** 1 ticker uses `spark`; a 2-ticker head-to-head uses `duel` (both companies' price); 3+ tickers get no chart backdrop, just `tickers` for the logo row/stack. Always set `tickers` (or the legacy single `chip`) so every named company's logo actually shows.
- **Stamp the date**: set `asOf` (a bare date, e.g. "1 Jul 2026") on any content slide whose figures are as-of a date, unless the slide carries its own dated source caption; it renders as a small "As of … · sectors.app" line and is how data-quality's "show the date" rule actually reaches the slide.
- Run the copy through `references/writing/writing.md` section 3 (plain words, explain each ratio once, the AI-tell filter). Open `references/writing/dumbify.md` / `references/writing/anti-ai-writing.md` only for their full worked examples.
- Cover (a hook with one `emphasis` word, an exact, case-sensitive substring of the headline) + 3-8 content slides; the outro is appended automatically, never write its copy.

The semantic blocks in `deck-format.md` are an optional helper library if a slide maps cleanly to one; free HTML is the primary path and the way to build anything they don't cover.

### 7. Lint, render, self-review, deliver

```bash
node scripts/brand-lint.mjs <deck.json>                                       # fix ERRORs before rendering
node scripts/render.mjs   <deck.json> --out output/<name> --report --scale 1  # a-d: first pass, review speed
node scripts/render.mjs   <deck.json> --out output/<name>                     # f: final delivery, default --scale 2
```

**a.** Fix every lint ERROR (gradient/emphasis-match/advice/dash/font/sourcing/logo-mark/malformed-placeholder/raw-svg); WARNs don't block, but read each one, don't reflexively ignore the block.

**b.** First render: `--report --scale 1`, quarter-size PNGs for your eyes, not delivery, plus `output/<name>/report.json`.

**c.** Fix everything `report.json` shows before opening a single PNG: per slide, `warnings` (dropped chart values, unprocessed placeholders, truncated autofit, 4+ peer series, overflow, now covering cover and outro too), a measured `overflow`, a real `voidGap` (the gap below the lowest real content), and `collisions` (leaf overlaps past a tuned tolerance). The report is the debugger, your eyes are the final gate, not the first.

**d.** Then read the rendered PNGs once, for what only eyes catch: a tiny chart, a wrong number, a layout that's merely ugly, not overflowing. Ask of every slide: *would a person stop, read, and save this?* Then ask of the **deck as a whole**:
- Is the single strongest, most surprising data point featured in the top third, or is it buried in a body sentence near the end?
- **Portability test**: could this headline caption a different chart with different numbers and still sound right? If so it's a category, not a verdict, sharpen it until it only fits this slide's actual numbers.
- Does any slide state a mechanism or identity ("yield rose because price fell") without the trend/history that actually proves it?
- **Number re-check**: re-scan every number that ended up on a slide, including anything you computed or derived while writing the HTML (a premium, a multiple, a percentage change), against `data-quality.md`'s plausibility bands and simple arithmetic. A number invented mid-composition is exactly as dangerous as a bad API field.
- **Recency**: is the cover's lead something that happened or changed recently, or does the piece only stand on a standing historical fact with no fresh trigger? History proves the point; it can't be the point.
- Does any slide leave real empty space below the content, not just breathing room, that visual-language.md's "never leave a void" law should have caught?
- **Variation**: do any two adjacent content slides share the same archetype family? A Trend slide next to another Trend slide reads as one slide repeated, re-pick one.
- **Rhythm**: are two dense slides (Fact Grid, Field, a chart-plus-keyfacts combo) sitting back to back with nothing sparse between them? Swap in a Hero or Closer to let the deck breathe.
- **Send, not just save**: does the payoff slide give the reader someone specific to picture sending it to ("this is you if you hold BBRI"), or just a fact to keep? A save is a private bookmark; a send is worth more and needs a reason.
- **Slide 2 as a second cover**: read slide 2's kicker + headline alone, stripped of slide 1's setup. Instagram can surface slide 2 as the preview thumbnail to non-followers, it needs to still make sense and still pull without slide 1's context.

**e.** Each fix iteration, touch only what changed: fix the `deck.json`, re-render just the changed slides with `--slides 3,5` or `--slides 2-4` (numbers stay matched to the full deck, never renumbered), re-read only those PNGs.

**f.** Final delivery: full deck at the default `--scale 2`, confirm the report stays clean. Write the caption per `references/writing/writing.md` section 4 (a second hook, don't just restate slide 1), run the slides' copy and the caption through section 3's AI-tell filter (open `references/writing/caption.md` / `references/writing/anti-ai-writing.md` for full worked examples only), then hand over the slides and the caption.

**Delivery location (this user's convention):** finished stories are delivered to `/Users/evelyn/Desktop/scs/<ticker>_<short_slug>/` (a folder per story, snake_case, e.g. `ammn_insider_buy`, `bnbr_profit_drop`), not `output/<name>` inside this skill directory. Each delivered folder holds exactly: the `<ticker>-<slug>.deck.json`, the final `--scale 2` `slide-NN.png` files (no draft PNGs, no `report.json`), and a `caption.md` with just the caption text. Do the draft/report pass (steps a-d) against a scratch `--out` path (e.g. `output/_draft` or a `_draft` subfolder inside the target story folder, deleted before delivery), then run the final `--scale 2` render straight into the `scs` story folder once the deck is approved.

## Hard rules (these override style every time)

1. **Never fabricate a number.** Every figure traces to a real Sectors field or a confirmed, cited source. No number you can't point to.
2. **Never give investment advice.** Describe, don't prescribe, no buy/sell/target framing. Consensus may be *reported*, never endorsed.
3. **Real data, plausibility-checked.** Respect `sectors-api/data-quality.md` bands (including peer/aggregate fields); omit implausible or null values, and when you drop one, do it openly.
4. **English, brand voice, no hype, no dash-connectors** (see `references/writing/writing.md` section 3, "Voice"; open `references/writing/brand-voice.md` for the full treatment).
5. **Gradient is emphasis only**, one brand moment per slide, on the verdict word.
6. **You free-code against the design system**, you don't reinvent the brand. The look is owned by `assets/` + `scripts/` + `references/visual-language.md`.

## What's in this skill

```
SKILL.md                     ← you are here
references/
  visual-language.md         THE design system you free-code against (three laws, canvas, tokens,
                             type ramp, layout primitives, logos, cover/outro, anti-patterns)
  charts.md                  the on-brand chart vocabulary (index + all 13 kinds + compose)
  archetypes.md              the slide layout library (index + all 15 named archetypes)
  house-style.md             the brand rationale: tokens, vocabulary, cover/outro conventions
  deck-format.md             the deck.json contract (free-HTML slides + the helper block library)
  writing/                   writing.md is the runtime craft reference (story, hook, slide copy,
                             caption); viral-hooks/storytelling/dumbify/anti-ai-writing/brand-voice/
                             caption are the full-treatment originals it's distilled from (+ _source/)
  sectors-api/               endpoints, data-quality, README (the data layer, v2)
scripts/
  render.mjs                 deck.json -> PNG slides (Puppeteer, one bundled Chromium)
  coverart.mjs               subject photo -> transparent cover-art PNG (background removal,
                             trim, downscale); writes assets/coverart/<TICKER>.png
  brand-lint.mjs             static brand + voice check (run before rendering)
  sectors.mjs                authenticated Sectors API GET (use this, not hand-written curl)
  blocks.mjs, charts.mjs     renderer internals (free-HTML injection, chart/logo SVG, helper blocks)
  selftest.mjs               renderer/lint regression suite (maintainers; run after changing scripts/)
  build-fonts.mjs            one-time: embeds the woff2 fonts into assets/styles/fonts.css
assets/
  styles/ (theme.css, fonts.css), fonts/   the house style, frozen as CSS
  logos/                     957 IDX ticker logos (auto-used via chips / data-logo / rankings)
  coverart/                  prepared cover subject images, <TICKER>.png (auto-resolved by render.mjs)
  brand/                     sectors-mark.svg + app-overview.png (footer + outro art)
config.json                  shared Sectors API key (sectorsApiKey); SECTORS_API_KEY env overrides
package.json                 puppeteer dependency (run `npm install` once per machine)
examples/  responses/        cached Sectors v2 shapes (structure reference; data is a snapshot)
samples/   output/           a worked example deck, and where rendered slides land
```

## Setup (once per machine)

- **Install**: run `npm install` in the skill directory once (downloads Puppeteer + its pinned Chromium, so rendering is identical on macOS/Windows with no system browser). Needs network for this one step.
- **Fonts**: pre-bundled in `assets/styles/fonts.css`. Only re-run `node scripts/build-fonts.mjs` if you change `assets/fonts/*.woff2`.
- **API key**: a shared team key ships in `config.json`, so live data works out of the box. Override with `export SECTORS_API_KEY=<key>` if you have your own.
- **Sanity check**: `node scripts/render.mjs samples/*.deck.json --out output/_sample`.

To extend the renderer or the design system, see **`CLAUDE.md`**.
