---
name: sectors-newsletter-generator
description: >-
  Generate an on-brand, data-backed Markdown newsletter about the Indonesian stock
  market (IDX) from live Sectors data and cited research. Use whenever the user wants
  to write, draft, or produce a Sectors subscriber newsletter issue. Handles eight
  built issue types the user picks from on each run, across four families: MARKET
  PERFORMANCE ("weekly wrap" / "Saturday market wrap"; "daily market pulse" end-of-day
  movers and volume); MARKET INSIGHTS ("macro-reaction" / "macro newsletter" tying the
  last ~2 days of macro news to affected sectors and tickers); COMPANY INSIGHTS ("three
  stocks story" history/people/fun-facts/attributed-outlook; "single company deep dive"
  off an earnings or corporate-action trigger; "sector spotlight" peer-comparing one
  sub-sector's names on valuation); and SECTORS-ORG announcements ("new feature release"
  enablement copy sourced from the Sectors release notes; "upcoming event" promo for a
  Sectors in-house workshop, built from user-supplied event details, not market data).
  Trigger on phrases like "write the newsletter", "do this week's Saturday wrap", "daily
  pulse", "macro piece on the rate cut", "deep dive on BBRI earnings", "sector spotlight
  on the banks", "three-stocks story", "write up the new feature release", or "announce
  the upcoming workshop". Do NOT use it for Instagram carousels or slides (use sectors-carousel),
  for video, or for non-IDX markets, and do NOT use it for lifecycle/CRM/transactional
  email (onboarding nudges, credit/plan reminders, upgrade/win-back, personal portfolio
  digests) or for deciding recipients/frequency, those need live user-account data this
  skill does not have. This skill's deliverable is Markdown text and tables, bite-sized
  and scannable, plus at most one optional generated chart image for the issue's single
  hero trend, it is not a slides or video renderer.
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

This is **one issue per run**, never several at once. Eight issue types are built,
grouped by content family (mirroring the newsletter content plan's type catalog). Each
maps to a workflow doc in `references/workflows/` and an issue-type slug:

**Market Performance**
1. **Weekly wrap** (`weekly-wrap`) — the week's conclusion: index moves, sector/ticker
   standouts, flows. Saturday send.
2. **Daily market pulse** (`daily-market-pulse`) — end-of-day movers, volume leaders,
   brokers. Tight, table-first, read in under a minute.

**Market Insights**
3. **Macro-reaction** (`macro-reaction`) — tie the last ~2 days of macro news to affected
   sectors/tickers, then report each name's fundamentals and valuation context.

**Company Insights**
4. **Three-stock storytelling** (`three-stock-story`) — three companies' history, people,
   fun facts, attributed forward outlook.
5. **Single company deep dive** (`single-company-deep-dive`) — one name read in depth off
   a real earnings / corporate-action / ownership trigger.
6. **Sector spotlight** (`sector-spotlight`) — one sub-sector's names peer-compared on
   valuation ("which one is actually cheap," as context, not a call).

**Sectors-org announcements** (about Sectors itself, not the market)
7. **New feature release** (`new-feature-release`) — enablement copy off a real Sectors
   release note (`sectors.app/release`), optionally showing the capability on real data.
8. **Upcoming event** (`upcoming-event`) — promo for a Sectors in-house workshop (online
   or offline, teaching participants to build on live Sectors API data). Content is
   **user-supplied**: ask for date/time/venue, agenda/speaker/target audience,
   registration link, and marketing banner before drafting. Not market-data driven.

**Skip the menu when the ask already resolves it**: if the user names the type and/or
subject ("do the Saturday wrap," "deep dive on BBRI earnings," "spotlight the banks"), go
straight into that pipeline. If they delegate the choice ("you pick this week's issue"),
choose and state a one-line "why this, why now" as you proceed. Only a bare "write the
newsletter" with no type named gets the menu, offer the eight above grouped by family.

### Not yet built (in scope, will be added iteratively)

These are valid market/editorial content this skill's engine *can* produce, they just
don't have a workflow doc yet. If the user asks for one, say it's not built yet and offer
the closest built type, or build it by following the nearest existing workflow doc as a
template (don't fake it with an ad-hoc pipeline):

- Market Insights: Regulatory / index event, Global spillover, Broker flow digest
- Market Performance: Monthly recap
- Company Insights: Insider activity signal
- FOMO (market content only, targeting is external): Missed rally, Missed dividend,
  Sector rotation miss, Caught it
- Educational: Concept explainer, How-to guide, Use-case walkthrough
- Product Update: Feature enhancement, Deprecation notice

### Out of scope (do not attempt here)

These need live **user-account, billing, or product-usage data** this skill cannot fetch
(`quest_completed`, `credits_used`, watchlist/workflow history, renewal dates). They are
lifecycle/CRM/transactional email, a different system, not market content. Decline and say
why:

- Reminder: onboarding nudge, setup nudge, credit-expiry, plan-renewal
- Account & Value: value recap, upgrade prompt, win-back reoffer
- Market Performance: personal portfolio digest (needs the user's own watchlist history)

**Recipient grouping, segmentation, frequency caps, and send scheduling are also out of
scope.** This skill generates one content piece; who receives it and when is decided by
the delivery/CRM system that consumes the output, not here.

## Write as a CXO optimizing for conversion

Every issue is drafted in the role of a CXO whose job is to move one specific metric,
not a neutral reporter. The hard rules below (never fabricate, never advise, cite
everything, brand voice) are inviolable and still bind, but *within* those limits every
choice — subject line, lead, structure, CTA placement, what gets cut — is made to raise
that issue's conversion, not merely to inform.

**The conversion goal depends on the issue type.** Name the goal before drafting, then
optimize the whole piece for it: lead with the payoff, put the primary CTA above the
fold and repeat it, use concrete stakes (deadline, scarcity, price) over vague ones, kill
anything that doesn't serve the goal.

| Issue type | Conversion goal (the one action to drive) |
| --- | --- |
| **Upcoming event** | Register as a workshop participant (click through and sign up before it fills / closes) |
| **New feature release** | Open Sectors and actively use the newly released feature on real data |
| **Weekly wrap** | Return to `sectors.app` to explore the movers/sectors named |
| **Daily market pulse** | Same-day click into the tickers/tables to check them live |
| **Macro-reaction** | Explore the affected sectors/tickers on Sectors to size up the move |
| **Three-stock story** | Click through to each company's page on Sectors |
| **Single company deep dive** | Open that company's report on Sectors and dig into the data |
| **Sector spotlight** | Screen the sub-sector on Sectors and compare the peers themselves |

If an issue type isn't listed (a not-yet-built type), state its conversion goal in one
line — "the one action a reader should take" — before drafting, and optimize for it the
same way. For any Sectors-org announcement the goal is product engagement; for market
content the goal is a return visit to `sectors.app` to explore the names cited.

## Shared pipeline shape

All three types run the same five stages, then branch into the type-specific workflow
doc. Open each reference when you reach its stage, don't pre-load everything up front.

1. **Research the angle** — web search and/or API discovery, before any drafting.
2. **Fetch and validate data** — `sectors.mjs`, then band-check against
   `references/sectors-api/data-quality.md`.
3. **Draft** — against `references/newsletter-format.md`'s contract and this skill's
   voice rules, in the CXO-optimizing-for-conversion role (see **Write as a CXO
   optimizing for conversion** above): name this issue's conversion goal first, then
   draft every element to move it. Bite-sized and visual by default: short blocks, bolded stats,
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

### Single company deep dive
Open `references/workflows/single-company-deep-dive.md`, and open `references/compliance.md`
before the valuation section (this is the type most likely to drift into "looks cheap,
buy it"). In brief: anchor a real recent trigger (earnings, corporate action, ownership
change), pull one sliced `company/report` plus the price series and, for earnings, the
quarterly call; state one benchmarked read and prove it; report valuation as context, not
a call.

### Sector spotlight
Open `references/workflows/sector-spotlight.md`. In brief: pick one sub-sector with a
current hook, pull `subsector/report` for the group median as the benchmark, screen and
`report` 2-4 members, and lead with a comparison table reading each name against the group
median and its own history, valuation context only, never "the one to buy."

### Daily market pulse
Open `references/workflows/daily-market-pulse.md`. In brief: one batched call for the
day's `top-changes` (`periods=1d`), `most-traded`, `brokers/top`, and `idx-total`; write a
one-line index read and two/three small tables; keep it short by design.

### New feature release
Open `references/workflows/new-feature-release.md`, and read `references/sourcing.md`'s
**gated sectors.app / docs.sectors.app fetch** note first. In brief: fetch
`sectors.app/release` live with a browser user-agent, pick the newest net-new feature,
write enablement copy (optionally showing the capability on one real band-checked data
example), cite the release page.

### Upcoming event
Open `references/workflows/upcoming-event.md`. This type is **not** market-data driven,
it's a promo for a Sectors in-house workshop, and the content comes from the user. Before
drafting, ask for all four: date/time/venue, agenda/speaker/target audience, registration
link, and marketing banner. Never invent any of them. Optionally include one real
`sectors.mjs` data teaser of what participants will build. This is the pipeline's one
exception to the "research the angle / fetch and validate data" opening stages, the
research step is the intake questions, and the only data fetch is the optional teaser.

## Hard rules (override style every time)

0. **Draft as a CXO optimizing for conversion.** Every issue targets one conversion goal
   set by its type (see **Write as a CXO optimizing for conversion**). Optimize the whole
   piece for that action, within — never around — the rules below.
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
    newsletter.html            weekly-wrap: the send-ready HTML email (no PDF attachment)
    chart-<slug>.svg           only if the issue includes the optional hero chart
    banner-<slug>.<ext>        upcoming-event only: the user-supplied banner, copied in
```

- `<type-slug>` is one of the eight built slugs: `weekly-wrap`, `daily-market-pulse`,
  `macro-reaction`, `three-stock-story`, `single-company-deep-dive`, `sector-spotlight`,
  `new-feature-release`, `upcoming-event`.
- `<YYYY-MM-DD>` is the issue/send date.
- Any generated chart file lands in this same folder, next to `newsletter.md`, and is
  referenced from it by a relative Markdown image link. For `upcoming-event`, a
  user-supplied local banner is copied in the same way; a banner given as a URL is
  referenced inline, not copied.
- **Weekly wrap ships as HTML.** It is the one type delivered as a send-ready
  `newsletter.html` (email-safe inline styles, table layout, tickers linked to
  `sectors.app/idx/<lower>`), replacing the old PDF-attachment format. Keep the
  `newsletter.md` as the review draft. See `workflows/weekly-wrap.md` §2c and the worked
  reference `newsletter/newsletter_2026-07-06_weekly-wrap/newsletter.html`.
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
  workflows/                      one doc per built issue type (eight)
    weekly-wrap.md                API recipe + section outline, Saturday issue
    daily-market-pulse.md         one-day movers/volume/brokers recipe, table-first
    macro-reaction.md             macro sourcing + affected-ticker + valuation-context
                                   recipe, non-advice framing
    three-stock-story.md          stock-pick discovery + history/people research +
                                   attributed-forecast recipe
    single-company-deep-dive.md   trigger-anchored one-stock read, earnings/action/owner
    sector-spotlight.md           one sub-sector peer-comparison on valuation
    new-feature-release.md        release-note-sourced product enablement copy
    upcoming-event.md             in-house workshop promo, user-supplied event details
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
