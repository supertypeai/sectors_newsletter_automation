-- name:         idx-register-institutional-holder-books
-- computes:     one row per institutional holder on the latest 1% register: stake
--               count, book value at the latest close, and every holding with its pct
-- universe:     latest idx_one_percent_ownership snapshot; investor_type in Pension
--               Funds, Mutual Funds, Insurance, Financial Institution, Government,
--               Foundation, Other, plus Corporate names matching investment-company
--               keywords (investama, investasi, capital, kapital, ventura, saratoga...)
-- window:       latest register snapshot, latest price date, both self-dating
-- exclusions:   Individual, Securities Company, and Corporate holders not matching the
--               keyword list; keyword match is loose, caller drops operating companies
-- survivorship: point-in-time, register as filed
-- statistic:    per-holder count and IDR bn sum; financial-institution lines include
--               custodian/nominee accounts, flag before citing
-- approved:     2026-09-29, user (confirmation prompt)
-- used by:      idx institutional portfolios list
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
