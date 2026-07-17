# Monthly market pulse, workflow

The trailing-30-day read: the month's top movers, volume leaders, and the brokers
behind the tape. Every section is an aggregate across the whole window, never a single
day's snapshot, that's the whole point of this type versus a daily one. Read
`../newsletter-format.md`'s monthly-pulse skeleton before drafting.

## 1. Settle the window

The API's "today" lags ~1 day (UTC). Anchor `data_as_of` to the latest date you actually
get back. The window is the **trailing 30 calendar days ending at `data_as_of`**
(e.g. `data_as_of` 2026-07-15 → window start 2026-06-15), not a calendar month. Echo
both the start and end date in the issue so a reader can see exactly what "the month"
covers this run.

## 2. Fetch

Three of the four metrics below have no native range/aggregate parameter, so the
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
  in step 5. Not every window will have a clean answer, if nothing real turns up, say
  so rather than manufacturing a reason.

## 3. Broker flow (separate loop, no range param exists)

`brokers/top` **only accepts a single `date`, confirmed live** (`start`/`end` 400s:
`"Invalid query parameters: start, end."`). There is no market-wide "top brokers over a
range" endpoint. The only correct way to get a genuine 30-day broker read is:

```bash
for d in <every trading date from the most-traded response's own date keys>; do
  node ../../scripts/sectors.mjs "brokers/top/?date=$d&metric=net&origin=all&n_brokers=10" \
    --save-dir <scratch-dir>/brokers
done
node ../../scripts/sectors.mjs "brokers/?" --save-dir <scratch-dir>
```

- Reuse the exact trading-date list `most-traded` already echoed back (its response
  keys), don't re-derive a separate date range, the two should agree on which days were
  actually trading days.
- Sum `net` (and `gross`) per `broker_code` across every daily file, and count how many
  days each broker placed in that day's top 10 (a broker with a huge one-day print but
  low `daysTop10` reads differently than one that's consistently there).
- Resolve `broker_code` → full name via the one `brokers/` registry call (cacheable,
  0 credits, call once per run not once per day).
- This is ~22 calls for a full trading month. That's the accepted cost for a type that
  runs once a month, not something to shortcut by sampling a handful of dates, a
  partial-month sample silently understates brokers who were active on days outside the
  sample.
- Once the top buyers/sellers are ranked, web-search or `news/` for anything real that
  plausibly explains the pattern (a regulatory story, a macro flow narrative), for the
  required observation paragraph in step 5. State a concurrent story as concurrent, not
  as proven cause, if two things happened the same month, say they happened the same
  month.

## 4. Validate

- Band-check movers against `../sectors-api/data-quality.md` before they go in a table.
  A 30-day mover list still isn't pre-validated; a microcap with an implausible ratio is
  noise, not a standout, even at 30d.
- Confirm the echoed window (both `most-traded`'s date keys and `idx-total`'s own
  first/last row) actually spans the 30 days you asked for; the API's own trading
  calendar (weekends, holidays) means the exact day count varies run to run, that's
  expected, don't force it to a fixed number.

## 5. Write the pulse

Follow `../newsletter-format.md`'s skeleton exactly:
1. Headline + trend paragraph (no separate "index in one line" heading), drafted fresh
   from this run's own `idx-total` trend, never a templated line reused from a prior
   issue.
2. **Top Movers** — two small tables (gainers, losers) plus the hero `moversChart`
   (logos + full labels + green/red diverging bars, see `scripts/charts.mjs`). Caption
   states only what the chart shows, no interpretive commentary, that belongs in the
   surrounding prose instead.
3. **Most traded** — the aggregated ranking from step 2's `most-traded` work, a short
   table, **followed by a short paragraph** naming one ticker from the list (usually
   the top one) and its real, dated, cited reason for running hot all month (from the
   step-2 news pull), never a guess dressed as a reason.
4. **Broker Flow** — top-net-buyers and top-net-sellers tables from step 3's work,
   columns broker code, broker name, 30d net, **followed by a short paragraph**
   observing the actual shape of the flow (foreign vs domestic-leaning houses, how
   concentrated it was) and any real, dated news that plausibly relates, cited, stated
   as concurrent rather than as proven cause. **Link every broker code**
   (confirmed 2026-07-16): `https://sectors.app/idx/broker/<lowercase code>`, bold
   ticker-blue like a ticker link, both tables, every row.
5. **Appendix: Sectors API endpoints (fields used)**, always included for this type
   (not the skill-wide "optional" default, `../newsletter-format.md`'s Appendix
   section), after Sources and before the disclaimer. This type touches five distinct
   endpoints with real client-side aggregation behind it (whole-window `most-traded`
   summing, the 22-call `brokers/top` loop), exactly the case that section's own
   "add it when a reader might plausibly want to trace the pull" guidance calls for.
   One bullet per endpoint actually called this run, the resolved params, and which
   section it backed, see `queries.md` in `newsletter/samples/monthly-market-pulse/`
   for the worked pattern to follow.
6. Disclaimer footer.

## 6. Self-review before delivery

- Is the headline this run's own finding, not a copy of a prior issue's line?
- Did any microcap with a failed plausibility band slip into a movers table?
- Does "Most traded" actually reflect the whole-window sum, not just the latest day's
  top-N (the easy mistake: pulling `most-traded` for one day and mislabeling it monthly)?
- Is Broker Flow really the 30-day aggregate (every trading day looped and summed), not
  a single day's `brokers/top` mislabeled as the month?
- Do both the Most Traded and Broker Flow paragraphs cite something real, or did one
  turn into a manufactured "probably because" line with nothing behind it?
- Is `data_as_of` stamped and does the stated window (start date, end date) match what
  the calls actually echoed back?
- Does every `$TICKER` mention read bold, `$`-prefixed, and linked, including inline
  prose mentions outside a table (a bare `$TICKER` in a paragraph is the easy miss,
  it still needs the same styling as every table/chart ticker)?
- Is every broker code in both Broker Flow tables linked to
  `sectors.app/idx/broker/<lower>`, same bold ticker-blue styling as a ticker link?
- Is the Appendix present, after Sources and before the disclaimer, with one bullet
  per endpoint actually called this run?
