# Monthly market pulse, workflow

The trailing-30-day read: the month's top movers, volume leaders, the brokers behind the
tape, and the macro backdrop those three sat inside. Every section is an aggregate
across the whole window, never a single day's snapshot, that's the whole point of this
type versus a daily one. Read `../newsletter-format/skeletons/monthly-market-pulse.md` before
drafting.

**This type is an argument evidenced by data, not a data dump with news garnish.** Every
run states one thesis up front, defends it section by section, gives the opposing read
its own space, and closes with dated events to watch.

**The issue must explain the month, not narrate it (2026-11-01).** A reader who finishes it
can answer three questions: what were the month's big events, what did each one do to
which stocks, and which names deserve a second look and why. Facts stay sourced, but the
conclusion comes first and in plain language. Binding rules:

- **The "so what" test.** Every paragraph under a table must add something the table cannot
  show: a cause, a split, a contrast, an unusual fact. If it restates the table or describes
  its shape ("gainers all ended at least 35% higher"), cut it.
- **No mechanical or methodology notes in reader copy.** Why a name was excluded, how a tick
  size distorts a percentage, how a figure was aggregated: drop these silently. An excluded
  ticker is simply absent.
- **No description lines under headings (2026-11-01).** "Ranked by...", "Net value per
  broker summed across..." and date-scope lines are all out for this type. A table goes straight
  under its heading.
- **Test the thesis across phases, not only the 30-day total.** A month-end total hides
  whether a stock fell before, on, or after the event. Step 4b is mandatory.
- **Pin down who a sanction fell on.** Read the regulator's own release, and name the sanctioned
  party exactly. Press often writes "fined DSSA" when OJK fined unnamed related parties, and
  the chair said the issuers were not the ones who paid. Calling a stock "fined" there is wrong.
- **Every monthly table gets a cross-check against the news.** Ask why each top mover moved
  and search for it. The 1 Nov 2026 draft missed the OJK cases around DSSA, BREN and CUAN because
  it only looked up the most-traded leader.

## 1. Settle the window

The API's "today" lags ~1 day (UTC). Anchor `data_as_of` to the latest date you actually
get back. The window is the **trailing 30 calendar days ending at `data_as_of`**
(e.g. `data_as_of` 2026-07-15 → window start 2026-06-15), not a calendar month. Echo
both the start and end date in the issue so a reader can see exactly what "the month"
covers this run.

## 2. Fetch

Three of the four market metrics below have no native range/aggregate parameter, so the
recipe is different per endpoint. Run them in this order, same every time:

```bash
node ../../scripts/sectors.mjs \
  "idx-total/?start=<window-start>&end=<data_as_of>" \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=30d" \
  "most-traded/?start=<window-start>&end=<data_as_of>&n_stock=10" \
  --save-dir <scratch-dir>
```

- **`idx-total`** over the full window — one call, gives the index's own start/end
  values plus every day in between; scan for the window's own min/max, not just the
  two endpoints, a mid-window trough or peak is often the more interesting fact (verified
  live 2026-07-16: a 30d pull showed a trough 15 days in that neither endpoint alone
  would have surfaced).
- **`companies/top-changes`** with `periods=30d` — the month's gainers and losers in
  ONE call (2 credits total, gainers + losers), the endpoint already aggregates over
  the period natively, no client-side work needed here.
- **`most-traded`** does NOT aggregate over a range, it returns **top-N per date**
  within the window (`{"<date>": [...]}`), so a single wide-window call still needs
  client-side aggregation: sum `volume` per `symbol` across every date key in the
  response, then rank by that sum. Use a generous `n_stock` (10, not the default 5) so
  a name that's consistently mid-pack every day, and therefore highest by monthly sum,
  isn't cut from days where it wasn't in that day's own top-5. Also note which names
  had the highest `daysPresent` count (present in every trading day of the window is
  itself a fact worth stating, see the sample).
- **`news/?symbols=<top most-traded ticker>&start=<window-start>&end=<data_as_of>`** —
  once the most-traded ranking is settled, pull this one name's own news for the
  window, plus `daily/<ticker>/` around any volume spike so the dates in the copy match the
  tape, and look for a real, dated reason its volume ran hot all month (an analyst
  call, a foreign-buying flag, a sector policy story), for the required "why" paragraph
  in step 6. Not every window will have a clean answer, if nothing real turns up, say
  so rather than manufacturing a reason.

## 3. Broker flow (approved Supabase query via dbquery, not an API loop)

`brokers/top` **only accepts a single `date`, confirmed live** (`start`/`end` 400s:
`"Invalid query parameters: start, end."`). There is no market-wide "top brokers over a
range" endpoint via the Sectors API. Don't loop it day by day. Instead invoke the `sectors-dbquery`
skill for its approved `broker-summary-range` query, giving it the window's
`{{start}}`/`{{end}}`. Never run this SQL yourself; it is reproduced here only so you
can see what comes back:

```sql
with agg as (
  select broker_code, sum(bval) as buy_val, sum(sval) as sell_val,
         sum(nval) as net_val, count(distinct date) as days_active
  from idx_broker_summary_daily
  where date between '<window-start>' and '<data_as_of>'
  group by broker_code
)
select a.broker_code, r.broker_name, a.buy_val, a.sell_val, a.net_val, a.days_active
from agg a
left join idx_broker_registry r on r.broker_code = a.broker_code
order by a.net_val desc;
```

- One query gives the full ranking; take the top N rows for buyers, the bottom N
  (lowest `net_val`, i.e. most negative) for sellers. No second query needed.
- `days_active` is the sanity check: every broker row should show the same count as
  the number of actual trading days in the window (idx_broker_summary_daily only has
  trading-day rows, so this isn't a weekend/holiday artifact). A broker sitting below
  that count simply sat out some sessions, not a data gap, state it that way if it
  comes up in copy.
- `broker_name` comes free from the join, no separate registry call needed.
- This is public market data, not user-account data, so no PII rules apply to the rows,
  but it still runs through `sectors-dbquery` like every other Supabase read (see that
  skill's `references/supabase-access.md`); it's read-only, verified live 2026-07-27
  against 13-17 Jul 2026 (top buyer BB/Verdhana Sekuritas Indonesia +612.12B,
  `days_active`=5 on every row for that 5-day window).
- Once the top buyers/sellers are ranked, web-search or `news/` for anything real that
  plausibly explains the pattern (a regulatory story, a macro flow narrative), for the
  required observation paragraph in step 6, under the causation policy in step 5.

## 4. Macro overlay (required)

The three market pulls above say **what** moved. This step says **what the market was
sitting inside while it moved**, and it is the section that carries most of the issue's
explanatory weight. Nothing here comes from the Sectors market endpoints; it is sourced,
dated, and cited like any other claim.

Pull, for the same window, every item that has a real dated print or quote. Skip an item
outright if this window has no dated reading for it, never carry last month's number
forward as if it were current:

| Item | What to capture | Where |
|---|---|---|
| BI policy rate | Level, direction, RDG meeting date, the statement's own stated reason | Bank Indonesia release / Kontan / Bisnis |
| Rupiah vs USD | Window start, window end, % move, any intra-window extreme | BI JISDOR / market data |
| Foreign flow, equities | Net foreign buy/sell over the window if a dated figure is published | IDX statistics / CNBC Indonesia / Kontan |
| Domestic bond yields | 10y INDOGB level and window change, foreign holdings of SBN if reported | DJPPR / Kontan |
| US / global rates | Fed decision or dated FOMC guidance, US 10y direction, DXY direction | cited wire coverage |
| Commodities that IDX earns from | Coal (Newcastle/ICI), CPO (Bursa Malaysia), nickel (LME), gold; window-level move | cited commodity coverage |
| Domestic prints | CPI, trade balance, PMI, whatever printed inside the window | BPS release / cited coverage |
| Policy and market structure | Rules, tax changes, index rebalances, IDX/OJK announcements dated in-window | IDX / OJK / cited coverage |

Then **map each macro item to names whose move you measured in step 4b.** That mapping is
the point, not the macro list itself, and it feeds the What Moved the Market cards. If coal prices ran and
two coal names sit in the most-traded table, say so and name them. If a macro item
touches nothing in this issue's tables, drop it, this is not a general macro digest.
Aim for three to five mapped items; a longer list reads as a wire feed.

## 4b. Event impact (required, 2026-11-01)

This step produces **What Moved the Market**, the core of the issue.

1. **Name three to five events** from step 4, the top-mover list and a search for each top
   gainer and loser (`saham <TICKER> <bulan> <tahun> penyebab`, regulator actions, exchange
   rule changes, suspensions, acquisitions). Regulator and exchange actions outrank macro
   prints. Also look just before the window: a rule effective days earlier can drive the
   whole month (the IDR 1 price floor took effect 28 September 2026, before that window).
2. **Measure each event** through `sectors-dbquery`'s approved
   `idx-window-movers-with-foreign-flow`, once per phase: before the main event, the event
   day, after it, and the full window (`base_date` = last close before the phase, `n` 500,
   `min_turnover` 1, `min_mcap` 1000000000000, or 0 for the full window; the result is large,
   read it from the saved file). Add the approved `foreign-flow-range` for the full window
   and `idx-retail-vs-foreign-flow-summary` for retail against foreign.
3. **Ask these questions of the rows:** Which stocks took the foreign selling, and what share
   of the total sat in the top four? Which stocks fell with almost no foreign selling, so the
   seller was domestic? How much money traded in the top gainers against the top losers? Did a
   group behave differently (banks, coal, a conglomerate, a list named in a rule change)?
   Which big names bounced after the event and which did not?
4. **Build the event chart** (see Write the pulse) from daily closes.

**Foreign means the exchange definition, always.** Foreign totals come from `foreign-flow-range`
or the query above, never from summing brokers whose registry domicile is foreign. Domicile
gave -16.97T where the exchange definition gave -20.97T on the same 2026 window. Broker
tables may still rank houses, but never call a broker's net figure foreign money.

## 4c. Names worth a closer look (required, 2026-11-01)

Pick three or four names from this month's data, one of them a caution case, each for a
specific data reason: the largest foreign sale, a name that held up against the tape, one
whose index weight changes, one that fell yet still carries a stretched multiple. Fetch
`company/report/<symbol>/?sections=valuation` (add `dividend` where yield is part of the
reason). Compare P/E with the stock's own history and its peer average, and always state the
peer average even when it is unflattering.

This section reports and points the reader at the next step. It never concludes. No
"undervalued", "cheap", "attractive", "opportunity" or price target. **Each card ends on a
different, specific action with a real link, and no two cards end the same way** (2026-11-01).
A repeated label such as "The Question" on every card reads as machine-made, so use no shared
label and no box. Fit the action to why the name is here: compare metrics or peers on its page,
a dated test to watch, a workflow alert, or a broker read from
`broker-summary/<symbol>/top/` naming the houses behind the bid, with the link to Sectors news
for an update to follow. The action never tells the reader to trade. Link only to pages known to
exist: company page, `/idx/broker/<code>`, `/indonesia/news`, `/workflow`, `/watchlist`. It is the reconciliation in `../compliance.md` applied to the reader's real
question: which stocks should I look at, and why?

## 5. Causation policy (read before writing any linking sentence)

The old rule ("state a concurrent story as concurrent, never as cause") produced flat,
hedge-heavy prose. The rule now is **name the mechanism and label its status**, which is
both more useful and no less careful:

- **Allowed, preferred:** "the mechanism would be X: coal names earn in USD, so a
  weaker rupiah lifts translated revenue, consistent with what the tape did this month,
  though nothing in the disclosures confirms it drove the move."
- **Allowed:** "consistent with", "the timing lines up with", "the same week", "which
  would show up first in Y".
- **Allowed, when someone else said it:** any causal claim quoted and attributed to a
  named analyst, house, or official, with a date. Attribution carries the claim.
- **Still banned:** the newsletter's own unattributed prediction, any price target we
  invented, any "will" about future prices, any advice framing. See
  `../compliance.md`, especially the forward-looking-must-be-attributed rule, which
  this policy does not relax.

Practical test: a sentence is fine if a reader can see exactly who is asserting what and
how confident they are. It fails if the newsletter itself is quietly predicting a price.

## 6. Sourcing bar

At least **one** of this run's citations must be a research note, a central-bank or
regulator release, or an exchange statistic, quoted with its date, not only news-portal
headlines. A portal headline is fine as corroboration; it is thin as the sole evidence
behind a thesis. If a window genuinely yields nothing above portal level, say so in the
Sources note rather than dressing a headline up as research.

## 7. Validate

- Band-check movers against `../sectors-api/data-quality.md` before they go in a table.
  A 30-day mover list still isn't pre-validated; a microcap with an implausible ratio is
  noise, not a standout, even at 30d.
- Confirm the echoed window (both `most-traded`'s date keys and `idx-total`'s own
  first/last row) actually spans the 30 days you asked for; the API's own trading
  calendar (weekends, holidays) means the exact day count varies run to run, that's
  expected, don't force it to a fixed number.
- Every macro figure in step 4 has a date and a source. An undated macro number does not
  ship.
- Every "What to Watch" row (step 8) names a real, scheduled, verifiable event. A
  plausible-sounding but unscheduled item does not ship.

## 8. Write the pulse

**Strictly match the sample.** `newsletter/samples/monthly-market-pulse/` is the
binding format reference, not just a worked example. Match section presence, order,
and what sits under each block exactly.

Follow `../newsletter-format/skeletons/monthly-market-pulse.md` exactly:

HTML markup for every block below: `../newsletter-format/monthly-pulse-components.md`.

1. **Headline, then straight into At a Glance** (2026-11-01). No standfirst paragraph. The
   headline states this run's finding in plain words, drafted fresh.
2. **At a Glance** (replaces The Read). The deep dive's `#fbe9d8` box: four to five bullets with
   bold lead-ins, ending on **Open Question**. Gains and losses take the colour highlight. Be
   direct: name who did what to whom, and when the thesis has parts, give each its own bullet
   (First Sell-off, Second Sell-off). Never tease a finding and explain it later. The first
   bullet carries the index move and closing market cap.
3. **Stat tiles.** Four tiles on the shaded card, under At a Glance. Each has a label, a number
   and a one-line context line: index cap move with closing market cap, net foreign flow
   (exchange definition) with its day count, the month's main event in one number, and one macro
   anchor. A tile must be readable alone: no ratio that needs a sentence to explain it ("70.6%
   of it in four stocks" failed this). The largest mover is not a tile.
4. **What Moved the Market**, after the first divider. One card per event from step 4b: date
   label, plain title, a short "what happened" paragraph, then an unlabelled callout whose bold
   first sentence is the conclusion and whose remainder names the stocks and numbers.
   This replaces Macro Backdrop; macro items only appear as events with a measured impact.
   Close with the **Before, during and after** chart, one line on the difference beneath it.
   The chart is `scripts/charts.mjs`'s `eventLines`: six stocks rebased to the first close on
   one axis, two groups (colour plus solid or dashed), direct end labels, and a shaded box per
   key trading day, the main event in red. Closes come from the approved
   `idx-recent-closes-for-symbol`, no API credits. Save SVG and PNG with `scripts/svg2png.mjs`.
5. **Top Movers.** Gainers left, losers right, in the two-column block, ticker with company
   name beneath, close, 30d. Then the hero `moversChart` with a caption stating only what it
   shows. Then up to two short paragraphs explaining why these names moved, under the "so what"
   test. Excluded names are omitted without comment.
6. **Most traded.** Table with Ticker, Company, 30d volume, Close, 30d. Then one line on what
   the group has in common and a paragraph on the leader's real, dated cause, under step 5's
   causation policy. Check that dated causes really fall where the copy says.
7. **Broker Flow.** Net buyers left, net sellers right, in the two-column block, broker code
   with name beneath, 30d net. **Link every broker code** to
   `https://sectors.app/idx/broker/<lowercase code>`. Then one paragraph answering who took the
   other side of the flow, using retail net against exchange-defined foreign net.
8. **Names Worth a Closer Look.** Step 4c. One card per name: three tiles (30d price, net
   foreign, P/E), a short reason, then a closing line below a thin rule, each one a different
   action. One italic line after the cards says the names come from the data and none is a
   recommendation.
9. **The Other Side.** Bull and bear in two tinted side-by-side panels, two to three bullets
   each, grounded in the issue but referring to it **conceptually**, never reprinting a figure.
   Each bullet joins two reported things or frames one structurally. No "What would settle it"
   block (removed 2026-11-01); dated events belong in What to Watch. Forward-looking bullets are
   attributed or framed as conditions (step 5).
10. **What to Watch Next.** Compact table: Window, Event, Why it matters. Three to five
    real scheduled events tied to this issue. **Strictly forward-looking**, no recap.
10b. **CTA**, fixed copy, verbatim every issue: "Keep the signals coming" watchlist and
    workflow block from `../newsletter-format/skeletons/monthly-market-pulse.md` §4e.
    Never draft a bespoke CTA (e.g. "Check the month's movers yourself").
11. **Upcoming Events** (the Sectors in-house events block, unchanged, distinct from
    §10's market calendar, see `../upcoming-events-source.md`).
12. **Sources** list.
13. **Appendix: Sectors API endpoints (fields used)**, always included for this type,
    after Sources and before the disclaimer. One bullet per endpoint/query actually used
    this run, with the fields taken from it. Endpoints and field names only: no section
    the data fed, no explanation of how it was used or aggregated. Macro items
    from step 4 are not API pulls; they belong in Sources, not the Appendix.
14. Disclaimer footer.

## 9. Self-review before delivery

- Do the At a Glance bullets state one thesis outright, with no standfirst above them, and does every section below defend or
  qualify it, rather than sitting next to it?
- **"So what" pass:** does any paragraph under a table only restate that table, or carry a
  mechanical or methodology note? Cut it.
- Does What Moved the Market give every event a measured impact on named stocks, with the
  conclusion as the unlabelled callout's bold first sentence?
- Did you search for why each top gainer and loser moved? Is any regulator or exchange action
  from the window missing?
- Is every foreign total on the exchange definition, with no broker's net labelled foreign?
- Does every Closer Look card state the peer average, avoid verdict words, include one caution
  case and end on an action different from every other card, with a working link?
- Are movers and brokers in the two-column layout, and are section titles unchanged from the
  skeleton?
- Is the headline this run's own finding, not a copy of a prior issue's line?
- Do the four stat tiles trace to numbers that appear elsewhere in the issue?
- Did any microcap with a failed plausibility band slip into a movers table?
- Does "Most traded" reflect the whole-window sum, not just the latest day's top-N?
- Is Broker Flow really the 30-day aggregate, not a single day's `brokers/top`?
- Is every event dated, sourced, **and** mapped to named stocks with a measured move? A macro
  item with no measured impact is a wire feed line, cut it.
- Does at least one citation clear the step-6 sourcing bar (research note, central-bank
  or regulator release, exchange statistic), or is the shortfall stated plainly?
- Does every linking sentence pass step 5's test: the reader can see who asserts what
  and how confident they are, and the newsletter itself never predicts a price?
- Does **The Other Side** give the bear read genuine weight, or is it a token block? Is
  each side concrete? Does it
  stay conceptual, reprinting **no** figure already published earlier in the issue?
- Is every What-to-Watch row a real scheduled event with a verifiable date, and
  forward-looking only with no recap of past events in the "why"?
- **Duplication pass:** does every distinct fact live in exactly one section? Anything
  appearing in two is a defect: keep it in the earliest section that owns it, and rewrite
  the later mention conceptually or cut it.
- Is `data_as_of` stamped and does the stated window match what the calls echoed back?
- Does every `TICKER` mention read bold, linked, and **without a `$` prefix**, including inline
  prose mentions outside a table?
- Is every broker code in both Broker Flow tables linked to
  `sectors.app/idx/broker/<lower>`, same bold ticker-blue styling as a ticker link?
- Is the Appendix present, after Sources and before the disclaimer, with one bullet
  per endpoint actually called this run, and no macro items smuggled into it? Endpoints and
  fields only, with no section labels or usage notes attached to any bullet?

## Social post images (width rule)

Monthly pulse renders its own charts by default. If a block uses an image from a published
Instagram post (an `image_urls` entry from `scripts/social-posts.mjs`), each one is set at exactly 268px wide, the same as
weekly insights v2: `<img src="<url>" width="268" alt="..." style="display:block;width:268px;max-width:100%;height:auto;border-radius:8px;">`.
Never full width, never `width:100%`, never another pixel value. Two cards under one heading
sit side by side, each 268px.

## Citations and section titles

No inline citation anywhere in the body (2026-10-19): no `(Source Name, DD Mon YYYY)`, no outlet
name in a bracket. Sources appear only in the Sources list at the foot of the issue. Section
titles are fixed from issue to issue; copy them from the skeleton and the last shipped issue,
never rename a section per run. Headings that state a performance figure carry the monthly
figure, with sub-window detail kept in the bullets.
