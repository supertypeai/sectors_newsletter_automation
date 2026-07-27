# Monthly market pulse — resolved query pattern (worked example: 2026-07-16 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/monthly-market-pulse.md`. Pinned against the real live-data
run that produced `newsletter.md` in this folder (30 days to 15 Jul 2026, IDX down
3.2%, real API pulls, not fabricated figures).

## 1. Window discipline

- `data_as_of` this run: **2026-07-15** (send date 2026-07-16, API lags ~1 day UTC).
- Window = **trailing 30 calendar days ending at `data_as_of`**: 2026-06-15 to
  2026-07-15, 22 actual trading days once weekends/holidays are excluded (confirmed
  from `most-traded`'s own returned date keys, never assume a fixed day count).
- Rule to reapply next run: resolve `data_as_of` from the live `idx-total` response's
  latest returned date, then compute window-start as `data_as_of - 30 calendar days`.

## 2. Section → endpoint → resolved params this run

| Section | Endpoint | Resolved params | Aggregation |
|---|---|---|---|
| Headline + trend | `idx-total/` | `?start=2026-06-15&end=2026-07-15` | Scan every point for min/max, not just start/end — this run's real story was a 2026-06-30 trough (IDR 9,894.03T) between the two endpoints |
| Top Movers | `companies/top-changes/` | `?classifications=top_gainers,top_losers&periods=30d` | None needed, endpoint aggregates over the period natively (1 call, 2 credits) |
| Most traded | `most-traded/` | `?start=2026-06-15&end=2026-07-15&n_stock=10` | **Required**: endpoint returns top-N per date (`{"<date>": [...]}`), summed `volume` per `symbol` across all 22 date keys client-side, ranked by that sum |
| Broker Flow | `brokers/top/` | `?date=<d>&metric=net&origin=all&n_brokers=10`, looped once per one of the 22 trading dates (confirmed live: `start`/`end` 400s on this endpoint, single-date only) | Summed `net`/`gross` per `broker_code` across all 22 daily files; resolved names via one `brokers/` registry call |
| Most-traded "why" paragraph | `news/?symbols=BUMI.JK&start=2026-06-15&end=2026-07-15&limit=10` | — | Read for a real, dated reason the top name traded heavily; this run found analyst/foreign-flow/policy stories, cited |
| Broker Flow observation paragraph | `news/?keyword=asing&start=2026-06-15&end=2026-07-15&limit=10` | — | Web/news scan for anything concurrent with the buy/sell pattern; this run found an IDX-demutualization sentiment story, stated as concurrent context, not cause |

## 3. What actually got used

- `most-traded` was called ONCE with the full 30-day range and `n_stock=10`, not looped
  per day, the endpoint itself supports a wide range in one call, only the ranking
  needs client-side summing afterward.
- `brokers/top` has no range param (confirmed live, 400 on `start`/`end`), so it was
  looped across all 22 trading dates (~22 calls), the accepted cost for a type that
  runs once a month.
- Two `news/` pulls backed the two required paragraphs (Most traded, Broker Flow); both
  turned up real, dated, citable stories this run, if a future run's news pull comes up
  empty, say so rather than manufacturing a reason.

## Reuse checklist for the next monthly-market-pulse run

1. Resolve `data_as_of` from the live `idx-total` response, then derive the 30-day
   window from that, not from the calendar send date.
2. `most-traded`: one call, full range, `n_stock=10`; aggregate client-side; don't
   mistake a single day's top-N for the monthly ranking.
3. `brokers/top`: loop every trading day in the window (reuse `most-traded`'s own date
   keys), aggregate client-side; there is no shortcut range param.
4. Pull `news/` for the top most-traded ticker AND for the broker-flow pattern; both
   paragraphs are required in the format doc, not optional flourishes.
5. Diff the finished draft's section order against `newsletter.md` in this folder:
   Headline + trend (no separate "index in one line" heading) → Top Movers (tables +
   chart) → Most traded (table + why-paragraph) → Broker Flow (tables + observation
   paragraph) → Sources → disclaimer.
