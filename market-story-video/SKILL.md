---
name: market-story-video
description: >-
  Generate a vertical (1080x1920) story video, either a 10-15 second short or a ~45-75 second
  long-form piece, about the Indonesian stock market (IDX) from live Sectors financial data, in
  the visual style of the team's existing Reels/TikTok/Shorts content. Use whenever the user
  wants a short video, a Reel, a TikTok, a Short, or "video content" about an IDX-listed
  company or ticker, a market-wide move, a regulatory/index event, or a company's
  ownership/history/plans and how they shaped its financial performance. Trigger even when the
  user just says "make a video about GOTO", "turn BBRI's dividend story into a video", or
  "what's a good market story to post this week as a video", this skill handles the whole
  pipeline from topic to a finished MP4 with on-screen text and motion, no voiceover. Do NOT
  use it for non-IDX markets, for a static carousel/slides (use the sectors-carousel skill for
  that), or for a video with voiceover/narration (this skill is visual-only: on-screen text and
  motion, no audio track).
---

# Market Story Video

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
  themes.md                  which visual system (noir/thread) fits which story shape
  length.md                  short (10-15s) vs long (~45-75s) targets and beat budgets
  narrative-approaches.md    storytelling (resolves) vs teaser (open question) closing beat
  storyboard-format.md       the storyboard.json contract
  scenes.md                  the 5 scene roles (cover/stat/chart/breakdown/takeaway)
  motion.md                  the timing/easing vocabulary every scene draws from
  writing/                   same craft reference the carousel skill uses (story, hook, voice, caption)
  sectors-api/               endpoints, data-quality, README (the data layer, v2 — shared with the carousel skill)
scripts/
  render.mjs                 storyboard.json -> MP4 (Remotion bundler + renderer)
  storyboard-lint.mjs        static structural + voice checks (run before rendering)
  sectors.mjs                authenticated Sectors API GET (same script the carousel skill uses)
src/
  index.ts, Root.tsx          Remotion entry + composition (duration computed from the storyboard)
  StoryboardComposition.tsx  lays out scenes as Sequences, picks the theme, drives the thread line
  types.ts                   the Storyboard/Scene TypeScript contract (mirrors storyboard-format.md)
  tokens.ts, fonts.ts         design tokens (both themes) and the font registry (Google Fonts)
  components/                GradientText, Logo, BrandMark, SceneShell, charts/ (Bar, Line, OwnershipTree)
  themes/noir/, themes/thread/  the two theme's Background/Chrome/scene renderers/Outro
assets/
  logos.json                  957 IDX ticker logos (base64), shared with the carousel skill
  brand/                       sectors-mark.svg (also inlined as a component in BrandMark.tsx)
config.json                   shared Sectors API key (sectorsApiKey); SECTORS_API_KEY env overrides
package.json                 remotion + @remotion/cli + @remotion/google-fonts
samples/  output/             two worked examples (one per theme), and where rendered stories land
```

## Setup (once per machine)

- **Install**: run `npm install` in the skill directory once (Remotion + its CLI/renderer;
  no system ffmpeg required — Remotion v4 bundles its own compositor).
- **Fonts**: loaded live from Google Fonts at render time via `@remotion/google-fonts`
  (Plus Jakarta Sans, JetBrains Mono, Lora) — needs network the same way the Sectors API call
  does; there is no local font cache to pre-warm.
- **API key**: a shared team key ships in `config.json`. Override with
  `export SECTORS_API_KEY=<key>` if you have your own.
- **Sanity check**: `node scripts/render.mjs samples/bbri-vs-bonds.storyboard.json --out output/_sample`.
- **Preview while iterating**: `npx remotion studio src/index.ts` opens Remotion's interactive
  player (scrub the timeline, hot-reload on save) — faster than re-rendering for a layout-only
  change.

To extend the renderer or add a third theme, start from `src/themes/noir/` or
`src/themes/thread/` as a template — both implement the same
`{ Background, Chrome, scenes: {cover,stat,chart,breakdown,takeaway}, Outro }` shape consumed
by `StoryboardComposition.tsx`.
