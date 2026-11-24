-- name:         idx-register-value-by-investor-type
-- computes:     the IDX 1% shareholder register weighted by market value, split by
--               investor type, plus the register's own coverage of the live universe
-- universe:     IDX companies with a null delisting_date at the snapshot date
-- window:       parameterised, :snapshot_date for the register, :price_date for prices
-- exclusions:   none; every register entry with a priced symbol is retained, and the
--               count of unpriced entries is returned so the exclusion is visible
-- survivorship: point-in-time, the register snapshot is taken as filed and delisted
--               companies are not back-filled
-- statistic:    entry counts, value sums in IDR, and each type's share of both, with
--               the total entry count returned as the sample size
-- approved:     2026-09-04, Evelyn
-- used by:      idx-ultimate-beneficial-ownership
with params as (
  select (select max(o.date) from idx_one_percent_ownership o) as snapshot_date,
         (select max(d.date) from idx_daily_data d) as price_date
),
live as (
  select symbol from idx_company_profile where delisting_date is null
),
mc as (
  select distinct on (d.symbol) d.symbol, d.market_cap
  from idx_daily_data d, params p
  where d.date <= p.price_date
  order by d.symbol, d.date desc
),
reg as (
  select o.symbol, o.investor_name, o.investor_type, o.percentage
  from idx_one_percent_ownership o, params p
  where o.date = p.snapshot_date
),
valued as (
  select r.*, m.market_cap, r.percentage / 100.0 * m.market_cap as stake_value
  from reg r join mc m on m.symbol = r.symbol
)
select
  coalesce(v.investor_type, 'Unclassified') as investor_type,
  count(*) as entries,
  round((count(*) * 100.0 / sum(count(*)) over ())::numeric, 1) as entries_pct,
  round((sum(v.stake_value) / 1e12)::numeric, 0) as value_idr_trillions,
  round((sum(v.stake_value) * 100.0 / sum(sum(v.stake_value)) over ())::numeric, 1) as value_pct,
  (select count(*) from live) as companies_live,
  (select count(distinct symbol) from reg) as companies_filed,
  (select count(*) from reg) as register_rows,
  (select count(*) from reg) - (select count(*) from valued) as entries_without_price,
  (select snapshot_date from params) as snapshot_date,
  (select price_date from params) as price_date
from valued v
group by coalesce(v.investor_type, 'Unclassified')
order by sum(v.stake_value) desc;
