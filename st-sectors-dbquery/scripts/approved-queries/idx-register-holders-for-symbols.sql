-- name:         idx-register-holders-for-symbols
-- computes:     every 1% register entry for a named set of IDX symbols at the latest
--               register snapshot, with each holder's percentage, type, and the stake's
--               market value at the latest available price
-- universe:     the symbols passed in the symbols array, as filed on the register
-- window:       latest register snapshot, latest price date, both self-dating
-- exclusions:   none; a symbol with no register entry simply returns no rows
-- survivorship: point-in-time, the register snapshot is taken as filed
-- statistic:    per-entry percentages and values, plus a per-symbol holder count
-- approved:     2026-09-04, Evelyn
-- used by:      idx-ultimate-beneficial-ownership
with params as (
  select (select max(o.date) from idx_one_percent_ownership o) as snapshot_date,
         (select max(d.date) from idx_daily_data d) as price_date,
         array['BREN.JK','BRPT.JK','TPIA.JK','CUAN.JK','RAJA.JK','MINA.JK','UANG.JK','TRIM.JK','PALM.JK','ESSA.JK','INDF.JK','ICBP.JK','SIMP.JK','LSIP.JK'] as symbols
),
mc as (
  select distinct on (d.symbol) d.symbol, d.market_cap
  from idx_daily_data d, params p
  where d.date <= p.price_date
  order by d.symbol, d.date desc
)
select
  o.symbol,
  o.investor_name,
  o.investor_type,
  round(o.percentage::numeric, 2) as holder_pct,
  round((m.market_cap / 1e12)::numeric, 2) as symbol_mcap_idr_trillions,
  round((o.percentage / 100.0 * m.market_cap / 1e12)::numeric, 2) as stake_value_idr_trillions,
  count(*) over (partition by o.symbol) as holders_on_register,
  count(*) filter (where o.investor_type = 'Individual') over (partition by o.symbol) as individual_holders,
  p.snapshot_date,
  p.price_date
from idx_one_percent_ownership o, params p
left join lateral (select market_cap from mc where mc.symbol = o.symbol) m on true
where o.date = p.snapshot_date and o.symbol = any(p.symbols)
order by o.symbol, o.percentage desc;
