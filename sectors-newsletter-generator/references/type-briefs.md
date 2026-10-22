# Per-type briefs

Split out of `SKILL.md`. Each brief is a one-paragraph summary of a type's workflow doc,
useful when weighing which type to pick, or as a sanity check before opening the doc.
**The workflow doc in `references/workflows/<slug>.md` is the source of truth**; if you
have already settled the type, open that doc directly and skip this file.

### Weekly Insights v2
Open `references/workflows/weekly-insights-v2.md` for the exact API recipe and section
order, and `newsletter/samples/weekly-insights-v2/` for the worked reference. In brief:
settle the Mon-Fri window, then build nine blocks. Key Data Bites
carries every computed market-level fact; Other Major Headlines carries every news-sourced
one; the two must never repeat a fact. The single analysis block joins two sources to find
something the tables don't already say, illustrated with the carousel's social cards from the
Supabase bucket. Those cards are **never** charts this skill renders: the bucket can't be
listed without a credential, so pause and ask the user for the week's URLs before drafting
the findings block, and render a chart only if the user confirms nothing eligible exists.
Every bucket card is set at exactly 268px wide (see the workflow's Visuals section).
What's Ahead closes with two to four dated, cited, mapped macro rows alongside the corporate
actions, and **Summary** (bull read, bear read, what to watch next) sits between it and the
CTA. Four blocks, four strictly separate jobs, and this is the type's main failure mode:
Bites owns computed numbers, Headlines owns new factual events only, What's Ahead owns dated
future catalysts only, and Summary owns macro and structural analysis, where every bullet
closes on a claim the issue hasn't made yet and an earlier figure is repeated only when the
claim actually needs it. A fact appears in exactly one block;
run a duplication pass before delivery. **No claim subtitles anywhere in this type**
(removed 2026-08-17); a block's observation, if it has one, is one plain line after the data.
Findings run three bullets each, tickers are bare `TICKER` in every block, no `$`, no company name, and every
linking sentence follows the workflow doc's §5b causation policy: name the mechanism, label
its status, never predict a price on our own authority.
**Open decision: ask the user which foreign-flow definition the issue should use before
drafting any flow figure** (the cards and `foreign-flow/{symbol}` use different methods that
disagree on direction, see the workflow doc §3), then apply that one definition throughout.

### Macro-reaction piece
Open `references/workflows/macro-reaction.md`, and open `references/compliance.md`
before writing the per-ticker valuation section — this is the issue type where the
no-advice line matters most. In brief: web-source the last ~2 days of macro news
(`references/sourcing.md`), state which sectors/tickers it plausibly touches and the
mechanism, fetch those names' fundamentals and valuation context, and frame the "is this
a good time to buy" question as objective valuation-context reporting, never a buy/sell
directive.

### Three-stock storytelling piece
Open `references/workflows/three-stock-story.md`. In brief: pick three stocks that share
one pattern this week (same-direction insider filings, a control change, a group), web-source
the dated sequence behind each with citations, pull ownership/financials/filings from the
API, and write any forward statement as **attributed** ("management has guided," "consensus
estimates"), never as the newsletter's own prediction. Layout: a filing summary box, a
general "why this matters" block with a pull quote, then per stock a stat-tile card, a dated
timeline, a finances paragraph, a table and a key takeaway, closed by a rebased three-way
price chart and a watchlist CTA. Markup in `references/newsletter-format/company-issue-components.md`,
reference issue in `samples/three-stock-story/`. Cut hard, the research pass gathers far more
than the draft should carry.

### Single company deep dive
Two formats, ask which: full deep dive (below) or earnings review, one quarter's print
explained and delivered as PDF, workflow `references/workflows/single-company-earnings-review.md`.
Open `references/workflows/single-company-deep-dive.md`, and open `references/compliance.md`
before the valuation section (this is the type most likely to drift into "looks cheap,
buy it"). In brief: the whole company, not one week's news. A recent event (earnings,
corporate action, ownership filing, a multiple crossing its own band) supplies the reason
to publish and about a tenth of the length, then the issue runs business model and revenue
mix, the moat tested against named peers with a position figure, the unit-economics margin
ladder plus ROE/ROA and leverage trends, two or three dated macro forces each landing on a
named line item, and a long-term read carrying the valuation and a researched
counterargument, closing on the unresolved question; finish with three or four
forward-looking bullets, one structural. Five body sections in Title Case, 900-1,200
words, two or three charts, sparse inline citation, valuation as context, never a call.
Density rules decide whether it reads: at most three figures a paragraph, every section
opening on a claim with no figure in it, every year-by-year series in a table or chart
rather than in a sentence.
Apply the scope test first: delete the event, and if nothing is left, this is the wrong
type. Needs a coverable company, small caps with `null` peers and no segment data cannot
carry it.

### Sector spotlight
Open `references/workflows/sector-spotlight.md`. In brief: the subject is the sub-sector,
not a ticker, and the reader may be an investor or someone following the news. Open in plain
language, add a "How to read the numbers" box, then pull `subsector/report` for the five-year
median P/E, the median-vs-weighted dispersion, the cap move and the growth forecasts; screen
members above a stated market-cap floor, split them by the pattern the screen shows and
compare what the week did to each group; then feature the one name that breaks the pattern
with a one-angle, three-column peer table. HTML blocks in
`references/newsletter-format/sector-spotlight-components.md`. Say "lowest" and "highest
multiples", never "cheap" or "expensive". Valuation context only, never "the one to buy."

### Monthly market pulse
Open `references/workflows/monthly-market-pulse.md`. In brief: `top-changes`
(`periods=30d`) for the month's gainers/losers, `most-traded` over the 30-day window
aggregated client-side into one ranking (the endpoint itself only returns per-date
top-N), Broker Flow pulled via the dbquery skill's approved
`broker-summary-range` query over the 30-day window (no native `brokers/top` range param, so this
replaces looping the API day by day), and `idx-total` start/end for the month's index
read; write the headline off that month's own idx-total trend, a combined Top Movers
table+chart, Most traded, and Broker Flow, table-first throughout.

### Did you catch it
Open `references/workflows/did-you-catch-it.md`, and open `references/compliance.md`
before drafting, FOMO's loss/win tone directive sits right next to the imperative ban.
In brief: discover an already-rallied ticker (`top-changes` top gainers), source its
trigger date and price from `overview.all_time_price` (a real dated low field, not a
scanned daily-close guess), clear that trigger against a fundamentals guard (P/E and
ROE vs sector median, leverage trend, two of the content plan's screener legs adapted
to what the API actually exposes, see the workflow doc §1), then draft one broadcast
piece **signal first, payoff second**: the trigger and what was already true on it,
then the rally that followed, proving a workflow alert would have caught it. Same copy
for every reader, no per-recipient framing since this skill has no account data to tell
who already holds the ticker (workflow doc §3). CTA names the actual conditions proved
out as a settable alert, then the behavioral ask (watchlist/workflow alert), never "buy
now," no countdown or scarcity language.

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
`sectors-dbquery` skill to run its approved `watchlist-tracked-interest`
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
