---
name: sectors-newsletter-generator
description: >-
  Generate an on-brand, data-backed Markdown newsletter about the Indonesian (IDX) and
  Singapore (SGX) stock markets from live Sectors data and cited research. Use whenever the user wants
  to write, draft, or produce a Sectors subscriber newsletter issue. Ten built issue
  types across six families (market performance, market insights, company insights,
  Sectors-org announcements, FOMO, personalized), one picked per run from the catalog
  inside the skill. Trigger on phrases like "write the newsletter", "weekly insights
  v2", "weekly insights", "Monday market wrap", "do this week's Saturday wrap", "weekly
  wrap", "monthly pulse", "macro piece on the rate cut", "macro newsletter", "deep dive
  on BBRI earnings", "sector spotlight on the banks", "three-stocks story", "write up
  the new release feature", "announce the upcoming workshop", "watchlist performance
  digest", or "did you catch it piece on [ticker]". The deliverable is Markdown text and
  tables, bite-sized and scannable, plus a required visual (a generated chart, or bucket social cards for weekly insights v2); it
  is not a slides or video renderer. Do NOT use it for Instagram carousels or slides
  (use sectors-carousel), for video (use market-story-video), or for non-IDX/non-SGX
  markets, and do NOT use it for lifecycle/CRM/transactional email (onboarding nudges,
  credit/plan reminders, upgrade/win-back) or for deciding recipients/frequency, those
  need live user-account data and stay with the sibling `sectors-newsletter-dbquery`
  skill instead.
---

# Sectors Newsletter Generator

Turn an IDX or SGX story into a finished, cited, brand-voice Markdown newsletter issue for
Sectors subscribers. Two disciplines carried over from the sibling `sectors-carousel`
skill govern everything here:

- **Insight, not data.** Every number states what it means. A conclusion, not a stat
  dump.
- **Factual by construction.** Every claim is a real Sectors API field or a cited
  source, nothing fabricated, nothing prescriptive. See `references/compliance.md`.

## Exchange check (run before picking an issue type)

**Decide IDX or SGX (or both) before anything else.** Most issue types are IDX by
construction (weekly insights, monthly market pulse, broker/foreign-flow reads), but a
company-insights piece (three stocks story, single company deep dive, sector spotlight)
and a macro-reaction piece can run on SGX names, and the `watchlist-performance-digest`
routinely mixes both because subscribers track both. Read the exchange off the ask: an
Indonesian 4-letter ticker, "IDX", rupiah, BI or OJK means IDX; an SGX code (D05, O39,
U11, Z74, C6L), "SGX", "Singapore", "STI" or MAS means SGX. When nothing in the ask
names a market, default to IDX and say in one line that you did.

For anything SGX, read `references/sectors-api/endpoints.md` §4 first: prefer the
`fetch-sgx-*` MCP tools (report, daily transaction, top companies, sectors/subsectors,
news, filings, buybacks, short-sell) over the three raw REST paths, and never assume an
IDX endpoint has an SGX twin — foreign flow, broker summary, and corporate actions are
IDX-only, so an SGX issue has to pick an angle SGX data can actually prove. Label the
exchange in the copy whenever both appear in one issue.

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
  `references/workflows/watchlist-performance-digest.md` step 1.
- **Yes, and it's a market aggregate the Sectors API can't range-query** (broker flow,
  foreign flow over a window): also the dbquery skill. Invoke it for its approved
  `broker-summary-range` or `foreign-flow-range` query, see
  workflows/monthly-market-pulse.md §3 and workflows/weekly-insights-v2.md.

**This skill never calls `mcp__supabase__*` itself, for any category of data.** Every
Supabase read goes through `sectors-newsletter-dbquery`, which only runs SQL already approved in
its `scripts/approved-queries/` folder. A query improvised mid-draft is how a made-up
number reaches a subscriber.

## Running unattended (CI, cron, scheduled runs)

When the environment variable `NEWSLETTER_UNATTENDED=1` is set, **no human is
reachable during the run**. Never ask a question, never pause for input, never stop at
a menu. Every decision this skill would normally put to the user has a documented
default below; take it, and record the choice in a **separate `run-notes.md` file in
the delivery folder**, never anywhere inside `newsletter.md` or `newsletter.html`.

**Why a separate file and not a comment in the HTML.** The delivery pipeline sends
`newsletter.html` to subscribers byte for byte, comments included — an HTML comment is
invisible in a mail client but still ships in the message source, where any recipient
can read it, and it counts against Gmail's ~102KB clipping threshold. `run-notes.md`
is never read by the send path at all, so it reaches the PR reviewer and nobody else.
It also keeps the distinction structural rather than syntactic: internal notes are a
different *file*, not the same file relying on comment markers to stay hidden. That
fragile in-file distinction is what produced the original bug.

```markdown
<!-- run-notes.md, sits beside newsletter.md, never sent -->
# Unattended-run notes, 2026-07-29

- Issue type: not named in the request, defaulted to weekly-insights-v2.
- Foreign flow: Supabase MCP connector unavailable, figure omitted (not substituted).
- Block 4 visuals: 2 of 3 findings used real cards; the third fell back to charts.mjs.
```

A run once rendered these notes as a visible `<div>` in the delivered email (confirmed
2026-07-29, caught by the user) — that must never happen again, in any form. If in
doubt whether something belongs in the visible Appendix or in `run-notes.md`: the
Appendix answers "what data backs this issue" and is normal reader-facing content on
every issue (Hard rule 8); `run-notes.md` answers "what did the robot decide on its own
because nobody was there to ask," and is for nobody but a PR reviewer.

| Decision point | Unattended default |
| --- | --- |
| Issue type, none named in the prompt | `weekly-insights-v2` |
| Foreign-flow definition | exchange (`idx_daily_data`) via `scripts/fixed-queries/foreign-flow-range.sql`; **needs the Supabase MCP connector**, see below |
| Block 4 visuals, no one to ask for card URLs | **generate every finding's visual with `scripts/charts.mjs`** — the bucket cannot be listed unattended, so there is no mechanical way to find a real card. See `workflows/weekly-insights-v2.md`'s **Visuals: the social cards** section |
| `$NEWSLETTER_HOME/samples/<type-slug>/` absent | proceed without it, note the absence in `run-notes.md` |
| Upcoming-events sheet unreachable | omit that block, note it, don't fail the issue |
| A requested type isn't built yet | stop with a clear error naming the type, don't substitute a different one |
| Anything else this skill would ask | take the documented default and state the choice in `run-notes.md` |

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
isn't configured in the runner, **omit the flow figure and note the omission in the
`run-notes.md`** (never inside the sent HTML) rather than substituting the broker
endpoint, which would publish the contradiction the rule exists to prevent. Flow is one
line in Key Data Bites, not a required block; the issue stands without it.

**Types that need human-supplied source material** (`upcoming-event`,
`new-release-feature`, `watchlist-performance-digest`) are not automatable and must not
be attempted unattended. If one is requested with `NEWSLETTER_UNATTENDED=1`, stop and
say why.

## Pick the issue type (always first)

This is **one issue per run**, never several at once. Ten issue types are built,
grouped by content family (mirroring the newsletter content plan's type catalog). Each
row names its slug, its workflow doc under `references/workflows/`, and its section
skeleton under `references/newsletter-format/skeletons/`; both files share the slug.

| family | type (slug) | what it is |
|---|---|---|
| Market Performance | **Weekly Insights v2** (`weekly-insights-v2`) | **the default weekly send.** Nine blocks, info-packed, no long-form reading: greeting, Key Data Bites, Top Movers, one "What the Data Unearthed" findings block built on the social cards, Insider Filings, Headlines, a corporate-action week calendar, Summary, CTA. Monday send (Hard rule 11) |
| Market Performance | **Monthly market pulse** (`monthly-market-pulse`) | the trailing 30 days' movers, most-traded and broker flow, each aggregated across the whole window, not a single day's snapshot. Tight, table-first |
| Market Insights | **Macro-reaction** (`macro-reaction`) | tie the last ~2 days of macro news to affected sectors/tickers, then report each name's fundamentals and valuation context |
| Company Insights | **Three-stock storytelling** (`three-stock-story`) | three companies' history, people, fun facts, attributed forward outlook |
| Company Insights | **Single company deep dive** (`single-company-deep-dive`) | one name read in depth off a real earnings / corporate-action / ownership trigger |
| Company Insights | **Sector spotlight** (`sector-spotlight`) | one sub-sector read as a whole: its five-year valuation series, the median-vs-weighted dispersion, which industries sit at the cheap end, whether the week's move was broad, then the one name that breaks the pattern peer-compared on EV/EBITDA and leverage as well as P/E. Table-heavy, subsector-led headline, valuation context, never a call |
| Sectors-org | **New release feature** (`new-release-feature`) | a brief summary of the latest release off a user-supplied release note (`sectors.app/release` is not live-fetchable), plus a secondary section spotlighting one feature the user picks, with a "Try the feature now" CTA. Subject/preview/headline name only the release, never the feature |
| Sectors-org | **Upcoming event** (`upcoming-event`) | promo for a Sectors in-house workshop. Content is **user-supplied**: ask for date/time/venue, agenda/speaker/target audience, registration link, and marketing banner before drafting. Not market-data driven |
| FOMO | **Did you catch it** (`did-you-catch-it`) | a single ticker that hit a real dated low (`overview.all_time_price`), already cleared a fundamentals guard on that date (P/E and ROE vs sector median, leverage trend), then rallied >=10% off it. Told signal-first, to prove a workflow alert would have caught the moment. One broadcast piece, no per-recipient framing |
| Personalized | **Watchlist/sector performance digest** (`watchlist-performance-digest`) | a fixed template, same structure for every recipient, ranked performance + peer comparison table for up to 5 of that user's own tracked tickers/sectors (from the sibling dbquery skill's `watchlist-tracked-interest` query), only the values differ per recipient. The one type that isn't a single broadcast piece, see **Personalization check** above |

**Skip the menu when the ask already resolves it**: if the user names the type and/or
subject ("do the Saturday wrap," "deep dive on BBRI earnings," "spotlight the banks"), go
straight into that pipeline. If they delegate the choice ("you pick this week's issue"),
choose and state a one-line "why this, why now" as you proceed. Only a bare "write the
newsletter" with no type named gets the menu, offer the ten above grouped by family.

**Under `NEWSLETTER_UNATTENDED=1` there is no menu.** A bare "write the newsletter" with
no type named runs `weekly-insights-v2`, the default weekly send; say so in the appendix
and carry on. See **Running unattended** above.

A one-paragraph brief per type (useful when weighing two candidates) lives in
`references/type-briefs.md`; the workflow doc itself is the source of truth, so once the
type is settled, open the doc and skip the brief. Types that are **not built yet** and
lifecycle/CRM email that is **out of scope here entirely** are both listed in
`references/scope.md`; read it when the ask names something outside the ten above.

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
| **Monthly market pulse** | Click into the tickers/tables to check the month's movers live |
| **Macro-reaction** | Explore the affected sectors/tickers on Sectors to size up the move |
| **Three-stock story** | Click through to each company's page on Sectors |
| **Single company deep dive** | Open that company's report on Sectors and dig into the data |
| **Sector spotlight** | Screen the sub-sector on Sectors and compare the peers themselves |
| **Did you catch it** | Add the ticker to a watchlist, or set up a workflow alert, so the next move doesn't get missed |
| **Watchlist/sector performance digest** | Open Sectors to check their own tracked tickers/sectors in full, now that the digest showed a real move on one |

If an issue type isn't listed (a not-yet-built type), state its conversion goal in one
line — "the one action a reader should take" — before drafting, and optimize for it the
same way. For any Sectors-org announcement the goal is product engagement; for market
content the goal is a return visit to `sectors.app` to explore the names cited.

## Shared pipeline shape

The broadcast issue types run the same five stages, then branch into the
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
   type's resolved endpoint list, param shape, and date/window rule (e.g. weekly-insights-v2's
   Mon-Fri anchor, macro-reaction's last-2-days news window) — reuse the same criteria
   this run, only the dates/tickers change. If no sample exists yet for a type, the file
   still holds the documented recipe pattern; populate the sample after this run.
   **If the folder itself is absent** (a fresh clone, a CI runner), fall back to the
   recipe in this type's own workflow doc, note the absence in `run-notes.md`
   (never inside the sent HTML), and carry on — a missing sample is never a
   reason to stall or to fail the run. This
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
   **The one-chart rule does not apply to `weekly-insights-v2` at all**: that type
   generates no chart, so there is no count to cap. Its findings block takes social cards
   from the bucket and the URLs come from the user, so pause here and ask for them before
   drafting block 4. Generating a graph there is a defect with no fallback, see Delivery.
   That type also uses the ticker alone with no company name (hard rule 15).
4. **Self-review** — the checklist at the end of the chosen workflow doc, plus
   `references/compliance.md`'s one-line test, plus a UTM check of every link against
   `~/.claude/skills/UTM_CONVENTION.md`, the organization-wide standard that every issue must
   follow strictly. Also diff the draft's section order and
   heading logic against `$NEWSLETTER_HOME/samples/<type-slug>/newsletter.md`
   (when one exists) so flow and section-title logic stay consistent issue to issue for
   the same type, not just compliant with the prose skeleton in isolation. When no
   sample exists, review against the type's own skeleton in
   `references/newsletter-format.md` instead and say so in the appendix.
5. **Deliver** — see Delivery below.

### Route by type

Open the two files for the settled type, and nothing else: the workflow doc for the API
recipe and self-review checklist, the skeleton for the section order.

| slug | workflow doc | section skeleton |
|---|---|---|
| `weekly-insights-v2` | `references/workflows/weekly-insights-v2.md` | `references/newsletter-format/skeletons/weekly-insights-v2.md` |
| `monthly-market-pulse` | `references/workflows/monthly-market-pulse.md` | `references/newsletter-format/skeletons/monthly-market-pulse.md` |
| `macro-reaction` | `references/workflows/macro-reaction.md` | `references/newsletter-format/skeletons/macro-reaction.md` |
| `three-stock-story` | `references/workflows/three-stock-story.md` | `references/newsletter-format/skeletons/three-stock-story.md` |
| `single-company-deep-dive` | `references/workflows/single-company-deep-dive.md` | `references/newsletter-format/skeletons/single-company-deep-dive.md` |
| `sector-spotlight` | `references/workflows/sector-spotlight.md` | `references/newsletter-format/skeletons/sector-spotlight.md` |
| `new-release-feature` | `references/workflows/new-release-feature.md` | `references/newsletter-format/skeletons/new-release-feature.md` |
| `upcoming-event` | `references/workflows/upcoming-event.md` | `references/newsletter-format/skeletons/upcoming-event.md` |
| `did-you-catch-it` | `references/workflows/did-you-catch-it.md` | `references/newsletter-format/skeletons/did-you-catch-it.md` |
| `watchlist-performance-digest` | `references/workflows/watchlist-performance-digest.md` | `references/newsletter-format/skeletons/watchlist-performance-digest.md` |

Also open `references/compliance.md` before drafting the valuation or forward-looking
section of `macro-reaction`, `three-stock-story`, `single-company-deep-dive`,
`sector-spotlight`, or `did-you-catch-it`, those are where the no-advice line is
easiest to cross.

**`weekly-insights-v2`'s foreign-flow figure is settled, not an open decision: always use
the exchange definition** (`idx_daily_data`), never `foreign-flow/{symbol}`'s
broker-domicile figure — the two disagree on direction, not just magnitude (resolved
2026-07-27, see that workflow doc §3).

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
4. **English, brand voice, no hype.** `references/writing/core.md` and
   `references/writing/brand-voice.md` bind in full, read through the surface file
   `references/writing.md`. This skill does not re-author voice; only the output format
   differs, prose rather than slides. One exception: `newsletter-format.md`'s **Prose
   style** section overrides the short-declarative instinct for this skill's long-form
   copy. It does not override the blocklists, the rhythm ban or the directness rules.
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
   disclaimer, sized to how much was actually fetched. **It ends at its last endpoint
   bullet plus the Instagram credit**, with no method, window or section notes after it
   (2026-08-31). See `newsletter-format.md`'s **Appendix** section.
8b. **No em dash or en dash anywhere in a delivered issue**, Sources, Appendix, tables,
   captions and alt text included. A colon separates a source from its label. No
   `&mdash;`/`&ndash;` entities in the HTML (2026-08-31).
8c. **No section descriptions.** Nothing between a heading and that section's first table,
   chart or bullet, italic or plain, except a bare date-scope line. Observations go after
   the data, one plain line (2026-08-31).
8d. **No inverted-pair sentences**: "not X, but Y", "isn't A, it's B", "A rather than B",
   "not proof of". Positive claim, then stop (2026-08-31).
8e. **Sources list only pieces that carried a fact.** Public-holiday calendars, published
   meeting schedules and other date-confirmation pages are dropped (2026-08-31, see
   `sourcing.md`).
9. **Every broker code links** to `sectors.app/idx/broker/<lower>`, same accent `#9E0142`
   ticker styling, on any type that has a broker/flow table (confirmed 2026-07-16).
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
    block and note the omission in `run-notes.md` (never inside the sent HTML)
    rather than failing the issue or inventing an event; the sheet is a public `curl`,
    so a failure here is transport, not content. Every row still upcoming is required
    whenever the fetch *does* succeed.
11. **Weekly Insights v2's issue date is today's actual date, not a computed Monday**
    (revised 2026-07-27, superseding the 2026-07-20 "Monday immediately after the
    Friday close" rule). Use the real date the draft is generated on, whatever day
    that is, never a theoretical Monday derived from the reporting window. `date:` in
    the frontmatter, the delivery folder's `<YYYY-MM-DD>`, the HTML `<!-- -->` header
    comment, and every `utm_campaign` suffix all use this same actual date, not the
    Friday `data_as_of` date and not a window-derived Monday. See
    `workflows/weekly-insights-v2.md` and the **Header block** section of
    `newsletter-format.md`.
    **"Today" means today in Asia/Jakarta (WIB), not the runner's system clock**
    (added 2026-08-13, after an automated Wednesday run stamped 12 Aug instead of
    the real WIB date, 13 Aug — a GitHub Actions runner's ambient clock is UTC,
    and WIB is UTC+7, so for several hours after WIB midnight the runner's own
    date is still the previous day). This applies to every type, not just
    weekly-insights-v2 — the send calendar and its cron schedules are WIB-anchored
    throughout, so WIB is the one timezone "today" can unambiguously mean here. An
    unattended CI run receives the correct WIB date explicitly in its drafting
    instructions; never infer "today" from the environment.
12. **HTML disclaimer footer uses fixed markup, verbatim, every issue** (confirmed
    2026-07-24): the bordered `<tr>` block with the non-advice line, the `sectors.app`
    citation link, and the `Sectors | sectors.app | @sectorsapp` line. Fill only the
    UTM campaign slug/date, the `data_as_of` date, both `sectors.app` links carrying
    the same footer UTM string, Instagram left untagged. Exact HTML in
    `newsletter-format.md`'s **Standard disclaimer footer** section, don't hand-write
    a variant per issue.

13. **Every ticker mention is linked, every occurrence, every type** (confirmed
    2026-08-31): not first-mention-per-section, not tables only. The same ticker appearing
    nine times carries nine links to `sectors.app/idx/<lower>` (SGX: `/sgx/<code>`), each
    with that block's `utm_content` and `utm_term=<ticker>`. Grep the finished HTML for the
    ticker string and confirm every hit sits inside an `<a>`. See `newsletter-format.md`'s
    **Ticker-mention convention**.
14. **No clickable citation in body copy, any type** (confirmed 2026-08-31): a news source
    is attributed as plain `(Source Name, DD Mon YYYY)` text, and its URL appears only in
    the Sources list. The only body links are `sectors.app` links and our own Instagram and
    Threads follow lines. An outbound link mid-issue hands the reader an exit before the
    CTA. See `newsletter-format.md`'s **UTM convention** and `sourcing.md`'s **Inline
    citation format**.
15. **Two rules are `weekly-insights-v2` only, and stay that way** (confirmed 2026-08-31):
    (a) **ticker alone, no company name** in any block, where every other type still pairs
    the ticker with the company's full name once per section; (b) **bucket social cards
    only, no generated graph anywhere in the issue**, where every other type ships a
    generated `chart-<slug>.svg`. Do not port either to another type, and do not apply
    another type's opposite habit to v2.

16. **No `$` before a ticker, anywhere, ever, in any issue type** (confirmed 2026-08-31,
    and this rule is not overridable). Write `BBCA`, `**BBCA**`, or
    `[**BBCA**](https://sectors.app/idx/bbca)`, never `$BBCA`. This holds in every block of
    every one of the ten types, in tables, prose, headings, subject lines, preview text,
    chart labels, alt text, image captions, Sources, the Appendix and the footer, on IDX
    and SGX names alike. The cashtag is a social-media convention that reads as retail
    trading-floor shorthand, and it is not the register this newsletter writes in.

    **Precedence:** this rule outranks every skeleton, workflow doc, sample and worked
    example in the skill. If any file, including a type's own skeleton or a sample in
    `newsletter/samples/`, shows a `$`-prefixed ticker, that file is stale, the `$` is a
    defect, and this rule wins with no judgment call to make. Never reintroduce the `$`
    to match a sample. Before shipping any issue, grep both `newsletter.md` and
    `newsletter.html` for a literal `$`; a single hit is a defect. Note this is the one
    ticker rule with no per-type variation at all: hard rule 15's v2-only carve-outs
    cover the company-name pairing and the chart, and neither touches this.

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
    run-notes.md               unattended runs only: which documented defaults this run
                                took, for the PR reviewer. NEVER read by the send path,
                                so it can't reach a subscriber. See **Running
                                unattended** above
    chart-<slug>.svg           every type except weekly-insights-v2 in an interactive run
                                (that type's unattended runs are the one exception, see
                                its own workflow doc); the source of truth
    chart-<slug>.png           the same chart rasterized for email; what the HTML
                                actually references, since Gmail and Outlook strip SVG
                                (generated by scripts/rasterize.mjs, needs `npm install`)
    banner-<slug>.<ext>        upcoming-event only: the user-supplied banner, copied in
    sample-rows.csv            watchlist-performance-digest only: the real audience rows
                                the dbquery skill's query returned this run (local only,
                                contains PII, never copy elsewhere or commit)
```

- `<type-slug>` is one of the ten built slugs: `weekly-insights-v2`, `monthly-market-pulse`,
  `macro-reaction`, `three-stock-story`, `single-company-deep-dive`, `sector-spotlight`,
  `new-release-feature`, `upcoming-event`, `did-you-catch-it`,
  `watchlist-performance-digest`.
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
- **Every issue type ships as HTML, and every issue except `weekly-insights-v2` gets a hero
  chart.** All ten
  types are delivered as a send-ready `newsletter.html` (email-safe inline styles, table
  layout, tickers linked to `sectors.app/idx/<lower>`); the nine other than
  `weekly-insights-v2` also carry at least one generated `chart-<slug>.svg`. Keep `newsletter.md` as the review draft and ship the `.html`
  alongside it. The worked HTML reference for a type is
  `newsletter/samples/<type-slug>/newsletter.html`; `newsletter-format.md`'s **Color
  convention** owns the shared HTML chrome and `workflows/upcoming-event.md` §4 carries the
  promo type's own delivery note.
  **`weekly-insights-v2` satisfies the visual requirement with the social cards from the
  carousel pipeline's Google Cloud Storage bucket, not with a generated `chart-<slug>.svg`.** The
  skill cannot list that bucket without a credential, so the URLs are **supplied by the
  user**: once the week's findings are derived from the API, **stop and ask the user for
  the eligible card URLs**. This ask is mandatory and blocking for this type; do not skip
  it, do not guess filenames, and do not quietly render a chart in place of asking. **There
  is no chart fallback for this type** (confirmed 2026-08-31): if the user has no eligible
  card for a finding, cut the finding and build the block from the cards that exist. A
  generated graph anywhere in a `weekly-insights-v2` issue is a defect, and this type ships
  no `chart-<slug>.svg`. It is also
  the one exception to stage 3's "at most one generated chart per issue": its findings
  block runs one visual per finding, so two or three visuals is correct there.
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

## Setup and file map

No install needed for a Markdown-only draft: `node` built-ins only, no npm packages,
and the API key is `export SECTORS_API_KEY=<key>` (no key ships in the repo; a local
`config.json`, copied from `config.example.json`, is an optional gitignored fallback if
you prefer a file over the env var). **`scripts/rasterize.mjs` is the one exception** —
it needs Puppeteer (`npm install` in this folder, once per machine) to turn a generated
chart's SVG into the PNG email clients can actually display; skip it if you only want the
`.md`, you need it for any issue you intend to send. Charts come from this skill's own
`scripts/charts.mjs` (consult the `dataviz` skill for *which* chart fits, and the carousel
skill's `references/charts/INDEX.md` for the "which Sectors field maps to which chart"
table). Full setup notes, the file map, and the sibling-skill relationships live in
`references/setup.md`. Sanity check:

```bash
node scripts/sectors.mjs "idx-total/?start=2026-07-01&end=2026-07-08"
```

