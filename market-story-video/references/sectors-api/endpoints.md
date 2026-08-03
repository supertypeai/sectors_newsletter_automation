# Sectors API v2, Endpoint Reference

**Synced copy.** The source of truth is `sectors-carousel/references/sectors-api/endpoints.md`; re-sync from there rather than editing this file in place, except for the SGX-logo addendum at the end of section 4, which is this skill's own and does not exist upstream. Paths it names in passing (`references/charts.md`, `visual-language.md`, `scripts/blocks.mjs`, `assets/logos.json`) are carousel paths and may not exist here.

Scope: **IDX (Indonesia Stock Exchange) primarily**, plus the SGX (Singapore) endpoints in section 4. Live-verified 2026-06-12, re-verified 2026-07-02 (20-call audit; every "verified live" note below with a July date comes from that run). This is
the trimmed working reference for an IG-carousel generator. For the full response
shape of any endpoint, open the named cached example file (`examples/<file>.json`,
trimmed to 3-item arrays; full copies live in `responses/`).

Read `data-quality.md` before putting any number on a slide.

---

## Connection basics (get these right or every call fails)

```
Base URL : https://api.sectors.app/v2
Header   : Authorization: <raw-key>      ← raw key, NO "Bearer" prefix
Header   : User-Agent: <anything real>   ← a default library UA (urllib/python) → 403 "error code: 1010" (Cloudflare)
```

| Rule | Detail |
|---|---|
| **Date cap on ranged endpoints** | `start`/`end` (`YYYY-MM-DD`) span must be **≤90 days**. Over-long ranges do NOT error; the API silently clamps `start` to `end − 90d`. Trust the `start`/`end` echoed in the response, not what you asked for. |
| **Broker history floor** | Broker and flow data **begin 2025-01-02**. Earlier windows return HTTP 200 with empty data (silent). A window straddling that date returns partial data with no warning, so compare the earliest returned date to what you requested. Multi-year broker claims are NOT supportable. |
| **Empty corporate-action types** | come back as `null`, not `[]`. Null-guard before iterating (see `corporate-actions`). |
| **Date can't be in the future** | API "today" lags ~1 day (UTC). |

Fetch any path below with `node scripts/sectors.mjs "<path>"` (see SKILL.md); needing several in one
beat, e.g. `company/report/BBCA/?sections=overview` plus `daily/BBCA`, pass them all in one call
with `--save-dir <dir>` instead of one `sectors.mjs` invocation per path.

### Credit costs
The API reports each request's real cost in a **`limit-consumption` response header**
(observed on `report`, `top-changes`, `most-traded`; absent on screener/news/filings/daily,
which appear to be flat single-credit). When unsure what a call costs, check that header.

| Call | Cost |
|---|---|
| `companies/top-changes` | **1 credit per classification × period** (e.g. gainers+losers × 4 periods = 8) |
| `company/report/{symbol}` | `limit-consumption` read 1/4/6 for 1/4/6 requested sections (2026-07-02), i.e. cost tracks the section count; by that pattern a no-`sections` call (all 8) would cost ~8. Always slice `sections=` to what your beats need |
| `most-traded` | observed `limit-consumption: 2` per call (a 2-day and an 11-day window both) |
| `companies` screener, structured (`where`/`order_by`) | **1** |
| `companies` screener, natural language (`q`) | **3** (run once, copy `llm_translation`, then reuse the structured form) |
| Everything else observed | normal single-credit GET |
| Discovery/slug endpoints | cheap; cache them, slugs change rarely |

---

## 1. Company report, the workhorse

### `GET /company/report/{symbol}/`
Slice with `?sections=` (comma list). Omitting `sections` returns all 8 sections
(~99 KB for BBCA). Sections: `overview, valuation, future, financials, dividend,
management, ownership, peers`. One call feeds an entire single-stock carousel.

Example files: `report_full.json` (BBCA), `report_telco_full.json` (TLKM, segments),
`report_small_full.json` (JSPT, sparse), plus one per section
(`report_overview.json`, `report_valuation.json`, `report_future.json`,
`report_financials.json`, `report_dividend.json`, `report_management.json`,
`report_ownership.json`, `report_peers.json`).

| Section | Fields that matter for slides |
|---|---|
| **overview** | `last_close_price, daily_close_change, latest_close_date` (price hook); `market_cap, market_cap_rank, sector, sub_sector, listing_date, employee_num`; `all_time_price{52_w/ytd/90_d/all_time low+high → {date:price}}` (range context); `esg_score, indices[], tags[]` (big-cap only, null-guard) |
| **valuation** | `forward_pe, historical_valuation[]{pe,pb,ps,*_peer_avg,year}` (company vs peer-avg). **`intrinsic_value` runs systematically high, never present as fair value (see data-quality.md).** |
| **future** | `analyst_rating_breakdown{strong_buy,buy,hold,sell,strong_sell,n_analyst}`; `company_growth_forecasts[]{eps_growth,revenue_growth,estimate_year}`; `technical_rating_breakdown.summary{buy,sell,neutral}` (all big-cap only) |
| **financials** | `historical_financials[]{year,revenue,earnings,ebitda,...}` (8 yrs, bars); `historical_eps{year:{eps,eps_growth}}`; `historical_financial_ratio[]{profitability{roa,roe,net_profit_margin},leverage,liquidity,efficiency}`; `yoy_quarter_earnings_growth, yoy_quarter_revenue_growth`. (`historical_financials_quarterly` was in the June-2026 snapshot but is **gone from the live response** as of 2026-07-02; for quarterly data use `financials/quarterly/{symbol}/`.) |
| **dividend** | `yield_ttm, dividend_ttm, payout_ratio, cash_payout_ratio` (KPI tiles); `historical_dividends{year:{total_dividend,total_yield,breakdown[]}}`; `upcoming_dividends[]{ex_date,payment_date,dividend_amount}` |
| **management** | `key_executives[]{name,position}, executives_shareholdings[]{name,position,share_amount,share_percentage}` |
| **ownership** | `major_shareholders[]{name,share_percentage,share_amount}` (donut); `top_transactions{top_buyers[],top_sellers[]→{name,changeAmount}}, institutional_transaction_flow[], whale_investors[], conglomerates_group[]` (smart-money) |
| **peers** | `peers[0].peers_data.companies[]{symbol,market_cap,net_income,pe_ttm,pb_mrq,point_summaries[]{name,point,maxpoint}}`. `point_summaries` (name ∈ value/competitive/future/financials/dividend) is a **ready-made radar/scorecard.** |

> Sparse-data behaviour (small caps like JSPT): `esg_score, indices, affiliates,
> forward_pe, company_value_forecasts, analyst_rating_breakdown` all `null`. Always
> null-guard; drop the block rather than render a blank.

### `GET /financials/quarterly/{symbol}/`
Optional `report_date` (from quarterly-dates). Returns `[{symbol, date,
financials_sector_metrics, ...~50 P&L/BS/CF fields}]`. **Banks** populate
`financials_sector_metrics{interest_income, net_interest_income, gross_loan,
total_deposit, casa...}`; non-banks have it `null` but fill `gross_profit,
cost_of_revenue, capital_expenditure, ...`. Examples: `quarterly.json`,
`quarterly_small.json`.

### `GET /company/get_quarterly_financial_dates/{symbol}/`
No params. `{ "2020":[[start,end]...], ..., "2026":[[...]] }`, paired period
dates per quarter; feed into `quarterly`. Example: `quarterly_dates.json`.

### `GET /company/get-segments/{symbol}/`
Optional `financial_year`. `{symbol, financial_year, revenue_breakdown[]{value,
source, target}}`, Sankey edges, not a flat list. **For a `donut` revenue-mix
slide**, filter to edges where `target === "Total Revenue"` to get the actual
top-level revenue segments (source = segment name); the other edges in the
same array flow into cost/opex buckets instead and will silently inflate a
"revenue mix" if you don't filter them out. **For the full decomposition**
(where revenue comes from AND where it goes after), feed the WHOLE array,
unfiltered, straight into a `sankey` chart (`references/charts.md`)
as `links`, the field is already shaped as `{value,source,target}` Sankey
edges, no reshaping needed. TLKM's 17-edge tree reconciles exactly at every
level (see the sankey worked example). Only companies in
`list_companies_with_segments` have it. Examples: `segments_telco.json`
(TLKM, 17 segments), `segments_small.json` (JSPT).

### `GET /daily/{symbol}/`
`start`,`end` (≤90 days). `[{symbol, date, close, volume, market_cap}]`, one row
per trading day (~52 rows / 90 cal days). Price-chart source. Example: `daily.json`.

### `GET /listing-performance/{symbol}/`
**Recent IPOs only** (older listings → 400). `{symbol, company_name,
chg_7d/30d/90d/365d, offering_price, shares_offered, percent_total_shares,
book_building_start/end_date, book_building_lower/upper_bound, distribution_date,
prospectus_url}`. Examples: `listing_perf_recent.json` (works), `listing_perf_small.json` (400 evidence).

---

## 2. Market-wide / cross-company

### `GET /companies/`, screener
The most powerful IDX endpoint. Full field catalog, capability matrix, and recipes
live in `../../docs/SCREENER.md` (source doc, two levels up — a sibling of `references/`).
Params: `where` (SQL-like), `order_by`
(`-market_cap`), `q` (natural language, overrides where/order_by, 3 credits),
`desc`, `limit` (default 50, max 200), `offset`, `include_query_values`.

Returns `{results[]{symbol, company_name, query_values?}, pagination{total_count,
showing,has_next,...}, llm_translation?}`. **Results carry only symbol + name**
(+ `query_values` if requested); feed symbols into `report` for fundamentals.
With `q`, `llm_translation.translated_params` shows exactly how the NL was parsed.

> Index membership is the **`indices`** array, NOT `tags`. `where=tags in ['lq45']`
> → empty. Use `where=indices in ['LQ45']`. `tags` = event tags (`52-w-high`, etc.).

Examples: `companies_screen_where.json`, `companies_screen_q.json`,
`companies_screen_indices.json`, `companies_screen_yearly.json`.

**Ready screener recipes** (verified query patterns, from `docs/SCREENER.md` §6, pair any
result with one `company/report/{symbol}/` per pick for the carousel's real detail):
- **Cheapest blue chips**: `where=indices in ['LQ45'] and pe_ttm > 0 and pe_ttm < 12`, `order_by=pe_ttm`. The `pe_ttm > 0` guard is load-bearing: negative P/E passes any `< X` filter and sorts to the top (verified live 2026-07-02: GOTO at −88.5× led the unguarded list).
- **Dividend aristocrats**: `where=total_yield[2024] > 0.05 and total_yield[2023] > 0.05 and payout_ratio < 0.8`.
- **Fastest growers**: `order_by=-(earnings[2024]/earnings[2023])`, `where=earnings[2023] > 0 and earnings[2024] > 0`.
- **Best banks by ROE**: `where=sub_sector = 'banks' and roe[2024] > 0.1 and roe[2024] < 0.6`, `order_by=-roe[2024]` (verified live 2026-07-02: 9 banks, BBCA on top at 0.20; the band excludes garbage-ROE small caps). `between` is NOT valid where-syntax, it 400s.
- **Founder-owned**: `where=major_shareholders_name like '%<name>%'` or `free_float < 0.25`.
- **Beat last quarter**: `where=earnings_q[Q4-2024] > earnings_q[Q3-2024]`.
- **Scarcity/threshold**: `where=market_cap > 500000000000000`, `order_by=-market_cap` — a hard cutoff can return a strikingly short list (verified: exactly 2 companies above IDR500T), an instant hero-stat cover with no chart needed.
- **Founder/tycoon cross-company reach**: `where=key_executives_name like '%<name>%'` — one name can surface unrelated-looking companies sharing an executive or founder, a "who really owns Indonesia" angle (verified: one search surfaced 3 companies across banking, building materials, and petrochemicals).

**When the ask is open** ("what's a good IDX story this week"), run 2-3 of these recipes plus
`top-changes`/`most-traded` (below) FIRST, before an open-ended web search — they give concrete,
verifiable, timely candidates in one cheap call, and web search then corroborates the "why now"
for whichever candidate looks most postable, instead of searching blind. See SKILL.md step 1.

### `GET /companies/top-changes/`
`classifications` = **only `top_gainers`,`top_losers`** (others rejected here).
`periods` ∈ `1d,7d,14d,30d,365d`. Optional narrowing: `sub_sector` (kebab slug) and
`n_stock` (verified live 2026-07-02: `sub_sector=banks&n_stock=3` returned 3 bank
gainers for 1 credit, the cheapest "what's moving in sector X" discovery call); the
live schema also lists `min_mcap_billion` (untested). Returns
`{top_gainers:{<period>:[{name,symbol,price_change,last_close_price,
latest_close_date}]}}`. **1 credit per class×period.**
Example: `top_changes_movers.json`.

### `GET /most-traded/`
`start`,`end` (≤90 days). Top-N by volume **per date** (default 5); `n_stock` adjusts
the count (verified live 2026-07-02 with 3). The live schema also lists `sub_sector`
and `adjusted` (untested). **No `limit` param.** Observed cost: `limit-consumption: 2`
per call. `{ "<date>": [{symbol, company_name, volume, price}] }`. Example: `most_traded.json`.
**Topic discovery**: check whether one symbol holds the #1 spot across the *entire* window,
not just one day, that "same name every single day" pattern is a story in itself (verified: a
real 10-day pull showed one symbol topping every date), no interpretation required.

### `GET /free-float/`
Optional one of `sector/sub_sector/industry/sub_industry` (kebab slug); omit → all
~956 companies. `[{symbol, company_name, free_float}]` (0-1). Examples:
`free_float_all.json`, `free_float_banks.json`.

### `GET /idx-total/`
`start`,`end` (≤90 days). `[{date, idx_total_market_cap}]`, whole-market cap
trend. Example: `idx_total.json`.

### `GET /index-daily/{index_code}/`
Path = index code (`lq45, idx30, kompas100, jii70, srikehati, idxesgl, …`), NOT a
symbol. `start`,`end` (≤90 days). `[{index_code, date, price}]`. Example:
`index_daily_lq45.json`.

### `GET /subsector/report/{sub_sector}/`
Path = kebab slug. Returns a whole sector leaderboard in one call: `{sector,
sub_sector, statistics{total_companies, filtered_median_pe, filtered_weighted_avg_pe},
market_cap{total, mcap_summary{mcap_change{1w,1y,ytd}, monthly_performance,
performance_quantile}}, stability{weighted_max_drawdown}, valuation{historical_valuation},
growth{growth_forecasts}, companies{top_companies{top_mcap, top_growth, top_profit,
top_revenue}, top_change_companies}}`. Example: `subsector_report.json`.

### `GET /news/`
Params: `symbols` (plural, OR-logic), `sector`, `sub_sector`, `tags`, `keyword`,
`commodity_type`, `extension`, `start`, `end`, `limit`, `offset`. **Not `n_news`.**
Returns `{results[]{title, body, source, thumbnail, timestamp, sector, sub_sector[],
tags[], symbols[], dimension{future,dividend,ownership,technical,valuation,
financials,management,sustainability}}, pagination}`. The `dimension` map scores
which angle each article touches. **Big-cap-skewed** (BBCA 443 on 2026-07-02 and
growing; JSPT 0 on the last check); fall back to `sub_sector` news for uncovered
symbols. Examples: `news.json`, `news_subsector.json`.

### `GET /filings/`
**Insider / major-holder transaction disclosure, not news.** Params: `symbol`
(singular), sector/sub_sector filters, `limit`, `offset`; the live schema also lists
`start`, `end`, `transaction_type`, `holder_type`, `tags` (untested live). Returns
`{results[]{title, body, source, timestamp, symbol, transaction_type(buy/sell),
holder_type(insider/...), holder_name, holding_before, holding_after,
amount_transaction, price, transaction_value, share_percentage_before/after,
idx_conglomerates_group_slug, idx_investor_slug}}` (the two slugs are join keys
toward conglomerate/whale angles).
**Coverage skews big-cap but is not exclusive**: a ~IDR 296B small cap topped the
live stream on 2026-07-02. Don't assume a small cap is absent, and don't assume
presence either (JSPT had zero on the last check); query, then null-guard.
Filing-body numbers are unreliable (see data-quality.md).
**Topic discovery**: several same-direction filings from different holders in a short window
is an "insider cluster buying/selling" story, real filings have narrated this explicitly in
their own `body` text (e.g. one buy filing explicitly referencing 6 other insiders' purchases
over the prior 6 months). Use the filing dates/structured fields for the pattern, never the
body's own numbers for the figures (that's the unreliable part).
Example: `filings.json`.

---

## 2b. Trading flow, brokers & corporate actions

10 IDX "smart-money" / microstructure endpoints. Examples in `responses/new/`.
Broker windows obey the **≤90-day cap and 2025-01-02 floor** (top of this doc).

### `GET /company/corporate-actions/{symbol}/`
No params. `{symbol, corporate_actions{dividend[]{ex_date,payment_date,
dividend_yield,dividend_amount}, upcoming_dividend[], stock_split[]{date,split_ratio},
right_issue[], warrant[], bonus[], agm[]{agm_date,agm_time,agm_place,agm_result}}}`.
**Empty types return `null`, not `[]`, guard before iterating.** Example:
`corporate_actions.json`.

### `GET /company/shareholders-composition/{symbol}/`
Optional `year` (default current). Monthly snapshots: `{symbol, year, data[]{date,
shares_number, numbers_of_shareholders, change_in_shareholders, <category>_l,
<category>_f, total_l, total_f}}` where `_l`=local, `_f`=foreign and `<category>` ∈
`insurance, corporate, pension_fund, financial_institutions, individual,
mutual_fund, securities_companies, foundation, other`. Local-vs-foreign ownership
split by holder type, month over month. Example: `shareholders_composition.json`.

### `GET /foreign-flow/{symbol}/`
`start`,`end` (≤90 days, default last 30). `{symbol, start, end, data[]{date,
net_foreign_inflow}}`, net foreign-broker inflow in IDR/day (positive = foreign
net buying). Example: `foreign_flow.json`.

### `GET /brokers/`
Optional `cohort` (`institutional|mixed|retail|unknown`), `origin`
(`domestic|foreign`). Registry: `[{code, name, is_foreign, cohort, license_type}]`
(~88 brokers). Resolve `broker_code` here first. Example: `brokers.json`.

### `GET /brokers/top/`
Brokers ranked for one date. Params: `date` (default latest), `metric` (`gross|net`),
`origin` (`all|domestic|foreign`), `cohort`, `n_brokers`. `{date, metric, origin,
cohort, results[]{rank, broker_code, gross, net}}`. Example: `brokers_top.json`.

### `GET /broker-summary/{symbol}/`
Per-broker daily rows for one ticker. Params: `broker_code`, `start`,`end`. `{symbol,
start, end, data[]{date, summary[]{broker_code, bfreq, blot, bval, bavg_per_share,
sfreq, slot, sval, savg_per_share, nlot, nval, navg_per_share}}}`, `b`=buy,
`s`=sell, `n`=net. Example: `broker_summary.json`.

### `GET /broker-summary/{symbol}/top/`
Brokers most accumulating/distributing one ticker. Params: `start`,`end`, `cohort`,
`origin`, `n_brokers` (default 10, max 100). `{symbol, top_buyers[]{rank,
broker_code, net_idr, buy_idr, sell_idr}, top_sellers[]}`. "Which brokers are
loading up on X." Example: `broker_summary_top.json`.

### `GET /broker-activity/{broker_code}/`
All (stock, day) activity for one broker. Params: `symbol`, `start`,`end`.
`{broker_code, data[]{date, summary[]{symbol, bfreq, blot, bval, sfreq, slot, sval,
nlot, nval, ...}}}`. Large (~440 stocks/day). Example: `broker_activity.json`.

### `GET /broker-activity/{broker_code}/top/`
Stocks a broker is most accumulating/distributing. Params: `start`,`end`,
`n_brokers`. `{broker_code, top_accumulations[]{rank, symbol, net_idr, buy_idr,
sell_idr}, top_distributions[]}`. "What is broker X buying." Example:
`broker_activity_top.json`.

### `GET /suspensions/`
Optional `symbol`, `start`, `end`, `limit` (default 20, max 30), `offset`.
`{results[]{symbol, suspension_date, reason, pdf_url}, pagination}`. Example:
`suspensions.json`.

---

## 3. Discovery / slug helpers (call first, cheap, cacheable)
| Path | Returns | Example |
|---|---|---|
| `GET /subsectors/` | `[{sector, subsector}]` (33 pairs) | `subsectors.json` |
| `GET /industries/` | `[{subsector, industry}]` (58) | `industries.json` |
| `GET /subindustries/` | `[{industry, sub_industry}]` (101) | `subindustries.json` |
| `GET /tags/` | `[str]` (98 news/event tags) | `tags.json` |
| `GET /companies/list_companies_with_segments/` | `{ "SYM.JK": {financial_year:[yrs]} }` (who has segment data) | `companies_with_segments.json` |

---

## 4. Singapore Exchange (SGX)

Discovered and live-verified 2026-07-08 (not in the original IDX-only audit). Everything
IDX-specific above (subsectors, brokers, foreign-flow, corporate-actions, filings) has **no
confirmed SGX equivalent** — don't assume parity, probe before relying on a path not listed here.

**Trailing slash is required.** `sgx/company/report/D05` (no slash) returns `403
{"error":"Authentication credentials were not provided."}`, a misleading error that looks
like an auth problem but is actually a routing miss — the fix is `sgx/company/report/D05/`
(slash), not touching the API key.

### `GET /sgx/company/report/{symbol}/`
Ticker is the bare SGX code, no suffix (`D05`, not `D05.SI`). Optional `sections=` (comma list);
unlike IDX's 8 sections, **only 4 exist**: `overview`, `valuation`, `financials`, `dividend`.
`sections=ownership` / `=peers` / `=all` all 400 with `"Invalid sections provided"` — SGX reports
carry no ownership or peer-comparison data at all. Cost tracks section count same as IDX (a
4-section/no-`sections` call cost 4 credits observed). Shape per section:
- `overview`: `market_cap, volume, employee_num, sector, sub_sector, tags[], last_close_price,
  change_1d/7d/1m/1y/3y/ytd, all_time_price{ytd_low/high, 52_w_low/high, 90_d_low/high,
  all_time_low/high}` (each a `{date: price}` single-pair object, same shape as IDX).
- `valuation`: flat, no per-year history like IDX's `historical_valuation[]` — just current
  `pe, beta, ps, pcf, pb`.
- `financials`: `historical_financials{year: {date, revenue, earnings, cash_flow_metrics{...},
  income_stmt_metrics{...}, balance_sheet_metrics{total_asset, total_equity,
  total_liabilities}}}` — **annual only, no quarterly equivalent found** (no
  `financials/quarterly/{symbol}/` analog under `sgx/`, probe before assuming one exists). Some
  years (banks observed) also carry a `sankey_component{links[],nodes[]}` revenue/cost flow and
  `industry_breakdown` (loan book, customer segment) — richer than IDX's flat annual numbers when
  present, but not guaranteed every ticker/year has it. Also flat current-only:
  `eps, gross_margin, operating_margin, net_profit_margin, one_year_eps_growth,
  one_year_sales_growth, quick_ratio, current_ratio, debt_to_equity`.
- `dividend`: `dividend_yield_5y_avg, dividend_growth_rate, payout_ratio, forward_dividend,
  forward_dividend_yield, dividend_ttm, historical_dividends{year:{breakdown[]{date,total,yield},
  total_yield, total_dividend}}` (breakdown goes back to listing, D05 example starts 2000).

### `GET /sgx/daily/{symbol}/`
Same shape as IDX's `daily/{symbol}/`: `[{symbol, date, close, volume}]` (no `market_cap` per row,
unlike IDX). No `symbol`/`n_days` param tested; `start`/`end` (`YYYY-MM-DD`) works exactly like
IDX's — confirmed a 90-day span returns full data. No params at all defaults to the trailing ~22
trading days (~30 calendar days). Same 90-day cap risk as IDX is unconfirmed but assume it applies
until proven otherwise; don't request a multi-year range in one call.

### `GET /sgx/companies/`
Ticker/name directory, paginated (`{results[]{symbol, company_name}, pagination{total_count,
showing, limit, offset, has_next, has_previous, next_offset, previous_offset}}`). 580 tickers
total observed. `order_by=-market_cap` did NOT visibly resort the default listing in a spot check
— treat sort/filter query params as unconfirmed for this endpoint (unlike IDX's `companies/`
screener, which documents `where`/`order_by` as load-bearing) until each one is tested live.
No per-row fields beyond symbol/name observed — this is a lookup directory, not a screener with
inline metrics; don't expect an IDX-style `query_values` shortcut here.

**Not yet found (probe before assuming absent, but unconfirmed as of this pass):** an SGX
`top-changes`/`most-traded` mover feed, foreign/broker flow, corporate actions, peers/ownership,
a subsector-level report, or a quarterly financials endpoint. A single-stock deep-dive (`report`
+ `daily`) is the carousel type this data layer currently supports well for SGX; don't promise a
sector-pulse, smart-money, or dividend-calendar SGX carousel without probing further first.

### SGX ticker logos — DO NOT USE THIS SOURCE AS-IS (watermarked)
`https://storage.googleapis.com/sectorsapp-sea/sgx_logo/sgx_{TICKER}.png` exists and is
publicly reachable (confirmed live 2026-07-08, no auth), but every logo checked there (D05,
O39, Z74, U11, C6L) carries a visible **"SGinvestors" watermark baked into the pixels**,
repeated across the whole canvas including inside the icon mark itself, not just near the
wordmark, so it survives even a tight crop to icon-only. It's also an **opaque white
background**, not transparent, which paints a white box on the dark theme even before the
watermark problem. Shipping this in a published carousel puts a third party's attribution
on a Sectors-branded asset — do not merge it into `assets/logos.json` and do not reference it
via a `logoUrl` override. This was tried and reverted (2026-07-08): a `D05` entry was briefly
added to `logos.json`, discovered watermarked on render, and removed.

**Re-verified 2026-07-17, two corrections to the note above.** First, the background is
**already properly transparent, not opaque white** — a raw pixel dump (`ffmpeg -f rawvideo
-pix_fmt rgba`) shows alpha=0 at the canvas edges on every ticker checked (U11, U14, H02, U06,
U13, U10). The "opaque white" impression in the original note almost certainly came from
viewing the PNG in a tool that composites transparent pixels onto a white canvas by default,
not from the file itself. **Do not run a white-colorkey pass on this source** — since the
background is RGB (0,0,0) at alpha=0 (transparent black, not transparent white), a
`colorkey=0xFFFFFF` filter won't match those pixels, and depending on filter order it can
flatten their alpha to fully opaque, turning the transparent background into a solid BLACK box
(worse than the original problem). Use the fetched PNG directly, no background processing
needed.

Second, the watermark claim holds, just needed the right test: it's invisible while the
background reads as white/transparent (nothing to contrast against), but overlay the raw PNG
directly onto a dark canvas (`color=0x0C0A09` + `overlay`) and the "SGinvestors" text is
clearly visible, repeated diagonally across the mark itself, not just near the wordmark.
Confirmed on U11 and H02 this pass. This is a property of the actual ink pixels (their alpha
IS 255, by design, that's the logo), not a background/transparency artifact, so it survives
into any composited use.

**Given the above, this source now ships in this skill anyway**: `assets/sgx-logos.json` holds
the six tickers used in the Wee Family Group video (U11, U14, H02, U06, U13, U10), fetched
directly with no colorkey step, per the user's explicit call that the watermark is acceptable
for that piece. `src/components/Logo.tsx` checks this registry before falling back to the
gradient monogram. Don't assume this decision generalizes: it was made by the user for one
specific video, not a blanket "watermark is fine now" for every future SGX piece — ask before
reusing this registry's contents in a different published piece.

**Until told otherwise for a given piece, let SGX tickers fall back to the built-in gradient
monogram** (`visual-language.md`'s documented degradation for "no logo asset"; `logoBox` in
`scripts/blocks.mjs` already does this automatically for any ticker missing from
`logos.json`, zero extra work needed). Still don't add an SGX key to the shared IDX
`logos.json` — keep any watermarked SGX asset in its own separate registry file so it's never
silently reused as if it were a clean logo.
If a future session finds a clean official SGX logo source (DBS's own newsroom/press-kit
assets, Wikimedia Commons' bank/company logo pages, etc.), the merge mechanism itself is
still sound: `assets/logos.json` is a flat `{TICKER: base64png}` map with no IDX/SGX
namespace collision risk (codes like `D05`, `O39`, `Z74` aren't valid IDX symbols), so a
clean PNG just needs base64-encoding and one new key — no renderer or lint change required,
since both the cover-pill and inline `data-logo` paths already key off this same file. Verify
transparency and watermark-free-ness by cropping and eyeballing the PNG before merging, the
way this entry was caught: a raw `curl` HEAD 200 is not enough evidence the asset is usable.
