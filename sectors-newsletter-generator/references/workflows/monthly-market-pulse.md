# Monthly market pulse, workflow

The trailing-30-day read: the month's top movers, volume leaders, the brokers behind the
tape, and the macro backdrop those three sat inside. Every section is an aggregate
across the whole window, never a single day's snapshot, that's the whole point of this
type versus a daily one. Read `../newsletter-format.md`'s monthly-pulse skeleton before
drafting.

**This type is an argument evidenced by data, not a data dump with news garnish.** Every
run states one thesis up front, defends it section by section, gives the opposing read
its own space, and closes with dated events that would settle it. The tables are the
same tables they always were; what changed is that each one now sits under a claim.

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
  window and look for a real, dated reason its volume ran hot all month (an analyst
  call, a foreign-buying flag, a sector policy story), for the required "why" paragraph
  in step 6. Not every window will have a clean answer, if nothing real turns up, say
  so rather than manufacturing a reason.

## 3. Broker flow (fixed Supabase query, not an API loop)

`brokers/top` **only accepts a single `date`, confirmed live** (`start`/`end` 400s:
`"Invalid query parameters: start, end."`). There is no market-wide "top brokers over a
range" endpoint via the Sectors API. Don't loop it day by day. Instead run the pinned
query at `../../scripts/fixed-queries/broker-summary-range.sql` through the Supabase
MCP connector (read-only), substituting the window's `{{start}}`/`{{end}}`:

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
- This is public market data, not user-account data, so it does not go through
  `sectors-newsletter-dbquery`'s PII-only approved-queries gate (see that skill's
  `references/supabase-access.md`); it's still read-only, verified live 2026-07-27
  against 13-17 Jul 2026 (top buyer BB/Verdhana Sekuritas Indonesia +612.12B,
  `days_active`=5 on every row for that 5-day window).
- Once the top buyers/sellers are ranked, web-search or `news/` for anything real that
  plausibly explains the pattern (a regulatory story, a macro flow narrative), for the
  required observation paragraph in step 6, under the causation policy in step 5.

## 4. Macro overlay (new, required)

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

Then **map each macro item to the names already in this issue's own tables.** That
mapping is the point of the section, not the macro list itself. If coal prices ran and
two coal names sit in the most-traded table, say so and name them. If a macro item
touches nothing in this issue's tables, drop it, this is not a general macro digest.
Aim for three to five mapped items; a longer list reads as a wire feed.

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

Follow `../newsletter-format.md`'s skeleton exactly:

1. **Headline + trend paragraph**, drafted fresh from this run's own `idx-total` trend,
   never a templated line reused from a prior issue.
2. **The month in four numbers** — a four-tile stat row directly under the trend
   paragraph: index cap move, the window's single largest mover, the aggregate broker
   net of the top-3 sellers (or buyers, whichever side dominated), and one macro anchor
   from step 4 (rate level, rupiah move, or the commodity that mattered). Each tile is a
   number, a one-line label, nothing else. See `scripts/charts.mjs` for the tile row.
3. **The Read** — two to four sentences, the issue's single thesis, stated as a
   claim, before any table. It must be falsifiable by this issue's own data and it must
   be defended by the sections that follow. "IDX fell, but foreign sellers, not domestic
   ones, set the price, and the month's real return sat in small caps the index doesn't
   feel" is a thesis. "The market was mixed this month" is not.
4. **Section headings keep their existing names**, and each carries a **subtitle line
   directly under the heading** stating that section's claim. Format: `## Top Movers`
   then, on the next line, an italic single-sentence claim. Do not rename the headings
   themselves, the heading names the data, the subtitle names the argument.
5. **Top Movers** — two small tables (gainers, losers) plus the hero `moversChart`
   (logos + full labels + green/red diverging bars, see `scripts/charts.mjs`). Caption
   states only what the chart shows, no interpretive commentary. Subtitle carries the
   claim (e.g. breadth, where the month's real dispersion sat).
6. **Most traded** — the aggregated ranking from step 2, a short table, **followed by a
   short paragraph** naming one ticker from the list and its real, dated, cited reason
   for running hot all month, under step 5's causation policy.
7. **Broker Flow** — top-net-buyers and top-net-sellers tables from step 3, columns
   broker code, broker name, 30d net, **followed by a short paragraph** on the shape of
   the flow (foreign vs domestic-leaning houses, how concentrated) with the mechanism
   named per step 5. **Link every broker code** (confirmed 2026-07-16):
   `https://sectors.app/idx/broker/<lowercase code>`, bold ticker-blue like a ticker
   link, both tables, every row.
8. **Macro Backdrop** — new section, placed after Broker Flow and before the two-sided
   read. Three to five mapped items from step 4, each one short paragraph or one row of
   a compact table: the macro fact with its date and source, then the IDX names or
   sectors in this issue's own tables it touches. No unmapped macro items.
9. **The Other Side** — the two-sided read. Two short stacked blocks, **The bull read**
   and **The bear read**, three to four bullets each, every bullet grounded in a number
   or citation already in this issue. Then one closing line, **What would settle it**,
   naming the specific dated print or event that distinguishes the two. Attribution
   rules from step 5 apply to every forward-looking bullet: if it predicts, it is
   quoted and attributed, or it is reframed as a condition ("if X prints above Y").
10. **What to Watch, next 30 days** — a compact table, columns Window, Event, Why it
    matters. Three to five rows, each a real scheduled event: BI RDG date, BPS release
    date, earnings-season window, index rebalance effective date, dividend cum-date, a
    named company's scheduled result. Every row's "why" ties back to a name or sector in
    this issue.
11. **Upcoming Events** (the Sectors in-house events block, unchanged, distinct from
    §10's market calendar, see `../upcoming-events-source.md`).
12. **Sources** list.
13. **Appendix: Sectors API endpoints (fields used)**, always included for this type,
    after Sources and before the disclaimer. One bullet per endpoint/query actually used
    this run, the resolved params or window, and which section it backed. Macro items
    from step 4 are not API pulls; they belong in Sources, not the Appendix.
14. Disclaimer footer.

## 9. Self-review before delivery

- Is there one stated thesis in **The Read**, and does every section below actually
  defend or qualify it, rather than sitting next to it?
- Does every section heading carry its claim subtitle, with the heading name itself
  unchanged?
- Is the headline this run's own finding, not a copy of a prior issue's line?
- Do the four stat tiles trace to numbers that appear elsewhere in the issue?
- Did any microcap with a failed plausibility band slip into a movers table?
- Does "Most traded" reflect the whole-window sum, not just the latest day's top-N?
- Is Broker Flow really the 30-day aggregate, not a single day's `brokers/top`?
- Is every Macro Backdrop item dated, sourced, **and** mapped to a name or sector that
  appears in this issue's own tables? An unmapped macro item is a wire feed line, cut it.
- Does at least one citation clear the step-6 sourcing bar (research note, central-bank
  or regulator release, exchange statistic), or is the shortfall stated plainly?
- Does every linking sentence pass step 5's test: the reader can see who asserts what
  and how confident they are, and the newsletter itself never predicts a price?
- Does **The Other Side** give the bear read genuine weight, or is it a token block? Is
  **What would settle it** a specific dated event, not a vague "time will tell"?
- Is every What-to-Watch row a real scheduled event with a verifiable date?
- Is `data_as_of` stamped and does the stated window match what the calls echoed back?
- Does every `$TICKER` mention read bold, `$`-prefixed, and linked, including inline
  prose mentions outside a table?
- Is every broker code in both Broker Flow tables linked to
  `sectors.app/idx/broker/<lower>`, same bold ticker-blue styling as a ticker link?
- Is the Appendix present, after Sources and before the disclaimer, with one bullet
  per endpoint actually called this run, and no macro items smuggled into it?
