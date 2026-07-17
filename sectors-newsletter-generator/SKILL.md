---
name: sectors-newsletter-generator
description: >-
  Generate an on-brand, data-backed Markdown newsletter about the Indonesian stock
  market (IDX) from live Sectors data and cited research. Use whenever the user wants
  to write, draft, or produce a Sectors subscriber newsletter issue. Handles nine
  built issue types the user picks from on each run, across five families: MARKET
  PERFORMANCE ("weekly wrap" / "Saturday market wrap"; "monthly market pulse" a
  trailing-30-day movers/volume/broker-flow read); MARKET INSIGHTS ("macro-reaction" / "macro newsletter" tying the
  last ~2 days of macro news to affected sectors and tickers); COMPANY INSIGHTS ("three
  stocks story" history/people/fun-facts/attributed-outlook; "single company deep dive"
  off an earnings or corporate-action trigger; "sector spotlight" peer-comparing one
  sub-sector's names on valuation); SECTORS-ORG announcements ("new release feature" a
  two-part release-summary-plus-feature-highlight piece built from a user-supplied
  release note (PDF or Markdown) and user-supplied feature detail, not a live fetch;
  "upcoming event" promo for a Sectors in-house workshop, built from user-supplied
  event details, not market data);
  and PERSONALIZED ("watchlist/sector performance digest" — a fixed template, ranked
  performance + peer comparison table for each user's own tracked tickers/sectors,
  same presentation for every recipient, only the values change). The personalized
  type is the one exception to "no user-account data": it gets its audience and
  tracked-tickers/sectors from the sibling `sectors-newsletter-dbquery` skill's
  approved `watchlist-tracked-interest` query, never an ad-hoc query written here.
  Trigger on phrases like "write the newsletter", "do this week's Saturday wrap", "monthly
  pulse", "macro piece on the rate cut", "deep dive on BBRI earnings", "sector spotlight
  on the banks", "three-stocks story", "write up the new release feature", "announce
  the upcoming workshop", or "watchlist performance digest". Do NOT use it for Instagram
  carousels or slides (use sectors-carousel), for video, or for non-IDX/non-SGX markets,
  and do NOT use it for lifecycle/CRM/transactional email (onboarding nudges, credit/plan
  reminders, upgrade/win-back) or for deciding recipients/frequency, those need live
  user-account data and stay with the sibling `sectors-newsletter-dbquery` skill
  instead. This skill's deliverable is Markdown text and tables, bite-sized
  and scannable, plus at least one required generated chart image for the issue's single
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

## Personalization check (run before picking an issue type)

Ask one question first: **does this content need real per-user data (which tickers or
sectors a specific user tracks, their account/billing state) that the Sectors API
cannot supply?**

- **No** (the standard case — market-wide content, same for every reader): proceed to
  "Pick the issue type" below as normal, this skill's own API/web-research pipeline is
  sufficient, don't call any other skill.
- **Yes, and it's account/billing state** (renewal dates, credits, onboarding status,
  who to send a nudge to): out of scope here entirely, hand off to the sibling
  `sectors-newsletter-dbquery` skill, see **Out of scope** below.
- **Yes, and it's which tickers/sectors a user tracks** (this is the `watchlist-performance-digest`
  personalized type): invoke the `sectors-newsletter-dbquery` skill (via the Skill tool)
  to run its approved `watchlist-tracked-interest` query and return the raw audience
  rows. **Never write or improvise SQL in this skill, and never ask for Supabase access
  directly here** — this skill has no database credential of its own by design; the
  dbquery skill is the only path to that data, and it only ever runs a query that's
  already sitting approved in its `scripts/approved-queries/` folder. See
  `references/workflows/watchlist-performance-digest.md` step 1.

## Pick the issue type (always first)

This is **one issue per run**, never several at once. Nine issue types are built,
grouped by content family (mirroring the newsletter content plan's type catalog). Each
maps to a workflow doc in `references/workflows/` and an issue-type slug:

**Market Performance**
1. **Weekly wrap** (`weekly-wrap`) — the week's conclusion: index moves, sector/ticker
   standouts, flows. Saturday send.
2. **Monthly market pulse** (`monthly-market-pulse`) — the trailing 30 days' movers,
   most-traded, and broker flow, each aggregated across the whole window, not a single
   day's snapshot. Tight, table-first, chart-and-table led.

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
7. **New release feature** (`new-release-feature`) — two sections: the issue itself is
   a brief summary of the latest release off a user-supplied release note (PDF or
   Markdown, `sectors.app/release` is no longer live-fetchable, see the workflow doc;
   subject/preview/headline name only the release, never the feature), plus a
   secondary marketing/education section spotlighting one feature the user picks
   (which may differ from the release's own headline item), with a "Try the feature
   now" CTA (or "Try it yourself now!" if the feature has no
   direct URL).
8. **Upcoming event** (`upcoming-event`) — promo for a Sectors in-house workshop (online
   or offline, teaching participants to build on live Sectors API data). Content is
   **user-supplied**: ask for date/time/venue, agenda/speaker/target audience,
   registration link, and marketing banner before drafting. Not market-data driven.

**Personalized**
9. **Watchlist/sector performance digest** (`watchlist-performance-digest`) — a fixed
   template, same structure for every recipient, ranked performance + peer comparison
   table for up to 5 of that user's own tracked tickers/sectors (from the sibling
   dbquery skill's `watchlist-tracked-interest` query), only the values differ per
   recipient. The one type in this catalog that isn't a single broadcast piece, see
   the **Personalization check** above and
   `references/workflows/watchlist-performance-digest.md`.

**Skip the menu when the ask already resolves it**: if the user names the type and/or
subject ("do the Saturday wrap," "deep dive on BBRI earnings," "spotlight the banks"), go
straight into that pipeline. If they delegate the choice ("you pick this week's issue"),
choose and state a one-line "why this, why now" as you proceed. Only a bare "write the
newsletter" with no type named gets the menu, offer the nine above grouped by family.

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

These need live **user-account or billing state** this skill cannot fetch
(`quest_completed`, `credits_used`, onboarding progress, renewal dates). They are
lifecycle/CRM/transactional email, a different system entirely, triggered by account
state rather than market content, and drafted end-to-end by the sibling
`sectors-newsletter-dbquery` skill, not this one:

- Reminder: onboarding nudge, onboarding unclaimed reward, credit-expiry,
  quota-cycle renewal
- Account & Value: notification setup nudge, upgrade prompt, win-back reoffer

The one account-adjacent thing that IS in scope here is **which tickers/sectors a user
tracks**, that's audience/personalization data for the `watchlist-performance-digest`
type above, not a lifecycle trigger, see the **Personalization check** section.

**Recipient grouping, segmentation, frequency caps, and send scheduling are also out of
scope**, including for the personalized type. This skill generates content (one
broadcast piece, or one reusable per-recipient template); who receives it and when is
decided by the delivery/CRM system that consumes the output, not here.

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
| **New release feature** | Click "Try the feature now" and actively use the highlighted feature on real data |
| **Weekly wrap** | Return to `sectors.app` to explore the movers/sectors named |
| **Monthly market pulse** | Click into the tickers/tables to check the month's movers live |
| **Macro-reaction** | Explore the affected sectors/tickers on Sectors to size up the move |
| **Three-stock story** | Click through to each company's page on Sectors |
| **Single company deep dive** | Open that company's report on Sectors and dig into the data |
| **Sector spotlight** | Screen the sub-sector on Sectors and compare the peers themselves |
| **Watchlist/sector performance digest** | Open Sectors to check their own tracked tickers/sectors in full, now that the digest showed a real move on one |

If an issue type isn't listed (a not-yet-built type), state its conversion goal in one
line — "the one action a reader should take" — before drafting, and optimize for it the
same way. For any Sectors-org announcement the goal is product engagement; for market
content the goal is a return visit to `sectors.app` to explore the names cited.

## Shared pipeline shape

The eight broadcast issue types run the same five stages, then branch into the
type-specific workflow doc. Open each reference when you reach its stage, don't
pre-load everything up front. **`watchlist-performance-digest` diverges at stage 1**
(audience comes from the dbquery skill, not research) and stage 5 (delivers a
per-recipient template, not a single broadcast file), see its own workflow doc.
**`new-release-feature` and `upcoming-event` also diverge at stage 1**: no web/API
research, stage 1 is asking the user for the release note / event details instead,
see their own workflow docs.

1. **Research the angle** — web search and/or API discovery, before any drafting.
2. **Fetch and validate data** — `sectors.mjs`, then band-check against
   `references/sectors-api/data-quality.md`. Before fetching, check
   `/Users/evelyn/Desktop/newsletter/samples/<type-slug>/queries.md` for that issue
   type's resolved endpoint list, param shape, and date/window rule (e.g. weekly-wrap's
   Mon-Fri anchor, macro-reaction's last-2-days news window) — reuse the same criteria
   this run, only the dates/tickers change. If no sample exists yet for a type, the file
   still holds the documented recipe pattern; populate the sample after this run. This
   folder lives next to the delivered issues, not inside the skill, specifically so it's
   easy to open and edit directly when the user wants to adjust a type's format or
   presentation, without touching skill internals.
3. **Draft** — against `references/newsletter-format.md`'s contract and this skill's
   voice rules, in the CXO-optimizing-for-conversion role (see **Write as a CXO
   optimizing for conversion** above): name this issue's conversion goal first, then
   draft every element to move it. Bite-sized and visual by default: short blocks, bolded stats,
   Markdown tables for any ranked or compared list of 3+, and at most one real
   generated chart for the issue's hero trend (`newsletter-format.md`'s **Bite-sized &
   visual formatting** section, which routes chart work through the `dataviz` skill).
4. **Self-review** — the checklist at the end of the chosen workflow doc, plus
   `references/compliance.md`'s one-line test. Also diff the draft's section order and
   heading logic against `/Users/evelyn/Desktop/newsletter/samples/<type-slug>/newsletter.md`
   (when one exists) so flow and section-title logic stay consistent issue to issue for
   the same type, not just compliant with the prose skeleton in isolation.
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

### Monthly market pulse
Open `references/workflows/monthly-market-pulse.md`. In brief: `top-changes`
(`periods=30d`) for the month's gainers/losers, `most-traded` over the 30-day window
aggregated client-side into one ranking (the endpoint itself only returns per-date
top-N), `brokers/top` called once per trading day in the window and aggregated the same
way (no native range param), and `idx-total` start/end for the month's index read; write
the headline off that month's own idx-total trend, a combined Top Movers table+chart,
Most traded, and Broker Flow, table-first throughout.

### New release feature
Open `references/workflows/new-release-feature.md`. This type is **not** a live fetch,
`sectors.app/release` sits behind a JS challenge page no fetch method here clears
(confirmed 2026-07-17). In brief: ask the user for the release note (PDF or Markdown)
and the feature to highlight (what it does, how to use it, and its URL if one exists),
write section 1 as a brief release summary with a Read more button to the release
note's own URL, section 2 as an in-depth feature highlight closing with "Try the
feature now" (or "Try it yourself now!" if no feature URL was given), cite the release
note in Sources.

### Upcoming event
Open `references/workflows/upcoming-event.md`. This type is **not** market-data driven,
it's a promo for a Sectors in-house workshop, and the content comes from the user. Before
drafting, ask for all four: date/time/venue, agenda/speaker/target audience, registration
link, and marketing banner. Never invent any of them. Optionally include one real
`sectors.mjs` data teaser of what participants will build. This is one of two pipeline
exceptions to the "research the angle / fetch and validate data" opening stages (the
other is `new-release-feature`, above), the research step here is the intake
questions, and the only data fetch is the optional teaser.

### Watchlist/sector performance digest
Open `references/workflows/watchlist-performance-digest.md`. This is the pipeline's
other divergent type, personalized rather than broadcast. In brief: invoke the
`sectors-newsletter-dbquery` skill to run its approved `watchlist-tracked-interest`
query and get each eligible user's tracked tickers/sectors; for a sample user, fetch
7-day performance for every tracked item (IDX tickers via `company/report?sections=overview,peers`
for performance + ready-made peer comparison, SGX tickers via `sgx/company/report`
for performance only, "coming soon" where peer comparison isn't available; a tracked
sector via a sub-sector screen for its aggregate move + top mover), plus real dated
factors/news per item where a genuine source exists (Sectors API `news/`/
`corporate-actions` for IDX, a cited web search for SGX); pick the headline by
absolute 7-day move, cap the table at 5 rows grouped by exchange (IDX before SGX)
then sorted by signed move within each group; draft one fixed template with the
ranked table and a factual takeaway paragraph, prove it against that one real user as
the worked example, `{{merge_tag}}` every per-recipient field the same way the
dbquery skill's templates do.

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
7. **One fixed color palette, every issue, no per-type exceptions** (confirmed
   2026-07-16). Ticker blue `#3288BD` for every ticker/sector/broker-code link,
   table cell, chart label, AND inline prose mention, not just tables. Gain green
   `#1D8A4E` / loss red `#D6295A` for every signed %-move, table or chart —
   `barChart` needs `financial: true` to actually render green for a positive bar,
   it doesn't default to it. Brand magenta `#d6336c` is the CTA button's color and
   nothing else's. Full treatment in `newsletter-format.md`'s **Color convention**
   section.
8. **Appendix required on every issue** (confirmed 2026-07-16), not optional, not
   type-dependent: the endpoint/field trace block, after Sources, before the
   disclaimer, sized to how much was actually fetched. See
   `newsletter-format.md`'s **Appendix** section.
9. **Every broker code links** to `sectors.app/idx/broker/<lower>`, same ticker-blue
   styling, on any type that has a broker/flow table (confirmed 2026-07-16).

Full treatment, including the "good time to purchase" / "great future forecast"
reconciliation, lives in `references/compliance.md` — read it before drafting the
macro-reaction or three-stock-story types.

## Delivery

Finished issues land at:

```
/Users/evelyn/Desktop/newsletter/newsletter_<YYYY-MM-DD>_<type-slug>/
    newsletter.md
    newsletter.html            every type: the send-ready HTML email
    chart-<slug>.svg           every issue's required hero chart
    banner-<slug>.<ext>        upcoming-event only: the user-supplied banner, copied in
    sample-rows.csv            watchlist-performance-digest only: the real audience rows
                                the dbquery skill's query returned this run (local only,
                                contains PII, never copy elsewhere or commit)
```

- `<type-slug>` is one of the nine built slugs: `weekly-wrap`, `monthly-market-pulse`,
  `macro-reaction`, `three-stock-story`, `single-company-deep-dive`, `sector-spotlight`,
  `new-release-feature`, `upcoming-event`, `watchlist-performance-digest`.
- `<YYYY-MM-DD>` is the issue/send date.
- Any generated chart file lands in this same folder, next to `newsletter.md`, and is
  referenced from it by a relative Markdown image link. For `upcoming-event`, a
  user-supplied local banner is copied in the same way; a banner given as a URL is
  referenced inline, not copied.
- **`watchlist-performance-digest` delivers a template, not a single piece.**
  `newsletter.md` for this type is the same kind of artifact as a dbquery issue:
  `{{merge_tag}}` placeholders plus one worked example rendered against a real sample
  row, not standalone finished copy. `sample-rows.csv` carries real user PII (email,
  tracked tickers/sectors), same discipline as the dbquery skill's own
  `references/supabase-access.md`: flag it to the user, it stays local, never leaves
  this machine.
- **Every issue type ships as HTML, and every issue gets a hero chart.** All nine types
  are delivered as a send-ready `newsletter.html` (email-safe inline styles, table
  layout, tickers linked to `sectors.app/idx/<lower>`), replacing the old
  PDF-attachment format, plus at least one generated `chart-<slug>.svg` per issue.
  This was originally weekly-wrap- and upcoming-event-only; the samples in
  `newsletter/samples/` now cover all nine types with both, and any newly delivered
  issue matches that standard regardless of type. Keep `newsletter.md` as the review
  draft, ship the `.html` alongside it. See `workflows/weekly-wrap.md` §2c and the
  worked reference `newsletter/newsletter_2026-07-06_weekly-wrap/newsletter.html` for
  the digest type; `workflows/upcoming-event.md` §4 and
  `newsletter/newsletter_2026-07-13_upcoming-event/newsletter.html` for the promo type;
  and `newsletter/samples/<type-slug>/newsletter.html` for every other type's own
  worked reference.
- Scratch fetches (raw `sectors.mjs --save-dir` JSON) go to the scratchpad or a
  `_draft`/`data` subfolder, not into the delivered folder.
- `newsletter/` is a plain folder, separate from the skills repo and from the
  `sectors-carousel` skill's `scs/<ticker>_<slug>/` git repo, no git init needed here.
- **`samples/` lives in this same `newsletter/` folder, not inside the skill.**
  `/Users/evelyn/Desktop/newsletter/samples/<type-slug>/` holds one `newsletter.md`
  (+`.html`/chart where applicable) and a `queries.md` per issue type, deliberately kept
  next to the delivered issues rather than under the skill's own `references/` so the
  user can open and edit a type's format/presentation reference directly, without
  digging into skill internals. See **Shared pipeline shape** steps 2 and 4 for when
  this skill reads it, and refresh a type's sample here after any run whose output is
  more current or more refined than what's stored.

## What's in this skill

```
SKILL.md                          you are here
references/
  newsletter-format.md            the Markdown output contract: header metadata,
                                   ticker convention, number formatting, per-type
                                   section skeletons, disclaimer footer
  compliance.md                   hard rules + the advice-reconciliation guidance
  sourcing.md                     web research + citation rules
  workflows/                      one doc per built issue type (nine)
    weekly-wrap.md                API recipe + section outline, Saturday issue
    monthly-market-pulse.md       30-day movers/volume/broker-flow recipe, table-first
    macro-reaction.md             macro sourcing + affected-ticker + valuation-context
                                   recipe, non-advice framing
    three-stock-story.md          stock-pick discovery + history/people research +
                                   attributed-forecast recipe
    single-company-deep-dive.md   trigger-anchored one-stock read, earnings/action/owner
    sector-spotlight.md           one sub-sector peer-comparison on valuation
    new-release-feature.md        user-supplied release note summary + one feature
                                   highlight, no live fetch
    upcoming-event.md             in-house workshop promo, user-supplied event details
    watchlist-performance-digest.md  personalized, per-recipient template; calls the
                                   dbquery skill for audience, ranks tracked
                                   tickers/sectors by 7-day move, top 5, peer
                                   comparison for IDX only
  sectors-api/                    endpoints, data-quality, README (the data layer, v2 —
                                   a synced copy shared with sectors-carousel)
  writing/
    writing.md, brand-voice.md    the craft/voice reference this skill inherits wholesale
                                   (a synced copy shared with sectors-carousel)
scripts/
  sectors.mjs                     authenticated Sectors API GET (zero external
                                   dependencies, self-locates its own config; a synced
                                   copy shared with sectors-carousel)
  charts.mjs                      inline-SVG chart generators (bar/line/donut/multiline/
                                   radar/waterfall/table/scatter/heatmap/bump/sankey/
                                   movers/compose), forked from sectors-carousel's own
                                   scripts/charts.mjs for a LIGHT chart surface — same
                                   geometry, own light-safe color constants (see the
                                   file's header comment for the validated role map;
                                   GAIN/LOSS is brand green/red `#1D8A4E`/`#D6295A`,
                                   ticker mentions are blue `#3288BD`, see Hard rule 7)
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
the shared API key already ships in `config.json`. The required hero chart is generated
with this skill's own `scripts/charts.mjs` (import the chart-kind function you need —
`sparkline`/`line` for a price series, `barChart` for year-over-year (pass `financial:
true` for a signed gain/loss series), `donut` for a mix, `moversChart` for a ranked
gainers/losers list with per-row logos, etc. — and write its returned SVG string to a
file, no Puppeteer, no build step). Still
consult the `dataviz` skill first for **which kind of chart fits the data** (its form
heuristic and the "which Sectors field maps to which chart" table in the sibling
carousel skill's `references/charts.md` both apply here unchanged); `charts.mjs` is the
render step once that choice is made. This IS the carousel's chart engine, forked for a
light surface rather than avoided: the two skills' geometry and chart-kind grammar now
match, only the color constants differ (see `scripts/charts.mjs`'s header comment for
the validated light-mode role map). Sanity check:

```bash
node scripts/sectors.mjs "idx-total/?start=2026-07-01&end=2026-07-08"
```
