# Company Screener — `GET /v2/companies/` (deep reference)

The single most powerful IDX endpoint: filter/sort/screen all ~957 listed
companies with SQL-like queries or natural language. This doc pairs the **official
field catalog** (transcribed, canonical) with a **live capability probe**
(`scripts/screener_probe.py`, run 2026-06-12) that confirms each query class
actually works and records the behaviours the catalog doesn't mention.

Two source markers below:
- **[docs]** — verbatim from the official Sectors docs (field meaning/coverage).
- **[verified 2026-06-12]** — observed live in this repo's probe.

---

## 1. Query modes (mutually exclusive)
| Mode | Params | Credits | Notes |
|---|---|---|---|
| **Structured** | `where` + `order_by` (+ `desc`, `limit`, `offset`) | **1** [docs] | precise, deterministic |
| **Natural language** | `q` | **3** [docs] | `q` overrides all other params; LLM generates where/order_by |

**Common params:** `limit` (default 50, **max 200** [verified]), `offset`
(pagination), `desc` (bool), `include_query_values` (bool — see §3).

**Auth:** `Authorization: <raw-key>` (no Bearer), real User-Agent.

---

## 2. Capability matrix — all 28 probes returned 200 [verified 2026-06-12]
Every documented query class works live. `total` = matching companies in the universe.

| Capability | Example `where` | Result |
|---|---|---|
| Direct field + `order_by` desc | `market_cap > 500000000000000` | 2 (BBCA, BREN) |
| `LIKE` on string | `company_name like '%energi%'` | 15 |
| Compound AND + date literal | `sector = 'Financials' and listing_date > '2005-01-01'` | 58 |
| Array `IN` (indices) | `indices in ['LQ45','IDX30']` | 45 |
| Array `IN` (tags) | `tags in ['52-w-high']` | 8 |
| JSON-object (TTM/MRQ) | `pe_ttm < 15 and roe_ttm > 0.1` | 188 |
| **Field-to-field** | `last_close_price < all_time_high_price` | 954 |
| Date JSON field | `ytd_low_date > '2025-03-01'` | 957 |
| **Yearly + arithmetic RHS** | `revenue[2024] > earnings[2024] * 5` | 757 |
| Same field, two years | `roe[2023] > 0.15 and roe[2022] > 0.15` | 113 |
| Yearly field-to-field (peer) | `pe[2024] < pe_peer_avg[2024]` | 426 |
| Computed ratio field | `current_ratio[2024] > 2 and roe[2024] > 0.1` | 108 |
| Margin ratio | `net_profit_margin[2024] > 0.3` | 76 |
| Banking loan-quality | `non_performing_loan[2024] > 0` | 48 |
| Banking ratio | `casa_ratio[2024] > 0.5` | 16 |
| **Forecast field** | `forecast_eps_growth[2025] > 0.15` | 2 (sparse coverage) |
| Forecast estimate | `forecast_revenue_estimate[2025] > 1e14` | 0 (sparse) |
| **Quarterly bracket** | `revenue_q[Q1-2024] > 1000000000000` | 199 |
| Quarterly QoQ | `earnings_q[Q4-2024] > earnings_q[Q3-2024]` | 385 |
| **JSON-list (shareholder)** | `major_shareholders_name like 'PT%' and major_shareholders_share_percentage > 0.1` | 807 |
| JSON-list (executive) | `key_executives_name like '%Prajogo%'` | 3 |
| JSON-list (`free_float`) | `free_float < 0.25` | 522 |
| `order_by` arithmetic | `order_by=-(earnings[2024]/earnings[2023])` | works |
| `limit` boundary | `limit=200` | returns exactly 200 |
| `offset` pagination | `offset=5` | next page |
| `include_query_values` (structured) | see §3 | adds per-result values |
| NL basic | `q=top 5 technology companies by revenue in 2024` | 43 |
| NL "latest year" (smart FY) | `q=...highest ROE in the latest year` | resolved to 2025 |

---

## 3. Behaviours the catalog doesn't spell out [verified 2026-06-12]

**`include_query_values=true` works on structured queries, not just NL.** Each
result gains a `query_values` object echoing the interpreted fields:
```json
{"symbol":"TLDN.JK","company_name":"PT Teladan Prima Agro Tbk","query_values":{"roe[2024]":262.52}}
```
Use it to show the sorted metric inline (e.g. the ROE behind a ranking) without a
second call. NL mode auto-enables it.

**Natural language returns `llm_translation`** exposing the generated query:
```json
{"natural_query":"top 5 technology companies by revenue in 2024",
 "translated_params":{"where":"sector = 'Technology' and revenue[2024] IS NOT NULL",
                      "order_by":"-revenue[2024]","limit":5,"include_query_values":true}}
```
The LLM auto-adds `IS NOT NULL` guards and `include_query_values:true`. Good for
"explain this list" captions, and for learning the structured form of a query.

**Smart FY handling, confirmed.** Probed in **June 2026**, `q=...latest year`
resolved to **`roe[2025]`**. [docs] say Jan–Apr default to the previous audited
year (a Q1-2026 query → 2024); after April it uses the most recent (2025 here).
So the resolved year depends on the query month — don't assume "latest" == a fixed year.

**Response envelope (all modes):** `{results[]{symbol, company_name,
query_values?}, pagination{total_count, showing, limit, offset, has_next,
has_previous, next_offset, previous_offset}, llm_translation?}`. Results carry
**only symbol + company_name** (+ query_values) — for full fundamentals, feed
symbols into `company/report/{symbol}/`.

---

## 4. Field catalog [docs]
Operators: `= != > >= < <= like in`, combined with `and`/`or`. Strings are
case-insensitive, single or double quotes. Arithmetic allowed on both sides.

### Direct fields (top-level, standard operators)
`symbol, company_name, listing_board (Main|Development|Acceleration), industry,
sub_industry, sector, sub_sector, market_cap, market_cap_rank, employee_num,
employee_num_rank, listing_date, last_ex_dividend_date, last_close_price,
daily_close_change, forward_pe, intrinsic_value, esg_score, yield_ttm,
dividend_ttm, payout_ratio, cash_payout_ratio, yoy_quarter_earnings_growth,
yoy_quarter_revenue_growth`

### Array fields (use `in`)
`tags` (analyst-sentiment/event tags, e.g. `bullish`, `52-w-high`), `indices`
(`LQ45`, `IDX30`, …), `affiliates` (related tickers).

### JSON-object fields (most-recent; query like direct fields)
`pe_ttm, pb_mrq, ps_ttm, dar_mrq, der_mrq, roa_ttm, roe_ttm, total_assets_mrq,
total_equity_mrq, total_revenue_mrq, earnings_mrq, total_liabilities_mrq,
yearly_mcap_change, dividend_yield_avg_period, dividend_yield_avg,
ytd_low_price, ytd_low_date, ytd_high_price, ytd_high_date,
52_w_low_price, 52_w_low_date, 52_w_high_price, 52_w_high_date,
90_d_low_price, 90_d_low_date, 90_d_high_price, 90_d_high_date,
all_time_low_price, all_time_low_date, all_time_high_price, all_time_high_date`

### Yearly fields — bracket notation `field[YYYY]`
**General financials:** `eps, eps_growth, total_dividend, total_yield, earnings,
revenue, capital_expenditure, cash_and_equivalents, cash_inflow, cash_only,
cash_outflow, cost_of_revenue, current_assets, current_liabilities,
non_current_liabilities, earnings_before_tax, ebit, ebitda, end_cash_position,
financing_cash_flow, fixed_assets, free_cash_flow, gross_profit, interest_expense,
interest_expense_non_operating, interest_income, inventories, investing_cash_flow,
net_cash_flow, non_operating_income_or_loss, operating_cash_flow, operating_expense,
operating_pnl, outstanding_shares, prepaid_assets, provision,
realized_capital_goods_investment, retained_earnings, tax, total_assets, total_debt,
total_equity, total_liabilities`

**Banking-only:** `allowance_for_loans, core_capital_tier1, credit_rwa,
current_account, gross_loan, high_quality_liquid_asset, market_rwa,
net_interest_income, net_loan, non_interest_bearing_liabilities, non_interest_income,
non_loan_assets, non_loan_earning_assets, non_loan_non_earning_assets, operational_rwa,
other_interest_bearing_liabilities, savings_account, supplementary_capital_tier2,
time_deposit, total_capital, total_cash_and_due_from_banks, total_deposit,
total_risk_weighted_asset, special_mention_loan, non_performing_loan,
restructured_loan_current`

**Insurance-only:** `net_premium_income, premium_expense, premium_income`

**Valuation (yearly):** `pe, pb, ps, pcf, peg, enterprise_to_ebitda,
enterprise_to_revenue, pb_peer_avg, pe_peer_avg, ps_peer_avg`

**Ratios (yearly):** `debt_to_asset_ratio, debt_to_equity_ratio,
cash_flow_to_debt_ratio, interest_coverage_ratio, current_ratio,
operating_cash_flow_margin, fixed_asset_turnover, total_asset_turnover, roa, roe,
net_profit_margin, gross_profit_margin, operating_profit_margin, efficiency_ratio,
cost_to_income_ratio` · **banking ratios:** `capital_adequacy_ratio, casa_ratio,
leverage_ratio, loan_to_deposit_ratio, liquidity_coverage_ratio, net_interest_margin`

**Forecast (yearly, analyst consensus):** `forecast_eps_growth,
forecast_revenue_growth, forecast_eps_estimate, forecast_revenue_estimate`
— coverage is **sparse** [verified: `forecast_eps_growth[2025] > 0.15` → 2 names].

### Quarterly fields — bracket notation `field_q[Qi-YYYY]`
`revenue_q, earnings_q, gross_profit_q, operating_pnl_q, ebit_q, ebitda_q,
earnings_before_tax_q, tax_q, cost_of_revenue_q, interest_expense_q,
operating_expense_q, non_operating_income_or_loss_q, interest_expense_non_operating_q,
realized_capital_goods_investment_q, total_assets_q, current_assets_q,
total_liabilities_q, current_liabilities_q, non_current_liabilities_q,
total_equity_q, total_debt_q, cash_only_q, provision_q, operating_cash_flow_q,
investing_cash_flow_q, financing_cash_flow_q, free_cash_flow_q, capital_expenditure_q`
· **banking:** `net_loan_q, time_deposit_q, total_deposit_q, current_account_q,
interest_income_q, savings_account_q, non_interest_bearing_liabilities_q,
other_interest_bearing_liabilities_q, allowance_for_loans_q, gross_loan_q,
total_cash_and_due_from_banks_q, net_interest_income_q, non_interest_income_q`
· **insurance:** `premium_expense_q, net_premium_income_q, premium_income_q`

### JSON-list fields (matches if *any* list item satisfies the condition)
`key_executives_name, key_executives_position, executives_shareholdings_name,
executives_shareholdings_share_amount, executives_shareholdings_share_percentage,
major_shareholders_name, major_shareholders_share_value,
major_shareholders_share_amount, major_shareholders_share_percentage, free_float`
(`free_float` = public ownership decimal, `0.45` = 45%).

---

## 5. Gotchas
- **Garbage values pass filters.** `order_by=-roe[2024]` put TLDN on top with
  `roe[2024]=262` (26,200%) [verified]. Numeric screens don't sanity-check —
  apply plausibility bands (ROE 0–0.6, payout 0–1.2, drop negative P/E) before
  publishing a ranking. See `../sectors-endpoints/references/...` data-quality notes.
- **`tags` ≠ index membership.** `tags in ['lq45']` → empty; use `indices in ['LQ45']`.
- **Forecast & some banking fields are thinly covered** — expect small/empty result
  sets; always check `pagination.total_count` before rendering "top N".
- **Smart FY** means "latest" resolves to a different year depending on query month
  (§3) — pin the year explicitly (`revenue[2024]`) when you need determinism.
- **`q` costs 3× a structured call.** For repeatable jobs, run `q` once, copy the
  `llm_translation.translated_params.where`, then use structured queries (1 credit).
- Results are symbol + name only; fundamentals need a follow-up `report` call.

---

## 6. Social-content recipes
- **"Cheapest blue chips":** `where=indices in ['LQ45'] and pe_ttm > 0 and pe_ttm < 12`, `order_by=pe_ttm`, `include_query_values=true`. The `pe_ttm > 0` guard is load-bearing: negative P/E passes `< X` and sorts first (verified 2026-07-02: GOTO at −88.5× led the unguarded list).
- **"Dividend aristocrats":** `where=total_yield[2024] > 0.05 and total_yield[2023] > 0.05 and payout_ratio < 0.8`.
- **"Fastest growers":** `order_by=-(earnings[2024]/earnings[2023])`, `where=earnings[2023] > 0 and earnings[2024] > 0`.
- **"Best banks by ROE":** `where=sub_sector = 'banks' and roe[2024] > 0.1 and roe[2024] < 0.6`, `order_by=-roe[2024]` (verified 2026-07-02: 9 banks, BBCA top at 0.20). `between` is NOT valid where-syntax; it 400s with `INVALID_WHERE_CLAUSE`.
- **"Founder-owned":** `where=major_shareholders_name like '%<name>%'` or `free_float < 0.25`.
- **"Beat last quarter":** `where=earnings_q[Q4-2024] > earnings_q[Q3-2024]`.
- Pair any list with one `company/report/{symbol}/` per pick for the carousel detail.
