---
name: market-story-video
description: >-
  Generate a vertical (1080x1920) Reel/TikTok/Short in the team's brand style, either a MARKET
  STORY about the Indonesian stock market (IDX) from live Sectors financial data, or a PRODUCT
  FEATURE REEL promoting a sectors.app feature. Market story: a 10-15s short or ~45-75s
  long-form piece about an IDX ticker, a market-wide move, a regulatory/index event, or a
  company's ownership/history — triggered by "make a video about GOTO", "turn BBRI's dividend
  story into a video", "what's a good market story to post this week"; finished MP4 with
  on-screen text and motion, no audio. Product feature reel: a 12-18s intro/demo/CTA piece about
  a sectors.app capability (Screener, Financial Search, Watchlist, Ownership Search, workflows,
  and so on) — triggered by "make a reel introducing our screener", "a 15-second promo for
  Sectors' search feature", "demo the watchlist as a Reel", "feature intro video for the app";
  it frames a real screen recording or screenshot of the app in a device mockup, adds callouts
  and a Ken Burns push, reserves a corner for a talking-head clip, and writes a timed voiceover
  script the presenter reads (the skill writes the words and reserves the space; it does not
  record or composite audio/video). Do NOT use it for non-IDX markets, for static
  carousel/slides (use the sectors-carousel skill), or, for a market story, for narration (the
  market-story path is visual-only).
---

# Market Story Video

This skill makes two kinds of vertical video, sharing one Remotion renderer, one brand system,
and the same story-first discipline:

- **A market story** (themes `noir`/`thread`) — a real IDX story found by research, real numbers
  from the Sectors API, every scene landing a verdict, rendered to MP4 with on-screen text and
  motion, no audio. This is the default and the rest of this file (steps 1-7) describes it.
- **A product feature reel** (theme `product`) — a 12-18s intro/demo/CTA promoting a sectors.app
  feature: the app shown working inside a device frame, callouts, a reserved talking-head
  corner, and a timed voiceover script. **If that's the ask, jump to the "Product feature
  reels" section below** and follow its shorter pipeline instead of steps 1-7. Everything else
  in this file (the brand system, the render/lint scripts, the hard rules) still applies.

Which one? A piece built from market DATA about a ticker or event is a market story. A piece
selling what the APP can do is a product reel. When a request could read either way ("a video
about Sectors"), ask.

## Market story pipeline

Turn a topic into a finished vertical video about the Indonesian stock market: a real story
found by research, real numbers from the Sectors API, a storyboard where every scene lands a
verdict (or, for a teaser piece, an open question), rendered to MP4 with on-screen text and
motion via Remotion. No voiceover, no narration, no audio track — the story is told entirely
through text and motion.

Every run of this skill decides three independent choices before a single scene gets written —
**theme** (`references/themes.md`), **length** (`references/length.md`), and **narrative
approach** (`references/narrative-approaches.md`). Step 1 below covers exactly when and how to
ask.

This skill is a sibling of **sectors-carousel**: the same story-first discipline (research
before data, data before composition, approval before the expensive step), the same brand
numbers and voice rules, the same hard rules. What differs is the medium: a handful of
timed scenes instead of 4-8 static slides, and two purpose-built visual themes instead of one
carousel look. If you haven't read `sectors-carousel/SKILL.md`, its steps 1-5 below are close
enough to identical that reading this file alone is enough to run this skill.

## The pipeline

Work top to bottom. First time on this machine, run **Setup** (bottom of this file) before
step 7 needs to render; nothing earlier depends on it.

### 1. Understand the ask, then find the story (web search, not optional)

Same three shapes as the carousel skill: **a subject is named** (proceed straight in), **the
choice is explicitly delegated** ("what's a good story this week", "surprise me" — proceed
straight in, per below), or **neither** (a bare "make a video" names no subject — ask one
quick question: what to cover, offering "you pick something timely" as an answer).

Settle the **subject** first, then form a recommendation on this skill's three product
choices before you touch the API:

- **Theme** (`references/themes.md`): "noir" (a single company's history/structure/numbers) or
  "thread" (a market-wide/news-driven event) — driven by story shape.
- **Length** (`references/length.md`): "short" (10-15s, 3-6 scenes) or "long" (~45-75s, 8-18
  scenes, room for a history timeline and a fun fact) — driven by how much the story can
  sustain and whether the ask wants a fuller deep-dive.
- **Narrative approach** (`references/narrative-approaches.md`): "storytelling" (the piece
  resolves with a plain-finding `takeaway`) or "teaser" (the piece raises a specific question
  and closes by pointing at where it resolves — a follow-up post, or the ticker's own
  `sectors.app` page) — driven by whether this is meant to stand alone or build anticipation
  for something else.

**Always confirm these three with the user before composing the storyboard**, even when a
subject was named outright — present your recommended default for each (based on the story
shape you can already see) alongside the alternative, in one `AskUserQuestion` call. Skip this
confirmation only when the user's own request already pins down all three explicitly (e.g. "a
quick 15-second teaser in the noir style about GOTO") — proceed straight in and just state
which three choices you resolved and why. A request that only pins down one or two still gets
asked about the rest.

Then **use web search to find why this story matters now** — identical discipline to the
carousel skill: a fresh earnings release, a notable move, a dividend/buyback, a regulatory or
macro shift, an index reshuffle, a flow story. **Recent is the story; history is the proof,
not the headline** (see `references/writing/storytelling.md`'s editorial laws).

**If the ask delegates the choice to you**, start with the API's own discovery signals before
a blind web search — `companies/top-changes`, a screener recipe from `sectors-api/endpoints.md`
§2, `most-traded`, or recent `filings` — then web-search the 2-3 most postable candidates for
the "why now", and present your pick with a one-line reason.

### 2. Form the story hypothesis (before you fetch data)

Write the **thesis** in one line and the **beats**, now one beat per SCENE rather than per
slide. A `"short"` video only fits 3-6 scenes, so be more ruthless about which beats survive
than an 8-slide carousel would need to be; a `"long"` video fits 8-18, enough room for a
history-timeline beat and a fun-fact beat (`references/length.md`'s beat-budget table), but
every added scene still has to prove something new — don't pad. Open
`references/writing/writing.md` §1-2 and `references/scenes.md`'s index to see which scene role
(`cover`/`stat`/`chart`/`breakdown`/`takeaway`) each beat wants to become before you've even
fetched the numbers.

Every beat still needs a benchmark (a number alone isn't a finding), and you still rank beats
before writing a word — the single most surprising number earns the `cover` or the first
proof scene, never the middle.

### 3. Fetch the data that proves the beats (Sectors API)

Identical to the carousel skill. Open `references/sectors-api/README.md`, then
`data-quality.md`, then `endpoints.md`. Fetch with `node scripts/sectors.mjs "<path>"
[--save file]` (several beats' calls in ONE invocation with `--save-dir`, not one round trip
per path). `data-quality.md` is non-negotiable: never fabricate, omit anything implausible,
scrutinize peer/aggregate fields too. Read `sectors.mjs`'s stderr error class before retrying
anything on a failure (401/403 auth, 429 quota, 400 malformed recipe, 404 bad symbol, network/
5xx transient).

### 4. Validate and refine (data shapes the story, never the reverse)

Identical discipline to the carousel skill: drop a beat and re-angle if a number is missing or
implausible, never silently curate data to fit a prettier trend, and if you drop something say
so openly in the scene's `body`/`caption` copy, not just in chat. If a beat claims something
changed, fetch the change itself (the actual history), not just the current value.

### 5. Present the draft for approval (before you build a single storyboard)

Stop before writing `storyboard.json`. Rendering even a fast `--stills` pass costs real time;
share a short draft first:

- **The thesis**, one line.
- **The three choices**: theme (noir/thread), length (short/long), and narrative approach
  (storytelling/teaser), each with why it fits this story — this is also where the
  `AskUserQuestion` confirmation from step 1 surfaces if it hasn't already.
- **The scene sequence**: role + one-line content for each (e.g. "cover: BBRI's yield vs.
  bonds hook · chart: profit falling 3 years · stat: 85% payout ratio · takeaway"), each with
  its proof number and benchmark.
- **A rough duration budget** summing to the chosen length's target (10-15s, or ~45-75s for
  long-form) — scenes + ~2.2s outro.
- **Your recommendation**, plainly stated, plus anything you weighed and set aside.

Then wait for the user, same checkpoint rules as the carousel skill (approve as-is, redirect,
or fine-tune). **Skip this checkpoint only when the user already told you not to check in**
("just build it", "run it end to end").

### 6. Compose the storyboard

Open `references/storyboard-format.md` (the JSON contract), `references/scenes.md` (the five
scene roles), `references/motion.md` (the timing vocabulary — you don't hand-animate, you pick
what enters and the shared motion system handles it), `references/themes.md` (which visual
system you're building against), `references/length.md` (short vs. long beat budgets), and
`references/narrative-approaches.md` (how storytelling vs. teaser shapes the closing scene).
Start from one of `samples/bbri-vs-bonds.storyboard.json` (noir) or
`samples/msci-relegation.storyboard.json` (thread) rather than a blank file — both are
`"short"`/storytelling pieces; for a `"long"` or teaser piece, adapt the same envelope per
`length.md`/`narrative-approaches.md` rather than starting blank.

- Set `storyboard.length` explicitly (`"short"` or `"long"`) — don't rely on the default when
  the user chose long-form, since omitting it defaults to `"short"` and the lint will flag a
  60s storyboard as wildly over target.
- Every scene's `headline`/`emphasis` follows the exact-substring rule (`storyboard-format.md`)
  — a mismatch THROWS at render time here (there's no flat-fallback the way the carousel's
  lint merely warns), so get it right before rendering.
- Keep total duration in the confirmed length's target band (10-15s/3-6 scenes for
  `"short"`, ~45-75s/8-18 scenes for `"long"`). `scripts/storyboard-lint.mjs` checks this
  mechanically against whichever `length` you set.
- Run the copy through `references/writing/writing.md` §3 (plain words, the AI-tell filter) —
  on-screen video text needs to be SHORTER than carousel slide copy: a scene is on screen for
  2-4 seconds, so a headline a viewer can't read in that time is a miss regardless of how good
  the line is. Prefer a 4-9 word headline; save the "so-what" for `body`, which itself should
  be one short sentence.
- Never write outro copy beyond `headline`/`emphasis`/`tagline` in the `outro` field — the
  brand sign-off is a fixed primitive, same convention as the carousel's `autoOutro`.

### 7. Lint, render, self-review, deliver

```bash
node scripts/storyboard-lint.mjs <storyboard.json>                        # fix ERRORs before rendering
node scripts/render.mjs <storyboard.json> --out output/_draft --stills    # fast pass: one PNG per scene, review speed
node scripts/render.mjs <storyboard.json> --out output/<name>             # final: full MP4
```

**a.** Fix every lint ERROR (role/duration/emphasis-match/chart-kind/ownership-shape/dash/
advice-phrasing WARN too, read it, don't reflexively ignore it).

**b.** `--stills` renders one PNG at each scene's midpoint — fast enough to review composition,
copy, and layout before paying for a full video encode (the same "fast first pass" idea as the
carousel's `--scale 1` draft render, adapted since there's no cheap "quarter-size" video
equivalent).

**c.** Read every stat/chart/breakdown PNG and ask the same questions the carousel's step-7
self-review asks, adapted for a moving story:
- Is the single strongest number in the `cover` or the first proof scene, not buried near the
  end?
- **Portability test**: could this headline caption a different chart with different numbers
  and still sound right? Sharpen it if so.
- Does any scene state a mechanism without the trend that proves it?
- **Number re-check**: re-scan every number, including anything computed while writing the
  JSON, against `data-quality.md`'s plausibility bands.
- Does the `takeaway` read as a finding or as advice? Rewrite if the latter.
- Read `references/motion.md`'s "reviewing your own timing" section — does the proof
  (chart/stat) finish its draw-on with enough hold time left to actually read it?

**d.** Once the draft looks right, render the full MP4 and watch it (or extract frames with
`ffmpeg -i <file>.mp4 -vf fps=1 frame%02d.png` if you need to inspect specific moments) —
motion and cut timing are things a still can't fully catch.

**e.** Each fix iteration, re-run `--stills` (or the full render for a timing-only fix) rather
than re-reviewing from scratch.

**f.** Final delivery: full MP4 at the default render settings, confirm the lint stays clean.
Write a short caption per `references/writing/writing.md` §4, run it through §3's AI-tell
filter.

**Delivery location (this user's convention, matching the carousel skill's):** finished
stories are delivered to `/Users/evelyn/Desktop/scs/<ticker>_<short_slug>/` — the SAME
per-story folder the carousel skill uses, if one already exists for this topic (add the video
alongside the slides rather than making a second folder). Each delivered video adds:
`<ticker>-<slug>.storyboard.json`, the final `<ticker>-<slug>.mp4`, and `caption.md` (create it
if the folder doesn't already have one from a carousel piece on the same topic). Do the
`--stills` draft pass against a scratch path (`output/_draft`, deleted before delivery), then
render the final MP4 straight into the `scs` story folder once approved.

## Product feature reels (theme `product`)

A different job from a market story: sell a sectors.app feature, not tell a data story. Same
brand shell, same renderer, same hard rules against fabrication and advice; a shorter pipeline
and its own machinery (a device frame for real app footage, callouts, a talking-head corner).
**Read `references/product-reel.md` in full before composing one**, and `references/voiceover.md`
if it has narration or a talking head. The short version:

**1. Settle the feature.** It comes from `inputs/features.json`, the facts catalog — compose the
copy FROM an entry there, never from memory. If the feature isn't catalogued, ask the user for
its promise, proof, and destination, write the entry (with a `verified` note on what grounds it),
then compose. Set the storyboard's top-level `feature` key to the catalog key for traceability.

**2. Line up the footage.** Each demo scene needs a screen recording (`inputs/demo/*.mov`) or a
screenshot (`inputs/shots/*.png`) of the app. Compose the storyboard pointing `media.src` at
where the file will live; the lint and renderer error on a missing file, so you'll know exactly
what to capture. For a first pass with nothing recorded, `assets/brand/app-overview.png` (a real
sectors.app overview screenshot shipping with the skill) is a legitimate stand-in as a `shot`.

**3. Compose the four beats:** `cover` (the problem, not the feature name) -> `feature` (name it,
one-line promise, up to 3 chips) -> `demo` (the app working, the longest beat, callouts pinned by
0-1 screen fractions, optional Ken Burns `pan` and synthetic `cursor`) -> `cta` (the line, the
mark, the exact `sectors.app/...` path). Set `"outro": false`. Add per-scene `vo` lines for the
voiceover and a `humanSlot` if a face rides the corner (`voiceover.md`). Use `length: "reel"`.

**4. Lint, render, self-review, deliver** — same scripts as a market story, plus the script
compiler:

```bash
node scripts/storyboard-lint.mjs <storyboard.json>                       # four-beat structure, vo budget, media, coords
node scripts/script-out.mjs   <storyboard.json> --out <folder>/script.md # the timed voiceover script
node scripts/render.mjs <storyboard.json> --out output/_draft --stills   # draws the talking-head guide box too
node scripts/render.mjs <storyboard.json> --out <folder>                 # final MP4, slot renders empty
```

Read every still: is the feature name the one gradient moment on its scene? Do the callout rings
sit exactly on the UI they name? Does the demo get at least a third of the runtime? Does the CTA
point at the feature's real path, not the bare homepage? Deliver the MP4 and `script.md`
together; whoever films records against the script and composites the clip into the reserved
corner downstream. Start from `samples/financial-search-feature.storyboard.json`, not a blank
file. Delivery folder convention: `/Users/evelyn/Desktop/scs/<feature-slug>/` (a feature slug,
not a ticker, since a reel names no ticker).

## Hard rules (these override style every time)

1. **Never fabricate a number.** Every figure traces to a real Sectors field or a confirmed,
   cited source.
2. **Never give investment advice.** Describe, don't prescribe — no buy/sell/target framing,
   especially in the `takeaway` scene where the temptation is strongest.
3. **Real data, plausibility-checked.** Respect `sectors-api/data-quality.md`, and when you
   drop a value, do it openly in the scene copy.
4. **English, brand voice, no hype, no dash-connectors.**
5. **Gradient is emphasis only** — one word/phrase per scene, enforced at render time by
   `EmphasizedHeadline` (it throws on a mismatch, not just a lint warning).
6. **You author `storyboard.json` against the design system, you don't reinvent the brand.**
   The look is owned by `src/themes/*`, `src/components/*`, and `references/themes.md`.

## What's in this skill

```
SKILL.md                     ← you are here
references/
  themes.md                  which visual system (noir/thread/product) fits which piece
  length.md                  short (10-15s) vs long (~45-75s) targets and beat budgets
  narrative-approaches.md    storytelling (resolves) vs teaser (open question) closing beat
  product-reel.md            feature reels: the four beats, the demo scene, features.json (product theme)
  voiceover.md               the vo script + the reserved talking-head corner (product theme)
  storyboard-format.md       the storyboard.json contract
  scenes.md                  the 5 market-story scene roles (cover/stat/chart/breakdown/takeaway)
  motion.md                  the timing/easing vocabulary every scene draws from
  writing/                   same craft reference the carousel skill uses (story, hook, voice, caption)
  sectors-api/               endpoints, data-quality, README (market-story data layer, v2 — shared with carousel)
scripts/
  render.mjs                 storyboard.json -> MP4 (Remotion bundler + renderer; stages media, draws guides)
  storyboard-lint.mjs        static structural + voice checks, all three themes (run before rendering)
  script-out.mjs             compile a reel's vo lines into a timed voiceover script (product theme)
  sectors.mjs                authenticated Sectors API GET (market story only; same script as the carousel)
src/
  index.ts, Root.tsx          Remotion entry + composition (duration computed from the storyboard)
  StoryboardComposition.tsx  lays out scenes as Sequences, picks the theme, drives the thread line + human-slot guide
  types.ts                   the Storyboard/Scene TypeScript contract (mirrors storyboard-format.md)
  tokens.ts, fonts.ts         design tokens (all three themes) and the font registry (Google Fonts)
  components/                GradientText, Logo, BrandMark, SceneShell, DeviceFrame, HumanSlot, charts/
  themes/noir/, themes/thread/, themes/product/   each theme's Background/Chrome/scene renderers/Outro
inputs/
  features.json               the product-reel facts catalog (what each sectors.app feature does)
  demo/  shots/               your screen recordings and screenshots for reels (git-ignored)
assets/
  logos.json                  957 IDX ticker logos (base64), shared with the carousel skill
  brand/                       sectors-mark.svg, app-overview.png (a real sectors.app screenshot for reel drafts)
config.example.json           template for the optional local key file; SECTORS_API_KEY env is the primary source
package.json                 remotion + @remotion/cli + @remotion/google-fonts
samples/  output/             three worked examples (noir, thread, product reel), and where renders land
```

## Setup (once per machine)

- **Install**: run `npm install` in the skill directory once (Remotion + its CLI/renderer;
  no system ffmpeg required — Remotion v4 bundles its own compositor).
- **Fonts**: loaded live from Google Fonts at render time via `@remotion/google-fonts`
  (Plus Jakarta Sans, JetBrains Mono, Lora) — needs network the same way the Sectors API call
  does; there is no local font cache to pre-warm.
- **API key**: `export SECTORS_API_KEY=<key>`, ideally in your shell profile so it's
  always set. **No key ships in the repo.** A local `config.json` with `sectorsApiKey`
  still works as a fallback if you prefer a file (copy `config.example.json`), but it is
  gitignored and must never carry a real key into git.
- **Sanity check**: `node scripts/render.mjs samples/bbri-vs-bonds.storyboard.json --out output/_sample`.
- **Preview while iterating**: `npx remotion studio src/index.ts` opens Remotion's interactive
  player (scrub the timeline, hot-reload on save) — faster than re-rendering for a layout-only
  change.

To extend the renderer or add a third theme, start from `src/themes/noir/` or
`src/themes/thread/` as a template — both implement the same
`{ Background, Chrome, scenes: {cover,stat,chart,breakdown,takeaway}, Outro }` shape consumed
by `StoryboardComposition.tsx`.
