-- name:         idx-filings-for-symbol
-- computes:     every insider / major-holder transaction filing for one IDX symbol,
--               oldest first, with holder, direction, shares, price, value and the
--               before/after holding and percentage as filed
-- universe:     a single IDX symbol, {{symbol}}, rows in idx_filings
-- window:       full history held in idx_filings, no date filter
-- exclusions:   none; duplicate filings (same holder, date, shares) are returned as
--               filed so the caller can see and collapse them openly
-- survivorship: not applicable, single symbol, filings as filed
-- statistic:    raw filings, no aggregation
-- note:         symbols carry the .JK suffix, e.g. 'TRUK.JK'
select f.id,
       f.timestamp::text as filed_at,
       f.holder_name,
       f.holder_type,
       f.transaction_type,
       f.amount_transaction,
       f.price,
       f.transaction_value,
       f.holding_before,
       f.holding_after,
       f.share_percentage_before,
       f.share_percentage_after,
       f.share_percentage_transaction,
       f.price_transaction,
       f.idx_investor_slug,
       f.idx_conglomerates_group_slug,
       f.source,
       f.source_is_manual
from idx_filings f
where f.symbol = '{{symbol}}'
order by f.timestamp asc, f.id asc

-- candidate: idx-register-history-for-holder
-- every 1% register entry, every snapshot, whose holder name matches {{holder_pattern}}
select o.date::text as snapshot_date, o.symbol, o.investor_name, o.investor_type,
       round(o.percentage::numeric, 3) as holder_pct
from idx_one_percent_ownership o
where o.investor_name ilike '{{holder_pattern}}'
order by o.symbol, o.date;

-- candidate: idx-register-institutional-holder-books
with params as (
  select (select max(o.date) from idx_one_percent_ownership o) as snapshot_date,
         (select max(d.date) from idx_daily_data d) as price_date
),
mc as (
  select distinct on (d.symbol) d.symbol, d.market_cap
  from idx_daily_data d, params p
  where d.date <= p.price_date
  order by d.symbol, d.date desc
),
reg as (
  select o.symbol, o.investor_name, o.investor_type, o.percentage,
         o.percentage / 100.0 * m.market_cap as stake_value
  from idx_one_percent_ownership o
  join params p on o.date = p.snapshot_date
  left join mc m on m.symbol = o.symbol
  where o.investor_type in ('Pension Funds','Mutual Funds','Insurance','Financial Institution','Government','Foundation','Other')
     or (o.investor_type = 'Corporate' and o.investor_name ~* '(investama|investasi|invesment|investment|capital|kapital|ventura|venture|saratoga|provident)')
)
select
  r.investor_name,
  r.investor_type,
  count(*) as stakes,
  round((sum(r.stake_value) / 1e9)::numeric, 1) as book_value_idr_bn,
  string_agg(replace(r.symbol, '.JK', '') || ' ' || round(r.percentage::numeric, 2) || '%', ', ' order by r.stake_value desc nulls last) as holdings,
  (select snapshot_date from params)::text as snapshot_date,
  (select price_date from params)::text as price_date
from reg r
group by r.investor_name, r.investor_type
order by sum(r.stake_value) desc nulls last;

-- candidate: idx-bank-quarterly-income-by-source
-- every idx_financials_quarterly row for one IDX symbol from {{from_date}} on, all sources, to see
-- which basis (consolidated vs bank-only) each row carries
select q.date::text as period_end, q.source, q.interest_income, q.interest_expense,
       q.net_interest_income, q.non_interest_income, q.provision, q.net_income,
       q.total_assets, q.total_cash_and_due_from_banks, q.allowance_for_loans, q.updated_on::text as updated_on
from idx_financials_quarterly q
where q.symbol = '{{symbol}}'
  and q.date >= '{{from_date}}'
order by q.date asc, q.source asc;

-- candidate: idx-bank-quarterly-sheet-metrics
-- raw jsonb income-statement and balance-sheet metrics from idx_financial_sheets_quarterly for one IDX
-- symbol from {{from_date}} on, to see whether earning assets (the NIM denominator) are carried
select s.date::text as period_end, s.currency, s.income_stmt_metrics, s.balance_sheet_metrics
from idx_financial_sheets_quarterly s
where s.symbol = '{{symbol}}'
  and s.date >= '{{from_date}}'
order by s.date asc;

-- candidate: idx-broker-flow-for-symbol
-- name:         idx-broker-flow-for-symbol
-- computes:     per-broker buy value, sell value and net value for one IDX symbol over a window,
--               with broker name and cohort, to see which brokers sat on each side of a block
-- universe:     a single IDX symbol, {{symbol}}, rows in idx_broker_summary_daily
-- window:       parameterised, {{start}} to {{end}}, inclusive both ends
-- exclusions:   none; brokers with zero buy and zero sell value in the window do not appear
-- survivorship: not applicable, single symbol, point-in-time
-- statistic:    raw sums per broker, no averaging
-- note:         symbols carry the .JK suffix, e.g. 'PEGE.JK'
select b.broker_code, r.broker_name, r.cohort,
       sum(b.bval) as buy_val, sum(b.sval) as sell_val, sum(b.nval) as net_val
from idx_broker_summary_daily b
left join idx_broker_registry r using (broker_code)
where b.symbol = '{{symbol}}' and b.date between '{{start}}' and '{{end}}'
group by b.broker_code, r.broker_name, r.cohort
order by sum(b.nval) desc;

-- name:         sgx-shareholders-for-symbol
-- returns:      symbol, name, is_active, market and the raw shareholders jsonb for one SGX counter
-- universe:     the single symbol {{symbol}} in sgx_companies, as stored (no suffix assumed)
-- exclusions:   none; shareholders returned as stored, so the caller sees the real shape and any nulls
-- note:         candidate, staged 2026-10-05, awaiting user confirmation
SELECT symbol, name, is_active, market, shareholders
FROM sgx_companies
WHERE symbol = 'C09.SI'

-- name:         idx-manual-input-recent-breakdowns
-- returns:      symbol, financial_year, updated_on, industry_breakdown and sankey_component jsonb for the most recently updated idx_manual_input rows
-- universe:     idx_manual_input rows with updated_on in the last 14 days
-- exclusions:   rows where both industry_breakdown and sankey_component are null
-- note:         candidate, staged 2026-10-12, awaiting user confirmation
SELECT symbol, financial_year, updated_on, industry_breakdown, sankey_component
FROM idx_manual_input
WHERE updated_on >= now() - interval '14 days'
  AND (industry_breakdown IS NOT NULL OR sankey_component IS NOT NULL)
ORDER BY updated_on DESC, symbol, financial_year DESC

-- name:         idx-manual-input-prior-year-sankey
-- returns:      symbol, financial_year, sankey_component for FY2024 and FY2023 of every symbol that has an idx_manual_input row updated in the last 14 days
-- universe:     idx_manual_input, symbols with a row updated_on in the last 14 days, financial_year 2023 and 2024
-- exclusions:   rows with null sankey_component
-- note:         candidate, staged 2026-10-12, awaiting user confirmation
SELECT symbol, financial_year, sankey_component
FROM idx_manual_input
WHERE financial_year IN (2023, 2024)
  AND sankey_component IS NOT NULL
  AND symbol IN (SELECT symbol FROM idx_manual_input WHERE updated_on >= now() - interval '14 days')
ORDER BY symbol, financial_year

-- name:         idx-quarterly-income-stmt-for-symbol
-- computes:     one IDX symbol's quarterly income statement metrics (jsonb as stored, incl. revenue
--               breakdown keys and cumulative figures) from {{from_date}} on, with reporting currency
-- universe:     a single IDX symbol, {{symbol}}, rows in idx_financial_sheets_quarterly
-- window:       parameterised, date >= {{from_date}}
-- exclusions:   none; rows returned as stored so the caller sees real keys and nulls
-- note:         candidate, staged 2026-10-12, awaiting user confirmation
SELECT s.date::text AS period_end, s.currency, s.income_stmt_metrics, s.income_stmt_metrics_cumulative
FROM idx_financial_sheets_quarterly s
WHERE s.symbol = 'AMMN.JK'
  AND s.date >= '2025-03-31'
ORDER BY s.date ASC

-- name:         idx-news-issues-by-date-range
-- computes:     one row per published IDX daily news issue in a range: issue_date, lead headline and blurb, story counts per section, flash count
-- universe:     news_issue rows with market_type = 'idx'
-- window:       parameterised, issue_date between {{start_date}} and {{end_date}}
-- exclusions:   none; every stored issue in the window is returned
-- note:         candidate, staged 2026-10-13, awaiting user confirmation
SELECT issue_date::text AS issue_date,
       lead->>'headline' AS lead_headline,
       lead->>'blurb' AS lead_blurb,
       (SELECT count(*) FROM jsonb_each(sections) s, jsonb_array_elements(s.value)) AS section_story_count,
       jsonb_array_length(flash) AS flash_count
FROM news_issue
WHERE market_type = 'idx'
  AND issue_date BETWEEN '2026-09-01' AND '2026-10-13'
ORDER BY issue_date ASC

-- name:         idx-news-issue-by-date
-- computes:     the full stored IDX daily news issue for one date: lead, sections, flash, what_to_watch jsonb as stored
-- universe:     news_issue rows with market_type = 'idx'
-- window:       single issue_date, {{issue_date}}
-- exclusions:   none; row returned as stored
-- note:         candidate, staged 2026-10-13, awaiting user confirmation
SELECT issue_date::text AS issue_date, lead, sections, flash, what_to_watch
FROM news_issue
WHERE market_type = 'idx'
  AND issue_date = '2026-10-12'

-- name:         idx-news-tagged-to-symbol
-- computes:     every IDX news article tagged to one symbol inside a date window, oldest first: id, title, source, sector, publish date
-- universe:     one symbol, {{symbol}} (with .JK suffix), rows in idx_news whose symbols array contains it
-- window:       parameterised, timestamp >= {{start_date}} and < {{end_date}} (end exclusive)
-- exclusions:   none; every tagged article in the window is returned
-- note:         candidate, staged 2026-10-13, awaiting user confirmation
select n.id, n.title, n.source, n.sector, n.timestamp::date::text as published_on
from idx_news n
where 'ZONE.JK' = any(n.symbols)
  and n.timestamp >= '2026-10-05'
  and n.timestamp < '2026-10-12'
order by n.timestamp asc, n.id asc

-- name:         idx-news-issue-stories-by-date-range
-- computes:     one row per section story across published IDX daily issues in a range: issue_date, section key, headline, tickers, first article's source host and id, supporting article count (flash and lead excluded)
-- universe:     news_issue rows with market_type = 'idx'
-- window:       parameterised, issue_date >= {{start_date}} and < {{end_date}} (end exclusive)
-- exclusions:   lead and flash are not returned; blurbs and thumbnails are not returned
-- note:         candidate, staged 2026-10-13, awaiting user confirmation
select i.issue_date::text as issue_date,
       s.key as section,
       st.ord as position,
       st.value->>'headline' as headline,
       st.value->'tickers' as tickers,
       substring(st.value->'supporting_news'->0->>'source' from '://(?:www\.)?([^/]+)') as source_host,
       st.value->'supporting_news'->0->>'id' as first_article_id,
       jsonb_array_length(st.value->'supporting_news') as article_count
from news_issue i,
     jsonb_each(i.sections) s,
     jsonb_array_elements(s.value) with ordinality as st(value, ord)
where i.market_type = 'idx'
  and i.issue_date >= '2026-09-28'
  and i.issue_date < '2026-10-12'
order by i.issue_date asc, s.key asc, st.ord asc

-- candidate: upcoming-corporate-events-by-date-range
-- shareholder meetings (idx_agm, sgx_agm), IPO calendar (idx_ipo_details) and stock splits
-- (idx_stock_split) with an event date inside {{start_date}} to {{end_date}}, one row per event
select 'AGM' as kind, 'IDX' as market, a.symbol, c.company_name, a.agm_date::text as event_date,
       a.agm_time::text as detail, a.agm_place as place, a.recording_date::text as secondary_date
from idx_agm a left join idx_company_profile c on c.symbol = a.symbol
where a.agm_date between '{{start_date}}' and '{{end_date}}'
union all
select coalesce(g.meeting_type, 'AGM'), 'SGX', g.symbol, s.name, g.agm_date::text, g.agm_time::text, g.agm_place, g.recording_date::text
from sgx_agm g left join sgx_companies s on s.symbol = g.symbol
where g.agm_date between '{{start_date}}' and '{{end_date}}'
union all
select 'IPO', 'IDX', i.symbol, i.company_name, i.listing_date::text, i.offering_price::text, null, i.offering_start_date::text
from idx_ipo_details i
where i.listing_date between '{{start_date}}' and '{{end_date}}'
union all
select 'SPLIT', 'IDX', p.symbol, c.company_name, p.date::text, p.ratio, null, p.cum_date::text
from idx_stock_split p left join idx_company_profile c on c.symbol = p.symbol
where p.date between '{{start_date}}' and '{{end_date}}'
order by event_date, kind, symbol;

-- candidate: idx-last-close-market-snapshot
-- index moves, breadth, total market cap and top movers for the latest trading day against the one before it
with ld as (select max(date) as d from index_daily_data),
pd as (select max(date) as p from index_daily_data where date < (select d from ld)),
sd as (select max(date) as d from idx_daily_data),
sp as (select max(date) as p from idx_daily_data where date < (select d from sd)),
m as (
  select t.symbol, c.company_name, t.close::float8 as close, y.close::float8 as prev, t.market_cap::float8 as mcap, y.market_cap::float8 as prev_mcap, t.value::float8 as value,
         ((t.close::float8 / nullif(y.close::float8, 0) - 1) * 100)::float8 as pct
  from idx_daily_data t
  join idx_daily_data y on y.symbol = t.symbol and y.date = (select p from sp)
  left join idx_company_profile c on c.symbol = t.symbol
  where t.date = (select d from sd) and t.volume > 0 and y.close > 0 and t.market_cap >= {{min_mcap}}
)
select 'index' as kind, i.index_code as symbol, i.index_name as name, i.price::float8 as close, pi.price::float8 as prev,
       round(((i.price::float8 / nullif(pi.price::float8, 0) - 1) * 100)::numeric, 2)::float8 as pct, null::float8 as mcap, null::float8 as value, i.date::text as as_of
from index_daily_data i join index_daily_data pi on pi.index_code = i.index_code and pi.date = (select p from pd)
where i.date = (select d from ld)
union all
select 'breadth', 'up', null, count(*) filter (where pct > 0)::float8, count(*) filter (where pct < 0)::float8, null, sum(mcap), sum(prev_mcap), (select d from sd)::text from m
union all
(select 'gainer', symbol, company_name, close, prev, round(pct::numeric, 2)::float8, mcap, value, (select d from sd)::text from m order by pct desc limit 5)
union all
(select 'loser', symbol, company_name, close, prev, round(pct::numeric, 2)::float8, mcap, value, (select d from sd)::text from m order by pct asc limit 5)
union all
(select 'active', symbol, company_name, close, prev, round(pct::numeric, 2)::float8, mcap, value, (select d from sd)::text from m order by value desc limit 5);

-- candidate: idx-latest-filings
-- the most recent {{n}} insider / major-holder filings across all IDX symbols, as filed
select f.timestamp::text as filed_at, f.symbol, c.company_name, f.holder_name, f.holder_type, f.transaction_type,
       f.amount_transaction, f.price, f.transaction_value, f.share_percentage_before, f.share_percentage_after
from idx_filings f left join idx_company_profile c on c.symbol = f.symbol
order by f.timestamp desc, f.id desc
limit {{n}};

-- candidate: idx-window-movers-with-foreign-flow
-- name:         idx-window-movers-with-foreign-flow
-- computes:     the top {{n}} gainers and top {{n}} losers by close-to-close return over a window, each with
--               traded value and exchange-definition net foreign flow over the same flow window
-- universe:     IDX symbols in idx_daily_data with a close on {{end}}, a close above zero on {{base_date}},
--               market cap on {{end}} of at least {{min_mcap}} IDR (0 for no floor) and summed traded value
--               over the flow window of at least {{min_turnover}} IDR (use 1 to drop only zero-volume names)
-- window:       return is the {{end}} close against the {{base_date}} close, base_date being the last close
--               before the flow window; flow and traded value sum {{start}} to {{end}}, inclusive both ends
-- exclusions:   symbols without a close on both dates; symbols under the floors. A symbol halted on base_date
--               carries its last traded price, so its return is measured from the halted price (BIKE,
--               2026-10-07, 1,505 with zero volume since 2026-10-05), say so wherever it is shown
-- survivorship: point-in-time within the window only; names delisted before {{end}} drop out, which flatters
--               the loser side by omission
-- statistic:    simple close-to-close return in percent; net foreign flow as sum over days of
--               (foreign_buy_volume - foreign_sell_volume) * close, the exchange definition, same as
--               foreign-flow-range; traded value as sum of idx_daily_data.value; universe size returned
--               alongside, plus days_active per symbol as the sample size
-- note:         symbols carry the .JK suffix. Rows are a ranked top and bottom list, not a screen of
--               every symbol; widen {{n}} rather than editing the query
with a as (
  select symbol, close::float8 as close_end, market_cap::float8 as mcap
  from idx_daily_data where date = '{{end}}'
),
b as (
  select symbol, close::float8 as close_base
  from idx_daily_data where date = '{{base_date}}'
),
w as (
  select symbol,
         sum(value)::float8 as traded_value,
         sum((foreign_buy_volume - foreign_sell_volume) * close)::float8 as net_foreign_flow,
         count(distinct date) as days_active
  from idx_daily_data
  where date between '{{start}}' and '{{end}}'
  group by symbol
),
m as (
  select a.symbol, c.company_name,
         round(((a.close_end / nullif(b.close_base, 0) - 1) * 100)::numeric, 1)::float8 as return_pct,
         b.close_base, a.close_end, a.mcap, w.traded_value, w.net_foreign_flow, w.days_active
  from a
  join b using (symbol)
  join w using (symbol)
  left join idx_company_profile c on c.symbol = a.symbol
  where b.close_base > 0 and a.mcap >= {{min_mcap}} and w.traded_value >= {{min_turnover}}
)
(select 'gain' as kind, m.*, (select count(*) from m) as symbols_in_universe from m order by return_pct desc limit {{n}})
union all
(select 'lose', m.*, (select count(*) from m) from m order by return_pct asc limit {{n}});

-- CANDIDATE sgx-reit-property-valuation-vs-cost-by-year (staging, not approved)
-- per REIT and financial year: properties carrying both purchase_price and market_valuation,
-- summed cost vs summed valuation, plus average holding age at the valuation date.
select symbol, financial_year,
       count(*) as n_props,
       sum(purchase_price) as cost,
       sum(market_valuation) as valuation,
       round((sum(market_valuation)::numeric / nullif(sum(purchase_price), 0) - 1) * 100, 1) as uplift_pct,
       round(avg((valuation_date - purchase_date) / 365.25)::numeric, 1) as avg_hold_yrs
from sgx_reit_property
where purchase_price > 0 and market_valuation > 0
  and purchase_date is not null and valuation_date is not null
group by symbol, financial_year
order by symbol, financial_year;

-- CANDIDATE sgx-reit-property-uplift-by-country-category-hold (staging, not approved)
-- latest FY (2025) per-property uplift, grouped by country, category and holding-age bucket.
-- median per-property uplift avoids mixing currencies in summed amounts.
with p as (
  select country, category,
         (valuation_date - purchase_date) / 365.25 as hold_yrs,
         market_valuation::numeric / purchase_price - 1 as uplift
  from sgx_reit_property
  where financial_year = 2025
    and purchase_price > 0 and market_valuation > 0
    and purchase_date is not null and valuation_date is not null
)
select 'country' as dim, country as grp, count(*) as n,
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1) as median_uplift_pct,
       round((avg(uplift) * 100)::numeric, 1) as mean_uplift_pct,
       round(avg(hold_yrs)::numeric, 1) as avg_hold_yrs
from p group by country
union all
select 'category', category, count(*),
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1),
       round((avg(uplift) * 100)::numeric, 1),
       round(avg(hold_yrs)::numeric, 1)
from p group by category
union all
select 'hold_bucket',
       case when hold_yrs < 3 then '1: <3y' when hold_yrs < 7 then '2: 3-7y'
            when hold_yrs < 12 then '3: 7-12y' else '4: 12y+' end,
       count(*),
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1),
       round((avg(uplift) * 100)::numeric, 1),
       round(avg(hold_yrs)::numeric, 1)
from p group by 2
order by 1, 2;

-- CANDIDATE sgx-reit-indonesia-assets-by-reit (staging, not approved)
select symbol, count(*) as n, round(avg((valuation_date - purchase_date) / 365.25)::numeric, 1) as avg_hold_yrs,
       round((percentile_cont(0.5) within group (order by market_valuation::numeric / purchase_price - 1) * 100)::numeric, 1) as median_uplift_pct,
       round(((sum(market_valuation)::numeric / sum(purchase_price) - 1) * 100), 1) as agg_uplift_pct,
       sum(purchase_price) as cost, sum(market_valuation) as valuation, sum(net_property_income) as npi,
       string_agg(distinct category, ', ') as categories
from sgx_reit_property
where financial_year = 2025 and country = 'Indonesia'
  and purchase_price > 0 and market_valuation > 0 and purchase_date is not null and valuation_date is not null
group by symbol order by n desc;

-- CANDIDATE sgx-reit-like-for-like-revaluation-fy24-fy25 (staging, not approved)
select a.category, count(*) as n,
       round((percentile_cont(0.5) within group (order by b.market_valuation::numeric / a.market_valuation - 1) * 100)::numeric, 1) as median_chg_pct,
       round(((sum(b.market_valuation)::numeric / sum(a.market_valuation) - 1) * 100), 1) as agg_chg_pct,
       count(*) filter (where b.market_valuation > a.market_valuation) as n_up,
       count(*) filter (where b.market_valuation < a.market_valuation) as n_down
from sgx_reit_property a
join sgx_reit_property b on b.symbol = a.symbol and b.property_name = a.property_name and b.financial_year = 2025
where a.financial_year = 2024 and a.market_valuation > 0 and b.market_valuation > 0
group by a.category order by n desc;

-- CANDIDATE sgx-reit-transactions-vs-basis (staging, not approved)
select transaction_type, basis, financial_year, count(*) as n,
       count(*) filter (where basis_value > 0 and transaction_price > 0) as n_comparable,
       round((percentile_cont(0.5) within group (order by transaction_price::numeric / basis_value - 1) filter (where basis_value > 0 and transaction_price > 0) * 100)::numeric, 1) as median_vs_basis_pct
from sgx_reit_property_transaction
group by transaction_type, basis, financial_year order by transaction_type, basis, financial_year;

-- CANDIDATE sgx-reit-divestments-named-examples (staging, not approved)
with d as (
  select t.symbol, c.name, t.property_name, t.completed_date, t.financial_year, t.basis,
         t.transaction_price, t.basis_value,
         round((t.transaction_price::numeric / t.basis_value - 1) * 100, 1) as premium_pct
  from sgx_reit_property_transaction t
  join sgx_companies c on c.symbol = t.symbol
  where t.transaction_type = 'divestment' and t.basis = 'valuation'
    and t.basis_value > 0 and t.transaction_price > 0 and t.financial_year between 2023 and 2025
)
(select 'largest' as kind, d.* from d order by transaction_price desc limit 6)
union all
(select 'highest_premium', d.* from d order by premium_pct desc limit 6);

-- CANDIDATE sgx-reit-uplift-by-category-and-hold-bucket (staging, not approved)
with p as (
  select category, (valuation_date - purchase_date) / 365.25 as hold_yrs,
         market_valuation::numeric / purchase_price - 1 as uplift
  from sgx_reit_property
  where financial_year = 2025 and purchase_price > 0 and market_valuation > 0
    and purchase_date is not null and valuation_date is not null
)
select category,
       case when hold_yrs < 5 then '1: <5y' when hold_yrs < 10 then '2: 5-10y' else '3: 10y+' end as hold_bucket,
       count(*) as n,
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1) as median_uplift_pct
from p group by 1, 2 order by 1, 2;

-- CANDIDATE sgx-reit-largest-sales-currency (staging, not approved)
select symbol, currency from sgx_companies where symbol in ('N2IU.SI','ME8U.SI','J69U.SI','HMN.SI','BTOU.SI','BUOU.SI');

-- CANDIDATE sgx-reit-industrial-divestments-realised-gain (staging, not approved)
with prop as (
  select distinct on (symbol, property_name) symbol, property_name, category, purchase_price, purchase_date, country
  from sgx_reit_property
  where purchase_price > 0
  order by symbol, property_name, financial_year desc
)
select t.symbol, c.name, count(*) as n_sales,
       sum(t.transaction_price) as sale_total, sum(p.purchase_price) as cost_total,
       round(((sum(t.transaction_price)::numeric / sum(p.purchase_price) - 1) * 100), 1) as gain_pct,
       round((percentile_cont(0.5) within group (order by t.transaction_price::numeric / p.purchase_price - 1) * 100)::numeric, 1) as median_gain_pct,
       string_agg(distinct p.country, ', ') as countries
from sgx_reit_property_transaction t
join prop p on p.symbol = t.symbol and p.property_name = t.property_name
join sgx_companies c on c.symbol = t.symbol
where t.transaction_type = 'divestment' and t.transaction_price > 0 and p.category = 'Industrial & Logistics'
group by t.symbol, c.name order by n_sales desc;

-- CANDIDATE sgx-reit-industrial-divestments-detail (staging, not approved)
with prop as (
  select distinct on (symbol, property_name) symbol, property_name, category, purchase_price, purchase_date, country, financial_year as pfy
  from sgx_reit_property where purchase_price > 0
  order by symbol, property_name, financial_year desc
)
select t.symbol, t.property_name, p.country, p.purchase_date, t.completed_date, p.purchase_price, t.transaction_price,
       round((t.transaction_price::numeric / p.purchase_price - 1) * 100, 1) as gain_pct
from sgx_reit_property_transaction t
join prop p on p.symbol = t.symbol and p.property_name = t.property_name
where t.transaction_type = 'divestment' and t.transaction_price > 0 and p.category = 'Industrial & Logistics'
  and t.symbol in ('M44U.SI','A17U.SI')
order by t.symbol, gain_pct desc;

-- CANDIDATE sgx-reit-property-coverage-by-financial-year (staging, not approved)
select symbol, max(financial_year) as latest_fy,
       count(*) filter (where financial_year = 2025) as n_fy2025,
       count(*) filter (where financial_year = 2024) as n_fy2024,
       count(*) filter (where financial_year = 2025 and category = 'Industrial & Logistics' and purchase_price > 0 and market_valuation > 0 and purchase_date is not null and valuation_date is not null) as n_ind_used_fy2025
from sgx_reit_property group by symbol order by n_ind_used_fy2025 desc, symbol;

-- CANDIDATE sgx-reit-uplift-latest-usable-year-by-category-hold (staging, not approved)
with usable as (
  select symbol, category, financial_year,
         (valuation_date - purchase_date) / 365.25 as hold_yrs,
         market_valuation::numeric / purchase_price - 1 as uplift
  from sgx_reit_property
  where purchase_price > 0 and market_valuation > 0 and purchase_date is not null and valuation_date is not null
), latest as (select symbol, max(financial_year) as fy from usable group by symbol),
p as (select u.* from usable u join latest l on l.symbol = u.symbol and l.fy = u.financial_year)
select category,
       case when hold_yrs is null then 'all' when hold_yrs < 5 then '1: <5y' when hold_yrs < 10 then '2: 5-10y' else '3: 10y+' end as hold_bucket,
       count(*) as n, count(distinct symbol) as n_reits,
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1) as median_uplift_pct
from (select category, hold_yrs, symbol, uplift from p union all select category, null, symbol, uplift from p) x
group by 1, 2 order by 1, 2;

-- CANDIDATE sgx-reit-industrial-divestments-detail-small-reits (staging, not approved)
with prop as (
  select distinct on (symbol, property_name) symbol, property_name, category, purchase_price, purchase_date, country
  from sgx_reit_property where purchase_price > 0
  order by symbol, property_name, financial_year desc
)
select t.symbol, t.property_name, p.country, p.purchase_date, t.completed_date, p.purchase_price, t.transaction_price, t.basis, t.basis_value
from sgx_reit_property_transaction t
join prop p on p.symbol = t.symbol and p.property_name = t.property_name
where t.transaction_type = 'divestment' and t.transaction_price > 0 and p.category = 'Industrial & Logistics'
  and t.symbol in ('9A4U.SI','O5RU.SI','SET.SI')
order by t.symbol, t.completed_date;

-- CANDIDATE conglomerate-member-shareholder-registers (staging, not approved)
-- name:         conglomerate-member-shareholder-registers
-- computes:     for every conglomerate and every symbol in its symbols array, the stored
--               shareholder register of that symbol, so each group-to-ticker link can be
--               checked against who actually holds the shares
-- universe:     conglomerates.symbols unnested; IDX names from the latest
--               idx_one_percent_ownership snapshot, SGX names from sgx_companies.shareholders
-- window:       IDX latest register snapshot; SGX as stored, no snapshot date
-- exclusions:   none; a symbol with no register returns one row with null holder, so gaps show
-- survivorship: point-in-time, current registers only
-- statistic:    raw holder rows, holder_pct in percent for both markets
with members as (
  select c.name as conglomerate, c.slug, unnest(c.symbols) as symbol from conglomerates c
),
snap as (select max(date) as d from idx_one_percent_ownership),
idx as (
  select o.symbol, o.investor_name as holder, o.investor_type as holder_type,
         round(o.percentage::numeric, 2) as holder_pct
  from idx_one_percent_ownership o, snap where o.date = snap.d
),
sgx as (
  select c.symbol, s.value->>'name' as holder, null::text as holder_type,
         round(((s.value->>'share_percentage')::numeric * 100), 2) as holder_pct
  from sgx_companies c cross join lateral jsonb_array_elements(c.shareholders) s(value)
),
regs as (select * from idx union all select * from sgx)
select m.conglomerate, m.slug, m.symbol, r.holder, r.holder_type, r.holder_pct
from members m left join regs r on r.symbol = m.symbol
order by m.conglomerate, m.symbol, r.holder_pct desc nulls last;

-- name:         people-member-evidence
-- computes:     for every person in the people table and every symbol in their symbols
--               array, the evidence that ties them: the symbol's stored register holders,
--               its board (IDX commissioners and directors, SGX management), and insider
--               filings on that symbol tagged to the person's slug or filed under a holder
--               name containing the person's name, so each person-to-ticker link can be
--               checked against shares, seats and filings
-- universe:     people.symbols unnested; IDX register from the latest
--               idx_one_percent_ownership snapshot, SGX register from sgx_companies.shareholders
-- window:       IDX latest register snapshot; SGX and boards as stored; filings full history
-- exclusions:   none; a symbol with no register or board returns nulls, so gaps show
-- survivorship: point-in-time, current registers and boards only
-- statistic:    one row per person and symbol; holders as 'name (pct%)' joined by ' | ',
--               board names joined by ' | ', filings counted
with members as (
  select p.investor_name as person, p.slug, p."group" as person_group, unnest(p.symbols) as symbol
  from people p
  where p.symbols is not null and array_length(p.symbols, 1) > 0
),
snap as (select max(date) as d from idx_one_percent_ownership),
regs as (
  select o.symbol, o.investor_name as holder, round(o.percentage::numeric, 2) as pct
  from idx_one_percent_ownership o, snap where o.date = snap.d
  union all
  select c.symbol, s.value->>'name', round(((s.value->>'share_percentage')::numeric * 100), 2)
  from sgx_companies c cross join lateral jsonb_array_elements(c.shareholders) s(value)
  where jsonb_typeof(c.shareholders) = 'array'
),
reg_agg as (
  select symbol, string_agg(holder || ' (' || pct || '%)', ' | ' order by pct desc nulls last) as register_holders
  from regs group by symbol
),
board as (
  select p.symbol, x->>'name' as name
  from idx_company_profile p, lateral jsonb_array_elements(p.commissioners) x
  where jsonb_typeof(p.commissioners) = 'array'
  union all
  select p.symbol, x->>'name'
  from idx_company_profile p, lateral jsonb_array_elements(p.directors) x
  where jsonb_typeof(p.directors) = 'array'
  union all
  select c.symbol, coalesce(x->>'name', x #>> '{}')
  from sgx_companies c, lateral jsonb_array_elements(c.management) x
  where jsonb_typeof(c.management) = 'array'
),
board_agg as (
  select symbol, string_agg(distinct name, ' | ') as board_names from board
  where name is not null and length(trim(name)) > 3 group by symbol
),
filings as (
  select m.slug, m.symbol, count(f.*) as filings_matched,
         string_agg(distinct f.holder_name, ' | ') as filing_holders
  from members m
  join (
    select symbol, holder_name, idx_investor_slug from idx_filings
    union all
    select symbol, holder_name, null from sgx_filings
  ) f on f.symbol = m.symbol
     and (f.idx_investor_slug = m.slug or f.holder_name ilike '%' || m.person || '%')
  group by m.slug, m.symbol
)
select m.person, m.slug, m.person_group, m.symbol,
       r.register_holders, b.board_names,
       coalesce(f.filings_matched, 0) as filings_matched, f.filing_holders
from members m
left join reg_agg r on r.symbol = m.symbol
left join board_agg b on b.symbol = m.symbol
left join filings f on f.slug = m.slug and f.symbol = m.symbol
order by m.person, m.symbol;

-- name:         idx-register-band-holdings-by-symbol
-- computes:     per IDX company, the share of issued shares held by register entries in the
--               1% to 5% band and at 5% or more, with entry counts, the individual-holder
--               share of the 1% to 5% band, and latest market cap, so a caller can deduct the
--               1% to 5% band from the exchange-reported free float
-- universe:     every symbol on the latest idx_one_percent_ownership snapshot
-- window:       latest register snapshot; latest price within 14 days of the last trading date
-- exclusions:   none; symbols without a price return a null market cap
-- survivorship: point-in-time, the register snapshot is taken as filed
-- statistic:    sums and counts per symbol; sample size is the row count
-- approved:     <pending>
-- used by:      free-float-on-the-idx (ownership series part 3)
with snap as (
  select max(date) as snapshot_date from idx_one_percent_ownership
),
px as (
  select max(date) as last_date from idx_daily_data
),
mc as (
  select distinct on (d.symbol) d.symbol, d.market_cap
  from idx_daily_data d, px
  where d.date between px.last_date - 14 and px.last_date
  order by d.symbol, d.date desc
)
select
  o.symbol,
  count(*) as entries_all,
  count(*) filter (where o.percentage >= 1 and o.percentage < 5) as entries_1_to_5,
  round(coalesce(sum(o.percentage) filter (where o.percentage >= 1 and o.percentage < 5), 0)::numeric, 2) as pct_1_to_5,
  round(coalesce(sum(o.percentage) filter (where o.percentage >= 1 and o.percentage < 5 and o.investor_type = 'Individual'), 0)::numeric, 2) as pct_1_to_5_individual,
  round(coalesce(sum(o.percentage) filter (where o.percentage >= 5), 0)::numeric, 2) as pct_5_plus,
  m.market_cap,
  (select snapshot_date from snap) as snapshot_date
from idx_one_percent_ownership o
join snap on o.date = snap.snapshot_date
left join mc m on m.symbol = o.symbol
group by o.symbol, m.market_cap
order by o.symbol;

-- name:         people-member-register-history
-- computes:     for every person in the people table and every symbol in their symbols
--               array, the person's own-name history on that symbol's IDX 1% register
--               across all snapshots: first and last snapshot where a holder name
--               contains the person's name, the percentage at the last such snapshot,
--               and the register's latest snapshot date, so a person who sold out can
--               be told apart from one who never appeared
-- universe:     people.symbols unnested, IDX symbols only (.JK)
-- window:       full idx_one_percent_ownership history
-- exclusions:   SGX symbols (no register history stored); name match is ilike on the
--               full person name, so vehicles and spelling variants do not match
-- survivorship: point-in-time snapshots as filed
-- statistic:    one row per person and symbol, nulls where the name never appeared
with members as (
  select p.investor_name as person, p.slug, unnest(p.symbols) as symbol
  from people p
  where p.symbols is not null and array_length(p.symbols, 1) > 0
),
hits as (
  select m.slug, m.symbol, o.date, o.investor_name, o.percentage
  from members m
  join idx_one_percent_ownership o
    on o.symbol = m.symbol and o.investor_name ilike '%' || m.person || '%'
),
agg as (
  select slug, symbol, min(date) as first_seen, max(date) as last_seen
  from hits group by slug, symbol
)
select m.person, m.slug, m.symbol, a.first_seen::text, a.last_seen::text,
       (select round(h.percentage::numeric, 2) from hits h
         where h.slug = m.slug and h.symbol = m.symbol and h.date = a.last_seen
         order by h.percentage desc limit 1) as pct_at_last_seen,
       (select max(date) from idx_one_percent_ownership)::text as latest_snapshot
from members m
left join agg a on a.slug = m.slug and a.symbol = m.symbol
where m.symbol like '%.JK'
order by m.person, m.symbol;

-- name:         people-dropped-off-symbol-filings
-- computes:     for every person-symbol pair in the people table where the person's own
--               name appeared on the IDX 1% register in an earlier snapshot but not in the
--               latest one, every insider filing on that symbol filed from {{since}} onward,
--               whoever the filer, so a sale by the person (under any spelling) or the
--               counterparty's purchase can be found
-- universe:     people.symbols unnested, IDX only; dropped-off defined as max matching
--               snapshot < latest snapshot
-- window:       register full history; filings timestamp >= {{since}}
-- exclusions:   pairs never on the register; pairs still on the latest snapshot
-- survivorship: point-in-time snapshots and filings as filed
-- statistic:    raw rows, one per pair and filing; pairs with no filing return one row
--               with null filing columns
with members as (
  select p.investor_name as person, p.slug, unnest(p.symbols) as symbol
  from people p
  where p.symbols is not null and array_length(p.symbols, 1) > 0
),
latest as (select max(date) as d from idx_one_percent_ownership),
hits as (
  select m.person, m.slug, m.symbol, o.date, o.percentage
  from members m
  join idx_one_percent_ownership o
    on o.symbol = m.symbol and o.investor_name ilike '%' || m.person || '%'
),
dropped as (
  select person, slug, symbol, max(date) as last_seen,
         (array_agg(round(percentage::numeric, 2) order by date desc))[1] as pct_at_last_seen
  from hits group by person, slug, symbol
  having max(date) < (select d from latest)
)
select d.person, d.symbol, d.last_seen::text, d.pct_at_last_seen,
       f.timestamp::text as filed_at, f.holder_name, f.transaction_type,
       f.amount_transaction, f.share_percentage_before, f.share_percentage_after,
       f.source
from dropped d
left join idx_filings f on f.symbol = d.symbol and f.timestamp >= '{{since}}'
order by d.person, d.symbol, f.timestamp;
