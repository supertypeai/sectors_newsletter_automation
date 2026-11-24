-- idx-holdco-stake-value-vs-market-cap.sql
--
-- For every IDX company holding 20% or more of another IDX company, compares the market
-- value of those disclosed listed stakes against the holder's own market capitalisation,
-- and reports the holder's liquidity and implied free float alongside.
--
-- The ratio is a market-price comparison, not a valuation: it uses only stakes in other
-- LISTED companies at the snapshot date and ignores unlisted subsidiaries, holding-company
-- net debt, and every other asset or liability on the holder's balance sheet. A ratio
-- above 1 therefore says the disclosed listed stakes alone carry a larger market value
-- than the holder does, and says nothing about what either is worth.
--
-- Edge construction is identical to idx-listed-cross-holdings.sql; see that file's header
-- for why the join runs on normalised legal name rather than the vendor investor_symbol.
--
-- Params: :snapshot_date, :price_from, :price_to, :min_stake_pct.

with params as (
  select
    date '2026-07-31' as snapshot_date,
    date '2026-07-01' as price_from,
    date '2026-07-31' as price_to,
    20.0 as min_stake_pct
),

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
    o.percentage,
    upper(regexp_replace(
      regexp_replace(o.investor_name, '^(PT\.?|P\.T\.)\s+', '', 'i'),
      '[\s,]+(TBK\.?|\(PERSERO\)\s*TBK\.?|\(PERSERO\))$', '', 'i')) as name_key
  from idx_one_percent_ownership o, params
  where o.date = params.snapshot_date
),

edges as (
  select n.symbol as owner_symbol, r.symbol as owned_symbol, r.percentage
  from register r
  join normalise n on n.name_key = r.name_key, params
  where n.symbol <> r.symbol
    and r.percentage >= params.min_stake_pct
),

-- one row per symbol: closing market cap at the snapshot, plus mean daily traded value
-- over the price window, which is what turns a market cap into a tradability statement.
prices as (
  select
    symbol,
    max(market_cap) filter (where rn = 1) as market_cap,
    avg(value) as avg_daily_value
  from (
    select d.symbol, d.market_cap, d.value,
           row_number() over (partition by d.symbol order by d.date desc) as rn
    from idx_daily_data d, params
    where d.date between params.price_from and params.price_to
  ) w
  group by symbol
),

implied_float as (
  select
    r.symbol,
    greatest(100 - coalesce(sum(r.percentage) filter (where r.percentage >= 5), 0), 0) as implied_float_pct
  from register r
  group by r.symbol
)

select
  e.owner_symbol,
  n.company_name,
  count(*) as listed_stakes,
  round((max(op.market_cap) / 1e12)::numeric, 2) as owner_market_cap_idr_tn,
  round((sum(e.percentage / 100.0 * sp.market_cap) / 1e12)::numeric, 2) as stake_value_idr_tn,
  round((sum(e.percentage / 100.0 * sp.market_cap) / nullif(max(op.market_cap), 0))::numeric, 2) as stake_to_market_cap,
  round(max(f.implied_float_pct)::numeric, 1) as owner_implied_float_pct,
  round((max(op.avg_daily_value) / 1e9)::numeric, 2) as owner_avg_daily_value_idr_bn,
  string_agg(e.owned_symbol || ' ' || round(e.percentage::numeric, 1) || '%', ', '
             order by e.percentage desc) as stakes
from edges e
join prices sp on sp.symbol = e.owned_symbol
join prices op on op.symbol = e.owner_symbol
join normalise n on n.symbol = e.owner_symbol
left join implied_float f on f.symbol = e.owner_symbol
group by e.owner_symbol, n.company_name
having max(op.market_cap) is not null
order by stake_to_market_cap desc nulls last;
