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
Google Cloud Storage bucket. Those cards are **never** charts this skill renders: the bucket
can't be listed without a credential, so pause and ask the user for the week's URLs before
drafting the findings block. There is no chart fallback in an interactive run — a finding
with no eligible card is dropped, or the block ships with fewer findings; a generated chart
is never substituted (unattended runs are the one exception, see the workflow doc).
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
Open `references/workflows/three-stock-story.md`. In brief: pick three stocks (ideally
with a connective thread), web-source history/founders/fun-facts with citations, pull
management/ownership/financials from the API, and write any forward statement as
**attributed** ("management has guided…," "consensus estimates…"), never as the
newsletter's own prediction. Two sub-parts per stock, *The Story & People* and *The
Finances* with the outlook folded in; thematic title, narrative per-stock headings, and
a titled closing synthesis. Cut hard — the research pass gathers far more than the draft
should carry.

### Single company deep dive
Open `references/workflows/single-company-deep-dive.md`, and open `references/compliance.md`
before the valuation section (this is the type most likely to drift into "looks cheap,
buy it"). In brief: anchor a real recent trigger (earnings, corporate action, ownership
change), pull one sliced `company/report` plus the price series and, for earnings, the
quarterly call; open on the mechanism behind the trigger and the market print it left
(block size, discount to close, foreign flow), then one merged read block carrying the
trend, the valuation, the period table and a researched counterargument, closing on the
unresolved question; finish with three or four forward-looking bullets. Three body sections
in Title Case, sparse inline citation, valuation as context, never a call.

### Sector spotlight
Open `references/workflows/sector-spotlight.md`. In brief: the subject is the sub-sector,
not a ticker. Pull `subsector/report` for the group's five-year median P/E-P/B-P/S series,
the median-vs-weighted dispersion, the cap move and the growth forecasts; screen members
above a stated market-cap floor to show which industries cluster at the cheap end; pull the
week's movers to say whether the move was broad or concentrated; then feature the one name
that breaks from the pattern with a peer table carrying EV/EBITDA and leverage, not P/E
alone. Table-heavy, every heading a claim, every table captioned. Valuation context only,
never "the one to buy."

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
