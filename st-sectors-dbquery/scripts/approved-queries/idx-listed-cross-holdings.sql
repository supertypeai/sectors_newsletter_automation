-- idx-listed-cross-holdings.sql
--
-- Builds the IDX listed-to-listed ownership edge set from the monthly 1% shareholder
-- register, then returns the aggregates the cross-holding piece reports.
--
-- An "edge" is a disclosed holding where the named investor in
-- idx_one_percent_ownership resolves, by normalised legal name, to another company
-- listed on the IDX and still trading. Self-loops are dropped: the register sometimes
-- names a company's own parent in a form that normalises onto the company itself
-- (verified 2026-07-31 on UNVR, where the vendor-supplied investor_symbol also
-- self-references), and a company cannot hold itself.
--
-- Name matching rather than the vendor investor_symbol column is deliberate. That
-- column stopped populating after the 2026-04-30 snapshot (0 non-null rows in May,
-- June and July 2026) and carried at least two mis-resolutions in April, so it is used
-- only as a cross-check in audit.md, never as the join key.
--
-- Params: :snapshot_date (a date present in idx_one_percent_ownership),
--         :price_from, :price_to (window for the market-cap snapshot).
-- Defaults below are the 2026-08-07 publication run.

with params as (
  select
    date '2026-07-31' as snapshot_date,
    date '2026-07-25' as price_from,
    date '2026-07-31' as price_to
),

-- normalised legal name, both sides of the join: strip the PT prefix, the Tbk suffix
-- and the (Persero) marker, then case-fold.
normalise as (
  select
    p.symbol,
    p.company_name,
    upper(regexp_replace(
      regexp_replace(p.company_name, '^(PT\.?|P\.T\.)\s+', '', 'i'),
      '[\s,]+(TBK\.?|\(PERSERO\)\s*TBK\.?|\(PERSERO\))$', '', 'i')) as name_key
  from idx_company_profile p
  where p.delisting_date is null
),

register as (
  select
    o.symbol,
    o.investor_name,
    o.percentage,
    o.investor_type,
    o.investor_classification,
    upper(regexp_replace(
      regexp_replace(o.investor_name, '^(PT\.?|P\.T\.)\s+', '', 'i'),
      '[\s,]+(TBK\.?|\(PERSERO\)\s*TBK\.?|\(PERSERO\))$', '', 'i')) as name_key
  from idx_one_percent_ownership o, params
  where o.date = params.snapshot_date
),

edges as (
  select
    n.symbol as owner_symbol,
    n.company_name as owner_name,
    r.symbol as owned_symbol,
    r.percentage
  from register r
  join normalise n on n.name_key = r.name_key
  where n.symbol <> r.symbol
),

market_cap as (
  select distinct on (d.symbol)
    d.symbol,
    d.market_cap,
    d.date
  from idx_daily_data d, params
  where d.date between params.price_from and params.price_to
  order by d.symbol, d.date desc
),

-- implied free float: the register names every holder at or above 1%, so the residual
-- after deducting holders at or above 5% is an upper bound on IDX-reportable free
-- float. It overstates float wherever an affiliate, board member or treasury line sits
-- below 5%.
implied_float as (
  select
    r.symbol,
    greatest(100 - coalesce(sum(r.percentage) filter (where r.percentage >= 5), 0), 0) as implied_float_pct
  from register r
  group by r.symbol
)

-- 1. Headline aggregates by stake-size band.
select
  'aggregate' as result_set,
  band,
  edge_count::text as metric_a,
  round((stake_value / 1e12)::numeric)::text as metric_b,
  round((stake_value / (select sum(market_cap) from market_cap) * 100)::numeric, 1)::text as metric_c,
  null as metric_d
from (
  select 'all_disclosed' as band, count(*) as edge_count,
         sum(e.percentage / 100.0 * m.market_cap) as stake_value
  from edges e join market_cap m on m.symbol = e.owned_symbol
  union all
  select 'ge_20pct', count(*), sum(e.percentage / 100.0 * m.market_cap)
  from edges e join market_cap m on m.symbol = e.owned_symbol
  where e.percentage >= 20
  union all
  select 'ge_50pct', count(*), sum(e.percentage / 100.0 * m.market_cap)
  from edges e join market_cap m on m.symbol = e.owned_symbol
  where e.percentage >= 50
) bands

union all

-- 2. The holding layer: companies holding 20% or more of another listed company,
--    their combined market value, and how many the exchange classifies as holdings.
select
  'holding_layer',
  'owners_ge_20pct',
  count(*)::text,
  round((sum(m.market_cap) / 1e12)::numeric)::text,
  round((sum(m.market_cap) / (select sum(market_cap) from market_cap) * 100)::numeric, 1)::text,
  count(*) filter (where s.sub_sector in ('Holding & Investment Companies', 'Multi-sector Holdings'))::text
from (select distinct owner_symbol from edges where percentage >= 20) o
join market_cap m on m.symbol = o.owner_symbol
join idx_company_profile p on p.symbol = o.owner_symbol
left join idx_subsector_metadata s on s.sub_sector_id = p.sub_sector_id

union all

-- 3. Structure counts: middle layers, reciprocal holdings, three-level chains.
select 'structure', 'both_owner_and_owned',
  (select count(*) from (
     select owner_symbol from edges intersect select owned_symbol from edges) t)::text,
  (select count(*) from edges a join edges b
     on a.owner_symbol = b.owned_symbol and a.owned_symbol = b.owner_symbol
     where a.owner_symbol < a.owned_symbol)::text,
  (select count(*) from edges a join edges b
     on b.owner_symbol = a.owned_symbol
     where a.percentage >= 20 and b.percentage >= 20)::text,
  null

union all

-- 4. Implied free float, cross-held cohort against the rest of the exchange.
select
  'float_cohort',
  case when has_listed_parent then 'listed_parent_ge_20pct' else 'no_listed_parent' end,
  count(*)::text,
  count(*) filter (where implied_float_pct < 15)::text,
  round(percentile_cont(0.5) within group (order by implied_float_pct)::numeric, 1)::text,
  count(*) filter (where implied_float_pct < 15 and market_cap >= 5e12)::text
from (
  select
    f.symbol,
    f.implied_float_pct,
    m.market_cap,
    exists (select 1 from edges e where e.owned_symbol = f.symbol and e.percentage >= 20) as has_listed_parent
  from implied_float f
  join market_cap m on m.symbol = f.symbol
) cohort
group by has_listed_parent;
