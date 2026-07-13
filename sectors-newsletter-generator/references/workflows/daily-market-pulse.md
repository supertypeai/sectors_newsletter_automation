# Daily market pulse, workflow

The short end-of-day read: today's top movers, volume leaders, and the brokers behind the
tape. Tighter and more scannable than the weekly wrap, one day's window, built to be read
in under a minute. Read `../newsletter-format.md`'s daily-pulse skeleton before drafting.
This type is social-first in the content plan; keep it brief and table-heavy.

## 1. Settle the day

The API's "today" lags ~1 day (UTC). Anchor to the latest `data_as_of` you actually get
back, a single completed trading day, not the calendar date.

## 2. Fetch (one batched call)

```bash
node ../../scripts/sectors.mjs \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=1d" \
  "most-traded/?start=<day>&end=<day>&n_stock=5" \
  "brokers/top/?metric=net&origin=all" \
  "idx-total/?start=<day-1>&end=<day>" \
  --save-dir <scratch-dir>
```

- `companies/top-changes` with `periods=1d` — the day's gainers and losers. 1 credit per
  classification (gainers + losers = 2).
- `most-traded` for a single day — the volume leaders. Returns rows keyed by date.
- `brokers/top` — the day's most active brokers by net value (`results[]{rank,
  broker_code, gross, net}`). Resolve `broker_code` to a name via `brokers/` (cacheable
  registry) if you want to name one.
- `idx-total` over the last two days — the whole-market cap move, for the one-line index
  read.

Optional, only if one name clearly dominates the day and is worth a line on *why*:
`news/?symbols=<TICKER>` or `broker-summary/<TICKER>/top` for who was accumulating it.

## 3. Validate

- Band-check movers against `../sectors-api/data-quality.md` before they go in a list.
  1-day mover output is not pre-validated, a limit-up microcap with a broken ratio is
  noise, not a standout.
- Confirm the single-day window echoed back is the day you meant, and that broker/flow
  data respects the 2025-01-02 floor (not a concern for a current-day pulse, but check the
  echoed dates anyway).

## 4. Write the pulse, tables first

This is the most table-driven type. Structure:
- One-line index read (up/down, and whether it was broad or led by a handful of names).
- **Top gainers** and **top losers** as two small Markdown tables (never a signed column,
  plain Markdown can't color cells).
- **Most traded** as a short table (ticker, volume, price).
- One line on brokers or flow only if there's a genuine signal (a broker loading one name,
  a lopsided net). Skip it rather than pad.

Keep it short. A daily pulse that runs long has failed its own brief. No hero chart needed
for a daily unless one name's intraday-to-close story genuinely warrants it.

## 5. Self-review before delivery

- Is the index line a read (broad vs narrow, who led), not just "the index rose"?
- Did any microcap with a failed plausibility band slip into a movers table?
- Is it actually short and scannable, or did it grow into a mini weekly-wrap?
- Is `data_as_of` stamped and does it match the single day returned?
