# Data Catalog — what social content each IDX endpoint can feed

Scope: **IDX only.** Oriented to the skill-socmed use case: turning IDX data into
social posts, carousels, and short-form video. Maps **available data points →
content angle → source field**. Every field here was live-verified (see
`ENDPOINTS.md`).

Units: IDR amounts are raw rupiah (BBCA market_cap `689,538,992,175,000` =
~IDR 689.5 T). Ratios/yields/changes are decimals (`0.097` = +9.7%).

---

## A. Single-stock content (one `report` call carries most of it)

| Content angle | Field path | Notes |
|---|---|---|
| **Price hook** ("BBCA +9.7% today") | `overview.last_close_price`, `daily_close_change`, `latest_close_date` | decimal change |
| **52-week / all-time context** | `overview.all_time_price.{52_w_low,52_w_high,ytd_*,all_time_*}` | each is `{date: price}` — date is free annotation |
| **Price chart** | `daily[]{date, close, volume}` | ≤90d; line + volume bars |
| **Revenue & profit trend** | `financials.historical_financials[]{year, revenue, earnings, ebitda}` | 8 yrs; grouped bars |
| **EPS growth story** | `financials.historical_eps{year:{eps, eps_growth}}` | growth already computed |
| **Margins / ratios** | `financials.historical_financial_ratio[]{profitability{roa,roe,net_profit_margin,...}, leverage, liquidity, efficiency}` | small-multiples |
| **Latest-quarter beat/miss** | `financials.{yoy_quarter_earnings_growth, yoy_quarter_revenue_growth}` | one-number callouts |
| **Dividend yield / payout** | `dividend.{yield_ttm, dividend_ttm, payout_ratio, cash_payout_ratio}` | KPI tiles |
| **Dividend history** | `dividend.historical_dividends{year:{total_dividend, total_yield, breakdown[]{date,total,yield}}}` | bar (amount) + line (yield) |
| **Upcoming dividend / ex-date** | `dividend.upcoming_dividends[]{ex_date, payment_date, dividend_amount}` | calendar / countdown post |
| **Analyst consensus** | `future.analyst_rating_breakdown{strong_buy,buy,hold,sell,strong_sell,n_analyst}` | stacked bar; ⭐ not in upstream doc |
| **Growth forecast** | `future.company_growth_forecasts[]{eps_growth, revenue_growth, estimate_year}` | forward callout |
| **Technical rating gauge** | `future.technical_rating_breakdown.summary{buy,sell,neutral}` | buy/sell/neutral gauge |
| **Valuation vs peers** | `valuation.historical_valuation[]{pe, pb, ps, *_peer_avg}` | company vs peer-avg bars |
| **Company scorecard (radar)** | `peers[0].peers_data.companies[<self>].point_summaries[]{name, point, maxpoint}` | value/competitive/future/financials/dividend |
| **Revenue segment breakdown** | `segments.revenue_breakdown[]{value, source, target}` | Sankey / treemap |
| **Ownership donut** | `ownership.major_shareholders[]{name, share_percentage}` | top holders |
| **Smart-money flow** | `ownership.{top_transactions{top_buyers,top_sellers}, institutional_transaction_flow[], whale_investors, conglomerates_group}` | "who's buying" post |
| **Insider buys/sells** | `filings.results[]{holder_name, transaction_type, holding_before/after, transaction_value}` | big-cap-skewed, not exclusive |
| **Leadership** | `management.{key_executives[], executives_shareholdings[]}` | exec spotlight |
| **ESG badge** | `overview.esg_score` | big-cap only (null on small caps) |
| **News headline + hook** | `news.results[]{title, body, thumbnail, timestamp, dimension}` | big-cap only; `dimension` tags the angle |

> Don't use `valuation.intrinsic_value` in posts — it's a DCF that runs ~+120–260%
> high. "Fair value" claims off it will be wrong. Use analyst ratings / peer
> multiples instead.

---

## B. Market & ranking content (no single symbol)

| Content angle | Endpoint | Field |
|---|---|---|
| **Top gainers / losers** ("today's movers") | `companies/top-changes` | `{top_gainers/losers:{<period>:[{name,symbol,price_change,last_close_price}]}}` |
| **Most-traded by volume** | `most-traded` | `{date:[{symbol, company_name, volume, price}]}` — daily top 5 |
| **Screen leaderboards** (cheapest banks, highest yield, fastest growers) | `companies` | `where`/`order_by` + `query_values` shows the sorted metric |
| **NL-driven list** ("top 5 dividend banks") | `companies?q=` | `results[]` + `llm_translation.translated_params` |
| **Sector pulse** | `subsector/report/{slug}` | `mcap_summary.mcap_change{1w,1y,ytd}`, `monthly_performance`, `statistics.filtered_median_pe`, `top_companies{top_mcap/growth/profit/revenue}` |
| **Free-float ranking** | `free-float` | `[{symbol, free_float}]` (optionally per sector) |
| **Index trend** | `index-daily/{code}` | `[{date, price}]` (LQ45, IDX30, …) |
| **Whole-market cap trend** | `idx-total` | `[{date, idx_total_market_cap}]` |
| **Recent IPO scoreboard** | `listing-performance/{sym}` | `chg_7d/30d/90d/365d`, `offering_price`, `book_building_*` |

`subsector/report` is the single richest "make a sector carousel" call — it bundles
leaderboards (top mcap/growth/profit/revenue), valuation percentiles + ranks,
drawdown, and 12-month performance in one response.

---

## C. Smart-money & flow content (see ENDPOINTS §2b)
High-engagement "who's buying" angles from the broker/flow endpoints.

| Content angle | Endpoint | Field |
|---|---|---|
| **Foreign money in/out of a stock** | `foreign-flow/{symbol}` | `data[]{date, net_foreign_inflow}` — line/area, green-above-zero |
| **Top brokers loading a stock** | `broker-summary/{symbol}/top` | `top_buyers[]{broker_code, net_idr}` vs `top_sellers[]` |
| **What a broker is accumulating** | `broker-activity/{code}/top` | `top_accumulations[]{symbol, net_idr}` / `top_distributions[]` |
| **Most active brokers today** | `brokers/top` | `results[]{rank, broker_code, gross, net}` (by `gross` or `net`) |
| **Local vs foreign ownership shift** | `shareholders-composition/{symbol}` | monthly `total_l` vs `total_f` + per-holder-type `_l/_f` (donut / stacked area) |
| **Ownership by holder type** | `shareholders-composition/{symbol}` | `individual_*, mutual_fund_*, pension_fund_*, insurance_*, …` |
| **Corporate-action calendar** | `corporate-actions/{symbol}` | `upcoming_dividend[]`, `stock_split[]`, `agm[]{agm_date}`, `right_issue[]` |
| **Suspension alert** | `suspensions` | `results[]{symbol, suspension_date, reason, pdf_url}` |

Broker `cohort` (`retail/institutional/mixed`) + `origin` (`foreign/domestic`)
filters let you frame it ("foreign institutions are net buyers of BBCA"). Note
broker AND foreign-flow windows both cap at **90 days** (superseded from an
earlier 30-day cap, live-reverified 2026-06-12 — see `ENDPOINTS.md` in this
same folder, which already has the corrected figure; this file was stale).

---

## Coverage reality check (verified)
- **News:** big-cap-skewed. BBCA = 443 news (2026-07-02); **JSPT = 0**. For small
  caps, drop the news card or use `sub_sector` news. **Filings:** skew big-cap but
  are not exclusive (a ~IDR 296B small cap topped the live stream on 2026-07-02);
  query per symbol, then null-guard.
- **ESG, analyst ratings, forecasts, forward_pe, indices, affiliates:** populated
  for blue chips, `null` for small caps (JSPT). Always null-guard before render.
- **Segments:** only companies in `companies/list_companies_with_segments/`.
- **`intrinsic_value`:** present for most, but unreliable (see warning above).
- **Data-quality landmines (from prior live audits):** P/E goes negative for
  loss-makers; ROE can exceed 100%; payout_ratio > 100% is common; `cash_payout_ratio`
  can be >1 (a BBCA pull once read 2.6; 0.69 on 2026-07-02, TTM values roll, so re-fetch
  rather than reuse). Blue chips are clean; anomalies cluster in loss-makers,
  small caps, and fresh IPOs. Add per-metric sanity bands before publishing a number.

---

## Suggested post templates
- **Stock one-pager / carousel:** overview KPIs → price chart → revenue&earnings bars
  → dividend bars → ownership donut → analyst-rating bar → peer scorecard radar. One
  `report` call (+ one `daily`) covers it.
- **"Today's movers" daily post:** `top-changes` (gainers+losers, 1d) + `most-traded`.
- **Sector explorer:** `subsector/report` leaderboards + `free-float` ranking.
- **Dividend calendar:** `companies?q=upcoming dividends` or per-symbol
  `dividend.upcoming_dividends` → ex-date countdown.
- **Recent IPO scoreboard:** `listing-performance/{sym}` → offering price vs now,
  `chg_7d/30d/90d/365d`.
