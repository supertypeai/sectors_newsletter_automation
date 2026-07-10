# Sectors API v2 — Live-Verified IDX Endpoint Reference

Scope: **IDX (Indonesia Stock Exchange) only.** Every endpoint below was called
live on **2026-06-12** with a real key and the raw responses saved to
`../responses/<name>.json` (shapes in `../responses/_shapes.txt`). This doc
records the **exact params each endpoint accepts** (learned from the API's own
400 error bodies and the live OpenAPI schema) and the **real response shape** —
including several fields the upstream `sectors-endpoints` skill doc omits.

> **Schema freshness:** the upstream `sectors-endpoints/references/schema.json`
> is a May-2026 snapshot (51 paths) and is now **stale** — the live schema
> (`docs.sectors.app/schema.json`) has **67 paths**. The 10 IDX endpoints it adds
> are documented in **§2b** (broker flow, foreign flow, corporate actions,
> shareholder composition, suspensions). A fresh copy is saved at
> `../responses/_openapi_live.json`.

```
Base URL : https://api.sectors.app/v2
Header   : Authorization: <raw-key>      ← NO "Bearer" prefix
Header   : User-Agent: <anything real>   ← default urllib/library UA → 403 "error code: 1010"
```

Test symbols: **BBCA** (big-cap bank, rich), **TLKM** (telco, segments), **JSPT**
(small-cap hotel, sparse), **BREN** (recent IPO).

Run the probe yourself: `SECTORS_API_KEY=... python3 scripts/probe.py run`.

---

## Result: all IDX paths return 200 with correct params

The probe exercises every IDX path. First-pass 400s were **param mistakes, not
dead endpoints** — the API returns a helpful 400 listing what it actually wants.
The corrections are folded into this doc and into `scripts/probe.py`.

| Endpoint | First error | Fix |
|---|---|---|
| `news` | `Unsupported query parameter(s): n_news` | use `limit`, not `n_news` |
| `companies/top-changes` | `Invalid classifications` | only `top_gainers`,`top_losers` are valid |
| `most-traded` | `Invalid query parameters: limit` | drop `limit`; use `n_stock` to adjust the per-day count (default 5) |
| `companies` (index filter) | `tags in ['lq45']` → empty | index membership is the `indices` array, not `tags` |
| `listing-performance/JSPT` | `symbol does not exist` | recent IPOs only (BREN works) |

The single remaining non-200 in `../responses/` is **intentional**:
`listing_perf_small.json` (JSPT, 1998 listing) → `400`, kept as evidence that
*listing-performance is recent-IPOs-only*. Working version: `listing_perf_recent.json`.

---

## 1. Company report — the workhorse

### `GET /company/report/{symbol}/`
Slice with `?sections=` (comma list). Omitting `sections` returns everything
(~99 KB for BBCA). Sections: `overview, valuation, future, financials, dividend,
management, ownership, peers`.

| Section | Key fields (verified) |
|---|---|
| **overview** (22) | `listing_board, industry, sub_industry, sector, sub_sector, market_cap, market_cap_rank, address, employee_num, employee_num_rank, listing_date, website, phone, email, last_close_price, latest_close_date, daily_close_change, all_time_price{ytd/52_w/90_d low+high, all_time_low/high → {date:price}}, esg_score, tags[], indices[], affiliates[]` |
| **valuation** (6) | `last_close_price, daily_close_change, forward_pe, intrinsic_value, historical_valuation[]{pb,pe,ps,pcf,peg,year,*_peer_avg,enterprise_to_ebitda,enterprise_to_revenue}` |
| **future** (4) | `company_value_forecasts[]{eps_estimate,revenue_estimate,estimate_year}, company_growth_forecasts[]{eps_growth,revenue_growth,base_year,estimate_year}, technical_rating_breakdown{summary/oscillator/moving_average → buy/sell/neutral + data[]}, analyst_rating_breakdown{strong_buy,buy,hold,sell,strong_sell,n_analyst,updated_on}` |
| **financials** (6) | `eps, historical_eps{year:{eps,eps_growth}}, historical_financials[]{~60 fields/yr}, historical_financial_ratio[]{capital,leverage,liquidity,efficiency,profitability}, yoy_quarter_earnings_growth, yoy_quarter_revenue_growth`. (`historical_financials_quarterly` was in the June-2026 snapshot but is **gone from the live response** as of 2026-07-02; for quarterly data use `financials/quarterly/{symbol}/`.) |
| **dividend** (8) | `historical_dividends{year:{breakdown[]{date,total,yield},total_dividend,total_yield}}, upcoming_dividends[]{ex_date,payment_date,dividend_amount}, yield_ttm, dividend_ttm, dividend_yield_avg{period,avg_yield}, payout_ratio, cash_payout_ratio, last_ex_dividend_date` |
| **management** (2) | `key_executives[]{name,position}, executives_shareholdings[]{name,position,share_amount,share_percentage}` |
| **ownership** (5) | `major_shareholders[]{name,share_value,share_amount,share_percentage}, top_transactions{date,top_buyers[],top_sellers[] → {name,changeAmount}}, institutional_transaction_flow[]{date,net_transaction}, whale_investors[], conglomerates_group[]` |
| **peers** | `peers[0].peers_data.companies[]{20 fields, see below}, group_name{sector,industry,sub_sector,sub_industry}` |

**Peer company object (20 fields):** `symbol, company_name, year, market_cap,
net_income, pretax_income, total_revenue, total_assets, total_equity,
total_liabilities, operating_expense, employee_num, pe_ttm, pb_mrq,
yearly_mcap_chg, group[], revenue_breakdown, int_income_breakdown[],
operating_expense_breakdown[], point_summaries[]{name,point,maxpoint}` where
`name ∈ {value, competitive, future, financials, dividend}` + an `updatedAt`
element. **point_summaries is a ready-made radar/scorecard.**

> ⚠️ **`intrinsic_value` is a DCF that runs systematically high.** BBCA = 13,694
> vs last close 5,650 (**+142%**). Cross-checked across 5 blue chips it implies
> +124–264% upside (at/above the most bullish analyst target). Treat it as
> unreliable; suppress or caveat it — never present as "fair value."

**Sparse-data behaviour (JSPT):** `esg_score`, `indices`, `affiliates`,
`forward_pe`, `company_value_forecasts`, `analyst_rating_breakdown` are all
`null`. Always null-guard — small caps drop these.

### `GET /financials/quarterly/{symbol}/`
Optional `report_date` (from quarterly-dates). Returns `[{symbol,
financials_sector_metrics, date, ...~50 P&L/BS/CF fields}]`. **Banks** populate
`financials_sector_metrics{interest_income, net_interest_income, gross_loan,
net_loan, total_deposit, casa breakdown...}`; non-banks have it `null` but fill
`gross_profit, cost_of_revenue, capital_expenditure, current_liabilities, ...`.

### `GET /company/get_quarterly_financial_dates/{symbol}/`
No params. `{ "2020":[[date,date]...], ... "2026":[[...]] }` — paired
period-start/end dates per quarter. Feed into `quarterly`.

### `GET /company/get-segments/{symbol}/`
Optional `financial_year`. `{symbol, financial_year, revenue_breakdown[]{value,
source, target}}` — **Sankey-ready** (source = segment, target = "Total Revenue").
TLKM: 17 segments, JSPT: 15. Check coverage via `companies/list_companies_with_segments/`.

### `GET /daily/{symbol}/`
`start`,`end` (`YYYY-MM-DD`, **≤90 days**). `[{symbol, date, close, volume,
market_cap}]` — one row per trading day (~52 rows / 90 cal days).

### `GET /listing-performance/{symbol}/`
**Recent IPOs only.** Richer than upstream doc: `{symbol, company_name,
chg_7d/30d/90d/365d, shares_offered, percent_total_shares, book_building_start/end_date,
book_building_lower/upper_bound, offering_start/end_date, offering_price,
distribution_date, prospectus_url, additional_info_url}`.

---

## 2. Market-wide / cross-company

### `GET /companies/` — screener
Params: `where` (SQL-like), `order_by` (`-market_cap`), `q` (natural language,
overrides where/order_by), `desc`, `limit` (max 200), `offset`,
`include_query_values`. Returns `{results[]{symbol, company_name, query_values?},
pagination{total_count,showing,limit,offset,has_next,...}}`. With `q`, also
returns **`llm_translation{natural_query, translated_params{where,order_by,limit}}`**
— shows exactly how your NL was parsed.

This endpoint is deep enough to warrant its own reference — full field catalog
(direct / array / JSON-object / yearly / forecast / quarterly-bracket / JSON-list),
a 28-case live capability matrix, smart-FY behaviour, and credit costs (structured
= 1, NL `q` = 3) live in **`SCREENER.md`**.

> ⚠️ Index membership is the **`indices`** array, not `tags`. `where=tags in ['lq45']`
> returns **empty**; use `where=indices in ['LQ45']` (verified). `tags` = company
> event tags (`52-w-low`, etc.).

### `GET /companies/top-changes/`
`classifications` = **only `top_gainers`,`top_losers`** (live-confirmed; other
classes are rejected here). `periods` ∈ `1d,7d,14d,30d,365d`. Optional narrowing:
`sub_sector` + `n_stock` (live-verified 2026-07-02, 3 bank gainers for 1 credit)
and `min_mcap_billion` (in the live schema, untested). Returns
`{top_gainers:{<period>:[{name,symbol,price_change,last_close_price,
latest_close_date}]}}`. **Each class×period = 1 credit.**

### `GET /free-float/`
Optional one of `sector/sub_sector/industry/sub_industry` (kebab slug). Omit →
all 956 companies. `[{symbol, company_name, free_float}]` (0–1).

### `GET /most-traded/`
`start`,`end` (**≤90 days**). **No `limit`**; default top-5 by volume **per
date**, `n_stock` adjusts the count (live-verified 2026-07-02), `sub_sector` and
`adjusted` are in the live schema (untested). Observed cost `limit-consumption: 2`.
`{ "<date>": [{symbol, company_name, volume, price}] }`.

### `GET /idx-total/`
`start`,`end` (**≤90 days**). `[{date, idx_total_market_cap}]`.

### `GET /index-daily/{index_code}/`
Path = index code (`lq45, idx30, kompas100, jii70, srikehati, idxesgl, …`),
**not a symbol**. `start`,`end` (**≤90 days**). `[{index_code, date, price}]`.

### `GET /subsector/report/{sub_sector}/`
Path = kebab slug. No useful `sections`. Returns `{sector, sub_sector,
statistics{total_companies, filtered_median_pe, filtered_weighted_avg_pe, min/max_company_pe},
market_cap{total, avg, quarterly_market_cap, mcap_summary{mcap_change{1w,1y,ytd},
monthly_performance, performance_quantile}}, stability{weighted_max_drawdown,
weighted_rsd_close}, valuation{historical_valuation{year:{pb,pe,ps,pcf,*_rank}}},
growth{weighted_avg_growth_data, growth_forecasts}, companies{top_companies{top_mcap,
top_growth, top_profit, top_revenue}, top_change_companies}}`. **A whole
sector-leaderboard in one call.**

### `GET /news/`
Params: `symbols` (plural, OR-logic), `sector`, `sub_sector`, `tags`,
`commodity_type`, `keyword`, `extension`, `start`, `end`, `limit`, `offset`.
**Not `n_news`.** Returns `{results[]{title, body, source, thumbnail, timestamp,
sector, sub_sector[], tags[], symbols[], dimension{future,dividend,ownership,
technical,valuation,financials,management,sustainability}}, pagination}`. The
`dimension` map scores which analytical angle each article touches.
**Coverage is big-cap-skewed** (BBCA: 443 articles on 2026-07-02, up from 337 in
June; JSPT: 0). Fall back to `sub_sector` news for uncovered symbols. `end` can't
be in the future (API "today" lags ~1 day, UTC).

### `GET /filings/`
Params: `symbol` (singular), plus sector/sub_sector filters, `limit`, `offset`;
the live schema also lists `start`, `end`, `transaction_type`, `holder_type`,
`tags` (untested). **This is insider / major-holder transaction disclosure, not news:**
`{results[]{title, body, source, timestamp, sector, sub_sector, tags[], symbol,
transaction_type(buy/sell), holder_type(insider/...), holder_name,
holding_before, holding_after, amount_transaction, price, transaction_value,
price_transaction[]{date,type,price,amount_transacted}, share_percentage_before/after/transaction,
idx_conglomerates_group_slug, idx_investor_slug}}`.
Coverage skews big-cap but is **not exclusive**: a ~IDR 296B small cap topped the
live stream on 2026-07-02, while JSPT had zero filings on the last check.

---

## 2b. Trading flow, brokers & corporate actions
> ⚠️ These 10 endpoints are **live but were absent from the May-2026 OpenAPI
> snapshot** this skill originally documented from. Refreshed against the current
> live schema (`docs.sectors.app/schema.json`, 67 paths) and tested 2026-06-12;
> raw responses in `../responses/new/`. They cover IDX "smart-money" / market-
> microstructure data the rest of the API doesn't.

### `GET /company/corporate-actions/{symbol}/`
No query params. Returns `{symbol, corporate_actions{dividend[]{ex_date,
payment_date, dividend_yield, dividend_amount}, upcoming_dividend[]{ex_date,
payment_date, dividend_amount}, stock_split[]{date, split_ratio},
right_issue[], warrant[], bonus[], agm[]{agm_date, agm_time, agm_place,
agm_result}}}`. **Empty action types come back as `null`, not `[]`** — guard
before iterating. (BBCA: 13 dividends, 1 split (2021, ratio 5), 9 AGMs.)

### `GET /company/shareholders-composition/{symbol}/`
Optional `year` (default current). Monthly snapshots: `{symbol, year,
data[]{date, shares_number, numbers_of_shareholders, change_in_shareholders,
<category>_l, <category>_f, total_l, total_f}}` where `_l`=local, `_f`=foreign,
and `<category> ∈ {insurance, corporate, pension_fund, financial_institutions,
individual, mutual_fund, securities_companies, foundation, other}` (share counts).
**Local-vs-foreign ownership split by holder type, month over month.**

### `GET /foreign-flow/{symbol}/`
`start`,`end` (**≤90 days**, default last 30). `{symbol, start, end,
data[]{date, net_foreign_inflow}}` — net foreign-broker inflow in IDR per day
(positive = foreign net buying).

### `GET /brokers/`
Optional `cohort` (`institutional|mixed|retail|unknown`), `origin`
(`domestic|foreign`). Registry: `[{code, name, is_foreign(bool), cohort,
license_type}]` (~88 brokers). Resolve `broker_code` here first.

### `GET /brokers/top/`
Brokers ranked for a single date. Params: `date` (default latest), `metric`
(`gross|net`), `origin` (`all|domestic|foreign`), `cohort`
(`all|institutional|mixed|retail|unknown`), `n_brokers`. Returns `{date, metric,
origin, cohort, results[]{rank, broker_code, gross, net}}`.

> ⚠️ **Broker data window + history (live-verified BBCA 2026-06-12, supersedes
> the "≤30 days" previously stated here):**
> - Window per request is clamped server-side to **≤90 days** — a longer range
>   does NOT error, the API silently moves `start` up to `end − 90d` (the echoed
>   `start` in the response is the truth). No-param default = **last 90 days**.
> - **History begins 2025-01-02.** Earlier windows (probed Dec 2024 and Jun of
>   2024/2023/2022/2021/2020) return **HTTP 200 with empty data** — silently, not
>   an error. A window straddling the boundary returns partial data with no
>   warning, so always compare the earliest returned date to what you asked for.
> - Full history = walk consecutive ≤90-day windows back to Jan 2025 (~6
>   requests/ticker). Multi-year broker claims are NOT supportable.
> - Verified on `/broker-summary/{symbol}/` and `/top/`; the `/broker-activity/*`
>   pair shares the same store but was not re-probed — assume the same limits.

### `GET /broker-summary/{symbol}/`
Per-broker daily trading rows for one ticker. Params: `broker_code` (filter),
`start`,`end` (≤90 days, see box above). `{symbol, start, end,
data[]{date, summary[]{broker_code, bfreq, blot, bval, bavg_per_share, sfreq,
slot, sval, savg_per_share, nlot, nval, navg_per_share}}}` — `b`=buy, `s`=sell,
`n`=net; `freq`/`lot`/`val`(IDR)/`avg_per_share`. ~66 brokers/day on BBCA.

### `GET /broker-summary/{symbol}/top/`
Brokers most accumulating/distributing one ticker over a range. Params:
`start`,`end` (≤90 days, see box above), `cohort`, `origin`, `n_brokers` (default 10, max 100).
`{symbol, start, end, origin, cohort, top_buyers[]{rank, broker_code, net_idr,
buy_idr, sell_idr}, top_sellers[]{...}}`. **"Which brokers are loading up on X."**

### `GET /broker-activity/{broker_code}/`
All (stock, day) activity for one broker. Params: `symbol` (filter),
`start`,`end` (limits per box above, not re-probed). `{broker_code, start, end, data[]{date,
summary[]{symbol, bfreq, blot, bval, bavg_per_share, sfreq, slot, sval,
savg_per_share, nlot, nval, navg_per_share}}}`. **Large** (every stock the broker
touched each day — ~440 stocks/day; ~1.7 MB for 16 days).

### `GET /broker-activity/{broker_code}/top/`
Stocks a broker is most accumulating/distributing. Params: `start`,`end`
(limits per box above, not re-probed), `n_brokers` (default 10). `{broker_code, start, end,
top_accumulations[]{rank, symbol, net_idr, buy_idr, sell_idr},
top_distributions[]{...}}`. **"What is broker MG buying."**

### `GET /suspensions/`
Optional `symbol`, `start`, `end`, `limit` (default 20, **max 30**), `offset`.
`{results[]{symbol, suspension_date, reason, pdf_url}, pagination}` — IDX trading
suspensions with the official reason + IDX PDF link.

---

## 3. Discovery / slug helpers (call first; cheap)
| Path | Returns |
|---|---|
| `GET /subsectors/` | `[{sector, subsector}]` — 33 pairs |
| `GET /industries/` | `[{subsector, industry}]` — 58 |
| `GET /subindustries/` | `[{industry, sub_industry}]` — 101 |
| `GET /tags/` | `[str]` — 98 news/event tags |
| `GET /companies/list_companies_with_segments/` | `{ "SYM.JK": {financial_year:[yrs]} }` — who has segment data |

---

## Credit notes
- The API reports each request's real cost in a **`limit-consumption` response
  header** (observed on `report`, `top-changes`, `most-traded`; absent on
  screener/news/filings/daily). Check it when unsure.
- `top-changes` bills **1 credit per classification × period**.
- `company/report` billed 1/4/6 for 1/4/6 requested sections (observed
  2026-07-02), i.e. cost tracks the section count; by that pattern a
  no-`sections` call (all 8) would cost ~8. Slice `sections=` to what you need.
- `most-traded` billed `limit-consumption: 2` per call (2-day and 11-day windows both).
- Everything else observed is a normal single-credit GET.
- Discovery/slug endpoints are cheap — cache them; slugs change rarely.
