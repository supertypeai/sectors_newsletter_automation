---
name: sectors-newsletter-generator
description: >-
  Generate an on-brand, data-backed Markdown newsletter about the Indonesian stock
  market (IDX) from live Sectors data and cited research. Use whenever the user wants
  to write, draft, or produce the Sectors subscriber newsletter, a market newsletter
  issue, or a twice-weekly email piece. Handles three issue types the user picks from
  on each run: a "weekly wrap" / "Saturday market wrap" (the week's index moves, sector
  and ticker standouts, flows, all from real data); a "macro-reaction piece" / "macro
  newsletter" (tie the last ~2 days of macro news to the sectors and tickers likely
  affected, then report each name's fundamentals and valuation context); and a "three
  stocks story" / "three-stock storytelling" piece (three companies' history, people,
  fun facts, and attributed forward outlook). Trigger on phrases like "write the
  newsletter", "do this week's Saturday wrap", "macro newsletter piece on the rate
  cut", "three-stocks story for the newsletter", or "draft a Sectors newsletter issue".
  Do NOT use it for Instagram carousels or slides (use sectors-carousel), for video, or
  for non-IDX markets. This skill's deliverable is Markdown text and tables, bite-sized
  and scannable rather than long-form prose, plus at most one optional generated chart
  image for the issue's single hero trend, it is not a slides or video renderer.
---

# Sectors Newsletter Generator

Turn an IDX story into a finished, cited, brand-voice Markdown newsletter issue for
Sectors subscribers. Two disciplines carried over from the sibling `sectors-carousel`
skill govern everything here:

- **Insight, not data.** Every number states what it means. A conclusion, not a stat
  dump.
- **Factual by construction.** Every claim is a real Sectors API field or a cited
  source, nothing fabricated, nothing prescriptive. See `references/compliance.md`.

## Pick the issue type (always first)

When this skill is invoked, present the user three options and wait for a pick — this
is **one issue per run**, never all three at once:

1. **Weekly wrap** — the week's market conclusion: index moves, sector/ticker
   standouts, flows. Intended send: Saturday morning.
2. **Macro-reaction piece** — tie the last ~2 days of macro news to the sectors/tickers
   likely affected, then report each name's fundamentals and valuation context.
3. **Three-stock storytelling** — three companies' history, people, fun facts, and
   attributed forward outlook.

**Skip the menu when the ask already resolves it**: if the user names the type and/or
subject ("do the Saturday wrap," "macro piece on the BI rate cut"), go straight into
that pipeline. If they delegate the choice ("you pick this week's issue"), choose and
state a one-line "why this, why now" as you proceed. Only a bare "write the newsletter"
with no type named gets the three-option menu.

## Shared pipeline shape

All three types run the same five stages, then branch into the type-specific workflow
doc. Open each reference when you reach its stage, don't pre-load everything up front.

1. **Research the angle** — web search and/or API discovery, before any drafting.
2. **Fetch and validate data** — `sectors.mjs`, then band-check against
   `references/sectors-api/data-quality.md`.
3. **Draft** — against `references/newsletter-format.md`'s contract and this skill's
   voice rules. Bite-sized and visual by default: short blocks, bolded stats,
   Markdown tables for any ranked or compared list of 3+, and at most one real
   generated chart for the issue's hero trend (`newsletter-format.md`'s **Bite-sized &
   visual formatting** section, which routes chart work through the `dataviz` skill).
4. **Self-review** — the checklist at the end of the chosen workflow doc, plus
   `references/compliance.md`'s one-line test.
5. **Deliver** — see Delivery below.

### Weekly wrap
Open `references/workflows/weekly-wrap.md` for the exact API recipe and section order.
In brief: settle the week's Mon-Fri window, pull index/market-cap trend, weekly movers,
most-traded, sector standouts, and flows; find the one non-obvious conclusion (not "the
market rose," but *what* drove it and who was on the other side); write the payoff
first, then fill backward.

### Macro-reaction piece
Open `references/workflows/macro-reaction.md`, and open `references/compliance.md`
before writing the per-ticker valuation section — this is the issue type where the
no-advice line matters most. In brief: web-source the last ~2 days of macro news
(`references/sourcing.md`), state which sectors/tickers it plausibly touches and the
mechanism, fetch those names' fundamentals and valuation context, and frame the "is this
a good time to buy" question as objective valuation-context reporting, never a buy/sell
directive.

### Three-stock storytelling piece
Open `references/workflows/three-stock-story.md`. In brief: pick three stocks (ideally
with a connective thread), web-source history/founders/fun-facts with citations, pull
management/ownership/financials from the API, and write any forward statement as
**attributed** ("management has guided…," "consensus estimates…"), never as the
newsletter's own prediction.

## Hard rules (override style every time)

1. **Never fabricate a number.** Every figure traces to a real Sectors API field this
   run, or a cited source.
2. **Never give investment advice.** Describe, don't prescribe — no buy/sell/hold, no
   price targets as our call, no "undervalued/a good entry." Consensus may be
   *reported*, never *endorsed*. Forward-looking statements must be attributed, never
   asserted as this newsletter's own prediction.
3. **Real data, plausibility-checked.** Respect
   `references/sectors-api/data-quality.md`'s bands; omit null or
   implausible values, and say so openly when you drop one.
4. **English, brand voice, no hype.** Inherit
   `references/writing/writing.md` and `brand-voice.md` wholesale —
   this skill does not re-author voice, only the output format differs (prose, not
   slides). One exception: `newsletter-format.md`'s **Prose style** section overrides
   the carousel's short-declarative slide instinct for this skill's long-form copy.
5. **Cite everything web-sourced**, per `references/sourcing.md`. No source, no claim.
6. **Human-sounding prose, no AI-tells.** No dash used as a connector (em dash, en dash,
   or spaced hyphen), no short choppy sentences repeated section after section, no
   negative-parallelism ("it's not X, it's Y") or manufactured paradox, no emoji or
   decorative glyphs. Full treatment in `newsletter-format.md`'s **Prose style**
   section — read it before drafting any issue.

Full treatment, including the "good time to purchase" / "great future forecast"
reconciliation, lives in `references/compliance.md` — read it before drafting the
macro-reaction or three-stock-story types.

## Delivery

Finished issues land at:

```
/Users/evelyn/Desktop/newsletter/newsletter_<YYYY-MM-DD>_<type-slug>/
    newsletter.md
    chart-<slug>.svg           only if the issue includes the optional hero chart
```

- `<type-slug>` is `weekly-wrap`, `macro-reaction`, or `three-stock-story`.
- `<YYYY-MM-DD>` is the issue/send date.
- Any generated chart file lands in this same folder, next to `newsletter.md`, and is
  referenced from it by a relative Markdown image link.
- Scratch fetches (raw `sectors.mjs --save-dir` JSON) go to the scratchpad or a
  `_draft`/`data` subfolder, not into the delivered folder.
- `newsletter/` is a plain folder, separate from the skills repo and from the
  `sectors-carousel` skill's `scs/<ticker>_<slug>/` git repo, no git init needed here.

## What's in this skill

```
SKILL.md                          you are here
references/
  newsletter-format.md            the Markdown output contract: header metadata,
                                   ticker convention, number formatting, per-type
                                   section skeletons, disclaimer footer
  compliance.md                   hard rules + the advice-reconciliation guidance
  sourcing.md                     web research + citation rules
  workflows/
    weekly-wrap.md                API recipe + section outline, Saturday issue
    macro-reaction.md             macro sourcing + affected-ticker + valuation-context
                                   recipe, non-advice framing
    three-stock-story.md          stock-pick discovery + history/people research +
                                   attributed-forecast recipe
  sectors-api/                    endpoints, data-quality, README (the data layer, v2 —
                                   a synced copy shared with sectors-carousel)
  writing/
    writing.md, brand-voice.md    the craft/voice reference this skill inherits wholesale
                                   (a synced copy shared with sectors-carousel)
scripts/
  sectors.mjs                     authenticated Sectors API GET (zero external
                                   dependencies, self-locates its own config; a synced
                                   copy shared with sectors-carousel)
config.json                       own copy of the shared Sectors API key
                                   (sectorsApiKey); SECTORS_API_KEY env overrides
```

**This skill is self-contained**: `scripts/sectors.mjs`, `config.json`,
`references/sectors-api/`, and `references/writing/{writing,brand-voice}.md` are local
copies, not relative-path reuse of `sectors-carousel` — this skill runs standalone even
if `sectors-carousel` isn't installed. They originate from `sectors-carousel` (the
single source of truth for voice and data discipline) and should be re-synced from
there if that skill's copies change; don't fork the content itself, only the file
location.

**`market-story-video`** (the other sibling skill) is a separate, fully self-contained
Remotion video pipeline with its own copies of the same brand/voice/data-layer
references. It has no dependency relationship with this skill in either direction.

## Setup

No install needed. Unlike `sectors-carousel` there is no slide-rendering step — the
only dependency is `node` (built-ins only, no npm packages) to run `sectors.mjs`, and
the shared API key already ships in `config.json`. The optional hero
chart writes a plain SVG string to a file directly (no Puppeteer, no build step), using
color/form guidance from the `dataviz` skill, not the carousel's Instagram-branded chart
engine (`sectors-carousel`'s `scripts/charts.mjs` is dark-theme brand-specific and stays
out of scope here). Sanity check:

```bash
node scripts/sectors.mjs "idx-total/?start=2026-07-01&end=2026-07-08"
```
