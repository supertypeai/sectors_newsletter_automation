---
name: sectors-newsletter-generator
description: >-
  Generate an on-brand, data-backed Markdown newsletter about the Indonesian stock
  market (IDX) from live Sectors data and cited research. Use whenever the user wants
  to write, draft, or produce a Sectors subscriber newsletter issue. Handles ten
  built issue types the user picks from on each run, across five families: MARKET
  PERFORMANCE ("weekly insights v2" / "weekly insights" / "Monday market wrap", the
  current eight-block Monday digest and the default for a weekly send; "weekly wrap"
  the superseded eleven-section v1, kept until the user retires it; "monthly market
  pulse" a trailing-30-day movers/volume/broker-flow read); MARKET INSIGHTS ("macro-reaction" / "macro newsletter" tying the
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

Settle one question first, by reading the request rather than asking the user:
**does this content need real per-user data (which tickers or
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
  rows. **Never write or improvise SQL for user-account data in this skill** — the
  dbquery skill is the only path to that data, and it only ever runs a query that's
  already sitting approved in its `scripts/approved-queries/` folder. See
  `references/workflows/watchlist-performance-digest.md` step 1. (This skill does hold
  its own Supabase MCP access for public market-data aggregates that the Sectors API
  can't range-query, e.g. broker flow and foreign flow, via the two pinned queries in
  `scripts/fixed-queries/`, see workflows/monthly-market-pulse.md §3 and
  workflows/weekly-insights-v2.md. That's a different category from account data and
  doesn't go through dbquery's approval gate.)

## Running unattended (CI, cron, scheduled runs)

When the environment variable `NEWSLETTER_UNATTENDED=1` is set, **no human is
reachable during the run**. Never ask a question, never pause for input, never stop at
a menu. Every decision this skill would normally put to the user has a documented
default below; take it, and record the choice in the issue's own appendix so a reviewer
can see what was decided on their behalf.

| Decision point | Unattended default |
| --- | --- |
| Issue type, none named in the prompt | `weekly-insights-v2` |
| Foreign-flow definition | exchange (`idx_daily_data`) via `scripts/fixed-queries/foreign-flow-range.sql`; **needs the Supabase MCP connector**, see below |
| Block 4 visuals, no card URLs supplied | generate with `scripts/charts.mjs`, never wait for cards |
| `$NEWSLETTER_HOME/samples/<type-slug>/` absent | proceed without it, note the absence in the appendix |
| Upcoming-events sheet unreachable | omit that block, note it, don't fail the issue |
| A requested type isn't built yet | stop with a clear error naming the type, don't substitute a different one |
| Anything else this skill would ask | take the documented default and state the choice in the appendix |

Two things stay hard failures even here, because the alternative is publishing
something false: a **fetch that returns no usable data for a required block** (say the
window's index series comes back empty), and any figure that would have to be invented
to fill a gap. Fail the run loudly instead. Hard rules 1 through 3 outrank the
never-stall instruction above, always.

**Foreign flow needs the Supabase MCP connector, not just the Sectors API.** The
exchange definition is only reachable through `scripts/fixed-queries/foreign-flow-range.sql`
against `idx_daily_data`; no Sectors API endpoint exposes the foreign buy/sell volume
split (`daily/{symbol}` carries close/volume/market-cap only, and `foreign-flow/{symbol}`
is the broker-domicile measure the rule forbids for this figure). So if the connector
isn't configured in the runner, **omit the flow figure and note the omission** rather
than substituting the broker endpoint, which would publish the contradiction the rule
exists to prevent. Flow is one line in Key Data Bites, not a required block; the issue
stands without it.

**Types that need human-supplied source material** (`upcoming-event`,
`new-release-feature`, `watchlist-performance-digest`) are not automatable and must not
be attempted unattended. If one is requested with `NEWSLETTER_UNATTENDED=1`, stop and
say why.

## Pick the issue type (always first)

This is **one issue per run**, never several at once. Ten issue types are built,
grouped by content family (mirroring the newsletter content plan's type catalog). Each
maps to a workflow doc in `references/workflows/` and an issue-type slug:

**Market Performance**
1. **Weekly Insights v2** (`weekly-insights-v2`) — **the default weekly send.** Eight
   blocks, info-packed, no long-form reading: greeting, Key Data Bites, Top Movers, one
   "What the Data Unearthed" findings block built on the social cards, Insider Filings,
   Headlines, a corporate-action week calendar, CTA. Monday send (confirmed 2026-07-20,
   moved from the original Saturday cadence, see Hard rule 11).
2. **Weekly wrap** (`weekly-wrap`) — **superseded by v2**, kept live until the user
   retires it. The eleven-section long-form version: index moves, sector/ticker
   standouts, flows. Only pick this if the user names v1 explicitly.
3. **Monthly market pulse** (`monthly-market-pulse`) — the trailing 30 days' movers,
   most-traded, and broker flow, each aggregated across the whole window, not a single
   day's snapshot. Tight, table-first, chart-and-table led.

**Market Insights**
4. **Macro-reaction** (`macro-reaction`) — tie the last ~2 days of macro news to affected
   sectors/tickers, then report each name's fundamentals and valuation context.

**Company Insights**
5. **Three-stock storytelling** (`three-stock-story`) — three companies' history, people,
   fun facts, attributed forward outlook.
6. **Single company deep dive** (`single-company-deep-dive`) — one name read in depth off
   a real earnings / corporate-action / ownership trigger.
7. **Sector spotlight** (`sector-spotlight`) — one sub-sector's names peer-compared on
   valuation ("which one is actually cheap," as context, not a call).

**Sectors-org announcements** (about Sectors itself, not the market)
8. **New release feature** (`new-release-feature`) — two sections: the issue itself is
   a brief summary of the latest release off a user-supplied release note (PDF or
   Markdown, `sectors.app/release` is no longer live-fetchable, see the workflow doc;
   subject/preview/headline name only the release, never the feature), plus a
   secondary marketing/education section spotlighting one feature the user picks
   (which may differ from the release's own headline item), with a "Try the feature
   now" CTA (or "Try it yourself now!" if the feature has no
   direct URL).
9. **Upcoming event** (`upcoming-event`) — promo for a Sectors in-house workshop (online
   or offline, teaching participants to build on live Sectors API data). Content is
   **user-supplied**: ask for date/time/venue, agenda/speaker/target audience,
   registration link, and marketing banner before drafting. Not market-data driven.

**Personalized**
10. **Watchlist/sector performance digest** (`watchlist-performance-digest`) — a fixed
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
newsletter" with no type named gets the menu, offer the ten above grouped by family.

**Under `NEWSLETTER_UNATTENDED=1` there is no menu.** A bare "write the newsletter" with
no type named runs `weekly-insights-v2`, the default weekly send; say so in the appendix
and carry on. See **Running unattended** above.

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
   `$NEWSLETTER_HOME/samples/<type-slug>/queries.md` for that issue
   type's resolved endpoint list, param shape, and date/window rule (e.g. weekly-wrap's
   Mon-Fri anchor, macro-reaction's last-2-days news window) — reuse the same criteria
   this run, only the dates/tickers change. If no sample exists yet for a type, the file
   still holds the documented recipe pattern; populate the sample after this run.
   **If the folder itself is absent** (a fresh clone, a CI runner), fall back to the
   recipe in this type's own workflow doc, note the absence in the appendix, and carry
   on — a missing sample is never a reason to stall or to fail the run. This
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
   heading logic against `$NEWSLETTER_HOME/samples/<type-slug>/newsletter.md`
   (when one exists) so flow and section-title logic stay consistent issue to issue for
   the same type, not just compliant with the prose skeleton in isolation. When no
   sample exists, review against the type's own skeleton in
   `references/newsletter-format.md` instead and say so in the appendix.
5. **Deliver** — see Delivery below.

### Weekly Insights v2
Open `references/workflows/weekly-insights-v2.md` for the exact API recipe and section
order, and `newsletter/samples/weekly-insights-v2/` for the worked reference. In brief:
settle the Mon-Fri window as v1 does, then build eight blocks, not eleven. Key Data Bites
carries every computed market-level fact; Other Major Headlines carries every news-sourced
one; the two must never repeat a fact. The single analysis block joins two sources to find
something the tables don't already say, illustrated with the carousel's social cards.
**Foreign flow uses the exchange definition** (`idx_daily_data`), settled 2026-07-27,
pulled via `scripts/fixed-queries/foreign-flow-range.sql`. Don't ask, and don't mix in
`foreign-flow/{symbol}`'s broker-domicile figure, the two disagree on direction
(workflow doc §3).

### Weekly wrap (v1, superseded)
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
top-N), Broker Flow pulled with the fixed `scripts/fixed-queries/broker-summary-range.sql`
Supabase query over the 30-day window (no native `brokers/top` range param, so this
replaces looping the API day by day), and `idx-total` start/end for the month's index
read; write the headline off that month's own idx-total trend, a combined Top Movers
table+chart, Most traded, and Broker Flow, table-first throughout.

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
7. **One fixed color palette, every issue, no per-type exceptions** (repalette
   2026-07-20). Accent `#9E0142` on **every** `<a>` without exception (ticker, sector,
   broker code, citation, footer, and the tickers inside the Top Gainers/Losers cards that
   used to render dark) **and** on the CTA button background; the old blue-link/
   magenta-button split is gone. Gain `#568475` / loss `#D53E50` for every signed %-move, table or
   chart — `barChart` needs `financial: true` to render gain colour on a positive bar,
   it doesn't default to it. Gain and loss clear AA only when bold on a numeric
   reading, never as running copy. Full treatment in `newsletter-format.md`'s **Color
   convention** section.
8. **Appendix required on every issue** (confirmed 2026-07-16), not optional, not
   type-dependent: the endpoint/field trace block, after Sources, before the
   disclaimer, sized to how much was actually fetched. See
   `newsletter-format.md`'s **Appendix** section.
9. **Every broker code links** to `sectors.app/idx/broker/<lower>`, same ticker-blue
   styling, on any type that has a broker/flow table (confirmed 2026-07-16).
10. **"Upcoming Events" closing block on every issue except `upcoming-event` itself**
    (confirmed 2026-07-20, revised same day to cover every still-upcoming row, not just
    the nearest): a small promo for Sectors workshops, live-fetched from a shared Google
    Sheet (`references/upcoming-events-source.md`), not user-supplied, placed after the
    issue's own CTA and before Sources. One card per still-upcoming row, soonest first,
    each with poster image, title, description, details list, and a "Register here"
    button to `eventUrl`, five fields per event straight off the sheet, nothing
    invented. Heading is the fixed text "Upcoming Events," not a variable lead-in. See
    `newsletter-format.md`'s **Upcoming events closing block** section for the exact
    contract. **If the sheet is unreachable** (network failure, the doc moved), omit the
    block and note the omission in the appendix rather than failing the issue or
    inventing an event; the sheet is a public `curl`, so a failure here is transport,
    not content. Every row still upcoming is required whenever the fetch *does* succeed.
11. **Weekly Insights v2's issue date is today's actual date, not a computed Monday**
    (revised 2026-07-27, superseding the 2026-07-20 "Monday immediately after the
    Friday close" rule). Use the real date the draft is generated on, whatever day
    that is, never a theoretical Monday derived from the reporting window. `date:` in
    the frontmatter, the delivery folder's `<YYYY-MM-DD>`, the HTML `<!-- -->` header
    comment, and every `utm_campaign` suffix all use this same actual date, not the
    Friday `data_as_of` date and not a window-derived Monday. See
    `workflows/weekly-insights-v2.md` and the **Header block** section of
    `newsletter-format.md`.
12. **HTML disclaimer footer uses fixed markup, verbatim, every issue** (confirmed
    2026-07-24): the bordered `<tr>` block with the non-advice line, the `sectors.app`
    citation link, and the `Sectors | sectors.app | @sectorsapp` line. Fill only the
    UTM campaign slug/date, the `data_as_of` date, both `sectors.app` links carrying
    the same footer UTM string, Instagram left untagged. Exact HTML in
    `newsletter-format.md`'s **Standard disclaimer footer** section, don't hand-write
    a variant per issue.

Full treatment, including the "good time to purchase" / "great future forecast"
reconciliation, lives in `references/compliance.md` — read it before drafting the
macro-reaction or three-stock-story types.

## Delivery

**`$NEWSLETTER_HOME` is the root for both delivered issues and the `samples/`
reference folder.** Resolve it in this order, and state which one you used in the
appendix:

1. the `NEWSLETTER_HOME` environment variable, if set (this is what CI sets);
2. otherwise `<repo-root>/newsletter/`, alongside the skills checkout;
3. otherwise ask, but only when a human is present — under `NEWSLETTER_UNATTENDED=1`
   never ask, take option 2.

Create the folder if it doesn't exist rather than treating its absence as an error.
Never write a delivered issue to a path outside this root.

Finished issues land at:

```
$NEWSLETTER_HOME/newsletter_<YYYY-MM-DD>_<type-slug>/
    newsletter.md
    newsletter.html            every type: the send-ready HTML email
    chart-<slug>.svg           every issue's required hero chart, the source of truth
    chart-<slug>.png           the same chart rasterized for email; what the HTML
                                actually references, since Gmail and Outlook strip SVG
                                (generated by scripts/rasterize.mjs, needs `npm install`)
    banner-<slug>.<ext>        upcoming-event only: the user-supplied banner, copied in
    sample-rows.csv            watchlist-performance-digest only: the real audience rows
                                the dbquery skill's query returned this run (local only,
                                contains PII, never copy elsewhere or commit)
```

- `<type-slug>` is one of the ten built slugs: `weekly-insights-v2`, `weekly-wrap`,
  `monthly-market-pulse`,
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
- **Every issue type ships as HTML, and every issue gets a hero chart.** All ten types
  are delivered as a send-ready `newsletter.html` (email-safe inline styles, table
  layout, tickers linked to `sectors.app/idx/<lower>`), replacing the old
  PDF-attachment format, plus at least one generated `chart-<slug>.svg` per issue.
  This was originally weekly-wrap- and upcoming-event-only; the samples in
  `newsletter/samples/` now cover all ten types with both, and any newly delivered
  issue matches that standard regardless of type. **`weekly-insights-v2` satisfies the
  visual requirement with the social cards in its findings block instead of a generated
  `chart-<slug>.svg`**; if no suitable card exists for a given week, generate a chart so
  the issue is never image-less. This type is also the one exception to the
  "at most one generated chart per issue" guidance in stage 3: its findings block runs one
  visual per finding, so two or three charts is correct there, not a violation. Keep `newsletter.md` as the review
  draft, ship the `.html` alongside it. See `workflows/weekly-wrap.md` §2c and the
  worked reference `newsletter/newsletter_2026-07-06_weekly-wrap/newsletter.html` for
  the digest type; `workflows/upcoming-event.md` §4 and
  `newsletter/newsletter_2026-07-13_upcoming-event/newsletter.html` for the promo type;
  and `newsletter/samples/<type-slug>/newsletter.html` for every other type's own
  worked reference.
- Scratch fetches (raw `sectors.mjs --save-dir` JSON) go to the scratchpad or a
  `_draft`/`data` subfolder, not into the delivered folder.
- Locally, `$NEWSLETTER_HOME` is a plain folder, separate from the
  `sectors-carousel` skill's `scs/<ticker>_<slug>/` git repo, no git init needed here.
  In CI it resolves inside the repo checkout instead, because the delivered issue is
  what the review PR carries; that's the one case where issues are committed.
- **`samples/` lives in this same `$NEWSLETTER_HOME` folder, not inside the skill.**
  `$NEWSLETTER_HOME/samples/<type-slug>/` holds one `newsletter.md`
  (+`.html`/chart where applicable) and a `queries.md` per issue type, deliberately kept
  next to the delivered issues rather than under the skill's own `references/` so the
  user can open and edit a type's format/presentation reference directly, without
  digging into skill internals. See **Shared pipeline shape** steps 2 and 4 for when
  this skill reads it, and refresh a type's sample here after any run whose output is
  more current or more refined than what's stored.
  **This folder is not shipped with the skill** and will be missing on a fresh clone or
  a CI runner. Both read sites above degrade gracefully when it is; nothing here is a
  hard dependency.

## What's in this skill

```
SKILL.md                          you are here
references/
  newsletter-format.md            the Markdown output contract: header metadata,
                                   ticker convention, number formatting, per-type
                                   section skeletons, disclaimer footer
  compliance.md                   hard rules + the advice-reconciliation guidance
  sourcing.md                     web research + citation rules
  upcoming-events-source.md       Google Sheet fetch recipe + selection logic for the
                                   closing-block promo every issue but upcoming-event
                                   carries (Hard rule 10)
  workflows/                      one doc per built issue type (ten)
    weekly-insights-v2.md         the current Monday digest: eight blocks, social-card
                                   findings block, corporate-action week calendar
    weekly-wrap.md                v1, superseded by the above, kept until retired
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
                                   GAIN/LOSS is brand green/red `#568475`/`#D53E50`,
                                   ticker mentions are blue `#9E0142`, see Hard rule 7)
config.example.json               template for the optional local key file;
                                   SECTORS_API_KEY env is the primary source
```

**This skill is self-contained**: `scripts/sectors.mjs`,
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

`sectors.mjs` and `charts.mjs` need nothing but `node`, no npm packages, so a
Markdown-only draft needs no install. **`scripts/rasterize.mjs` is the one exception**:
it needs Puppeteer (`npm install` in this folder, once per machine) to turn the chart
SVGs into the PNGs email clients can actually display. Skip it if you only want the
`.md`; you need it for any issue you intend to send. Set
the API key once with `export SECTORS_API_KEY=<key>`; no key ships in the repo, and a
local `config.json` (copied from `config.example.json`) is an optional gitignored
fallback if you prefer a file. The required hero chart is generated
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
