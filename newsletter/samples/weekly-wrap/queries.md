# Weekly wrap — resolved query pattern (worked example: 2026-07-06 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/weekly-wrap.md` §1-2. This file pins the recipe against
one real resolved run so the date/window logic stays identical issue to issue, not
re-derived from prose each time.

## 1. Settle the window (do this first, every run)

- `data_as_of` this run: **2026-07-03** (a Friday). The API's "today" lags ~1 day UTC,
  so the window is anchored to the most recently completed Mon-Fri, never the calendar
  send date.
- Resolved window: **Mon 2026-06-29 → Fri 2026-07-03**.
- Prior week (for the WoW compare column): **Mon 2026-06-22 → Fri 2026-06-26**.
- Rule to reapply next run: take whatever `data_as_of` actually comes back, walk back to
  the most recent Friday ≤ that date, then back 4 more calendar days to the Monday. The
  "prior week" column is always that same Mon-Fri window shifted back exactly 7 days.

## 2. Section → endpoint → resolved params

| Section | Endpoint | Resolved params this run |
|---|---|---|
| IDX Total Market Cap (headline + 7d/30d/YTD) | `idx-total/` | `?start=2026-06-29&end=2026-07-03` |
| Index & market (this-week table) | `idx-total/`, `index-daily/lq45/`, `index-daily/idx30/` | `?start=2026-06-29&end=2026-07-03` each |
| Index & market (prior-week compare column) | same three endpoints | `?start=2026-06-22&end=2026-06-26` each |
| Weekly Top Movers | `companies/top-changes/` | `?classifications=top_gainers,top_losers&periods=7d` — **gotcha**: ignores `start`/`end`, returns a live rolling snapshot pinned to today. Label movers with the date actually returned, don't present as the Mon-Fri window's movers unless it happens to match. |
| What actually traded | `most-traded/` | `?start=2026-06-29&end=2026-07-03&n_stock=3` (honors the window, per-date rows) |
| Sector pulse | `subsector/report/<slug>/` | `subsector/report/banks/` (trailing slash load-bearing) — no date param, always current as-of the report's own date |
| Flows | `foreign-flow/<TICKER>/` | `foreign-flow/BBRI/?start=2026-06-29&end=2026-07-03` |
| New Filings | `filings/` | `?limit=8`, then keep the 5 most recent by `timestamp` |
| New IPOs | `company/report/<TICKER>/`, `daily/<TICKER>/` | `?sections=overview`; `?start=<listing-date>&end=<listing-date+3d>` |
| Headlines | `news/` | `?start=2026-06-29&end=2026-07-03&limit=12` |

## Reuse checklist for the next weekly-wrap run

1. Resolve `data_as_of` → Mon-Fri window → prior-week window using the rule above, don't
   eyeball a date.
2. Reuse the exact endpoint list and param shape in the table, only the dates/tickers
   change.
3. Confirm `companies/top-changes` behaves the same way (live snapshot, not window-bound)
   — if a future API version changes this, update this file and the workflow doc together.
4. Diff the finished draft's section order against `newsletter.md` in this folder before
   delivery — same 11 sections, same order, same job per heading (see
   `sectors-newsletter-generator/references/newsletter-format.md`'s **Section skeleton per issue type** → Weekly wrap).
