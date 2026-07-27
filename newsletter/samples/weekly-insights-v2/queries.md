# Weekly Insights v2 — resolved query pattern (worked example: 2026-07-18 issue)

Extends `samples/weekly-wrap/queries.md` with the blocks the revamp adds. Window logic is
unchanged; the new sections reuse endpoints already in the recipe rather than adding any.

> ## ⚠️ Do not copy this file's foreign-flow rows
>
> This sample is the **18 Jul 2026** issue, which predates the 2026-07-27 foreign-flow
> resolution and is the issue the workflow doc names as "left mixed and not a model to
> copy" on that point. The `foreign-flow/{symbol}` rows in §2 below use the
> **broker-domicile** definition, now forbidden for this figure. Use the **exchange**
> definition (`idx_daily_data`, volume-based) via the pinned
> `scripts/fixed-queries/foreign-flow-range.sql` instead: one market-wide query for the
> whole window, not a per-ticker API loop. The two disagree on *direction*, not just
> magnitude. See `workflows/weekly-insights-v2.md` §3.
>
> Everything else here (window logic, movers, filings, news, corporate-actions
> pagination and the endpoint gotchas) is current and correct, and is why this file is
> still the reference. Reuse all of it; substitute the flow source.

## 1. Settle the window

- `data_as_of` this run: **2026-07-17** (a Friday).
- Resolved window: **Mon 2026-07-13 → Fri 2026-07-17**.
- Prior week (WoW compare column): **Mon 2026-07-06 → Fri 2026-07-10**.
- Extra call this revamp needs: the **Friday before the prior week** (2026-07-03) for
  `index-daily`, because the prior-week WoW figure is a Friday-to-Friday change and the
  index endpoints do not carry a prior-close field. Fetched as
  `?start=2026-07-01&end=2026-07-03` and the last row used.

`idx-total` does not need that extra call if the previous issue's Friday figure is on hand
(IDR 10,283.56T at 3 Jul, from the 6 Jul issue).

## 2. Section → endpoint → resolved params

| Section | Endpoint | Resolved params this run |
|---|---|---|
| Key Data Bites | (aggregated from every call below) | no dedicated call |
| The Week in Numbers | `idx-total/` | `?start=2026-07-13&end=2026-07-17` |
| The Week in Numbers (compare) | `idx-total/` | `?start=2026-07-06&end=2026-07-10` |
| The Week in Numbers (indices) | `index-daily/lq45/`, `index-daily/idx30/` | both windows, plus `?start=2026-07-01&end=2026-07-03` |
| What's the Buzz | (aggregated) | no dedicated call |
| ~~Chart of the Week~~ | ~~`foreign-flow/BBRI/`~~ | **SUPERSEDED, see the banner above.** Broker-domicile definition; use `fixed-queries/foreign-flow-range.sql` |
| ~~Story block (Bank Jago)~~ | ~~`foreign-flow/ARTO/`~~ | **SUPERSEDED, see the banner above.** Same reason |
| Top Weekly Movers | `companies/top-changes/` | `?classifications=top_gainers,top_losers&periods=7d` |
| What Actually Traded | `most-traded/` | `?start=2026-07-13&end=2026-07-17&n_stock=3` |
| Sector Pulse | `subsector/report/banks/` | trailing slash load-bearing |
| Filings | `filings/` | `?limit=10`, filtered to `timestamp` ≤ 2026-07-17, split Buys / Sells |
| Other Major Headlines | `news/` | `?start=2026-07-13&end=2026-07-17&limit=12`, KSEI filing dupes dropped |
| From Our Feed | none | user-supplied or Instagram Graph API, see `PLAN.md` §3 |
| What's Ahead | none this run | `company/corporate-actions/{symbol}/`, `listing-performance/{symbol}/` when there is something to list |

Credit cost this run: **10** (`top-changes` 2, `most-traded` 2, `subsector/report` 6). The
`idx-total`, `index-daily`, `foreign-flow`, `filings` and `news` calls were free.

## 3. Gotchas confirmed live this run

- `companies/top-changes` returned `latest_close_date: 2026-07-17`, which **matches** the
  window's Friday, so the movers are window-accurate this issue and can be labelled as such.
  That is luck, not a guarantee. Check `latest_close_date` every run before presenting them
  as the wrapped week's movers.
- `filings/?limit=10` returned three rows dated 18-20 Jul, after the window closed. Filter
  by `timestamp` rather than trusting `limit` to land inside the week.
- `news/?limit=12` came back majority KSEI shareholding-disclosure PDFs, which duplicate the
  Filings section. Only five of twelve were usable market headlines. Pull `limit=20` if the
  Headlines block needs five clean items reliably.
- `subsector/report/banks/` carries valuation under `valuation.historical_valuation`, the
  median P/E under `statistics.filtered_median_pe`, and the YTD cap move under
  `market_cap.mcap_summary.mcap_change.ytd`. The `1w` figure there is live as-of the report's
  own date, not the Mon-Fri window, so it is not quoted as the week's move.

## 4. Charts generated

All three from `scripts/charts.mjs`, rendered at 936px and displayed at 536px in the email.

| File | Function | Input |
|---|---|---|
| `chart-idx-mcap-week.svg` | `sparkline(..., {area:true, startLabel:true, endpointLabel:true})` | five daily `idx_total_market_cap` values in IDR T |
| `chart-bbri-foreign-flow.svg` | `barChart(..., {financial:true})` | five daily `net_foreign_inflow` values in IDR B |
| `chart-movers.svg` | `moversChart(...)` | ten `price_change` values from `top-changes` |
