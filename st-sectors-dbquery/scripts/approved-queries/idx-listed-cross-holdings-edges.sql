-- name:         idx-listed-cross-holdings-edges
-- computes:     every disclosed stake (>= 1%, the register floor) one live IDX-listed
--               company holds in another, one row per edge, with stake value at the
--               latest close and per-owner totals
-- universe:     latest idx_one_percent_ownership snapshot; owners resolved by normalised
--               legal name onto idx_company_profile rows with delisting_date is null
-- window:       register = max(date) in idx_one_percent_ownership; prices = latest
--               idx_daily_data row per symbol within 14 days of the latest trading date
-- exclusions:   self-loops; holders not resolving to a live listed company
-- survivorship: point-in-time snapshot, live companies only
-- statistic:    raw edges; owner_stake_count and owner_stake_value_idr_tn per owner
-- note:         securities houses (TRIM, PANS, YULE, VICO, BMSR) appear as owners; their
--               register lines may be proprietary or nominee positions, flag before citing
-- approved:     2026-09-28, user (confirmation prompt)
-- used by:      ad-hoc cross-holding pull
with snap as (
  select max(date) as snapshot_date from idx_one_percent_ownership
),
px_date as (
  select max(date) as last_date from idx_daily_data
),
normalise as (
  select p.symbol, p.company_name,
    upper(regexp_replace(
      regexp_replace(p.company_name, '^(PT\.?|P\.T\.)\s+', '', 'i'),
      '[\s,]+(TBK\.?|\(PERSERO\)\s*TBK\.?|\(PERSERO\))$', '', 'i')) as name_key
  from idx_company_profile p
  where p.delisting_date is null
),
register as (
  select o.symbol, o.investor_name, o.percentage, o.investor_type,
    upper(regexp_replace(
      regexp_replace(o.investor_name, '^(PT\.?|P\.T\.)\s+', '', 'i'),
      '[\s,]+(TBK\.?|\(PERSERO\)\s*TBK\.?|\(PERSERO\))$', '', 'i')) as name_key
  from idx_one_percent_ownership o, snap
  where o.date = snap.snapshot_date
),
edges as (
  select n.symbol as owner_symbol, n.company_name as owner_name,
         r.symbol as owned_symbol, r.investor_name, r.investor_type, r.percentage
  from register r
  join normalise n on n.name_key = r.name_key
  where n.symbol <> r.symbol
),
market_cap as (
  select distinct on (d.symbol) d.symbol, d.market_cap, d.date
  from idx_daily_data d, px_date
  where d.date between px_date.last_date - 14 and px_date.last_date
  order by d.symbol, d.date desc
)
select
  (select snapshot_date from snap)::text as register_date,
  m.date::text as price_date,
  e.owner_symbol,
  e.owner_name,
  e.owned_symbol,
  e.investor_name as register_name,
  e.investor_type,
  round(e.percentage::numeric, 2) as stake_pct,
  round((e.percentage / 100.0 * m.market_cap / 1e12)::numeric, 3) as stake_value_idr_tn,
  round((om.market_cap / 1e12)::numeric, 2) as owner_market_cap_idr_tn,
  count(*) over (partition by e.owner_symbol) as owner_stake_count,
  round((sum(e.percentage / 100.0 * m.market_cap) over (partition by e.owner_symbol) / 1e12)::numeric, 2) as owner_stake_value_idr_tn
from edges e
left join market_cap m on m.symbol = e.owned_symbol
left join market_cap om on om.symbol = e.owner_symbol
order by owner_stake_value_idr_tn desc nulls last, e.owner_symbol, stake_value_idr_tn desc nulls last;
