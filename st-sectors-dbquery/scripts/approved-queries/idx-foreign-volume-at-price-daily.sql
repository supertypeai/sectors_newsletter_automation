-- name:         idx-foreign-volume-at-price-daily
-- computes:     per-symbol, per-day foreign buy and sell volume with the price each
--               side actually transacted at, for building a foreign volume-at-price
--               profile (volume-weighted support and resistance) over a window
-- universe:     the symbols passed in {{symbols}}, no turnover floor applied
-- window:       parameterised, {{start}} to {{end}}, inclusive both ends; broker data
--               begins 2025-01-02, earlier windows return empty with no error
-- exclusions:   none; a day with no broker row for a symbol simply has no row, and
--               close is left-joined so a missing idx_daily_data row yields null close
-- survivorship: point-in-time within the window, rows as filed
-- statistic:    value-weighted average transacted price per side per day, derived as
--               value / shares; days returned per symbol are the sample size
-- approved:     2026-09-10, evelyn
-- verified:     2026-09-10 over 2026-06-11..2026-09-09 on ten symbols, 61 trading days
--               each. Derived f_buy_avg_price matched the exchange-reported
--               f_bavg_per_share (volume-weighted across brokers) to within 0.01 on
--               every symbol, confirming the 100-shares-per-lot conversion. Foreign
--               VWAP over the window: BBCA buy 6,234 sell 6,212; ASII buy 4,862 sell
--               4,869; TPIA buy 1,997 sell 2,017; DSSA buy 895 sell 895
--
-- DEFINITION NOTE: foreign is the exchange's own per-row flag (f_bval / f_blot /
-- f_sval / f_slot), the beneficial-owner definition, consistent with
-- foreign-flow-range.sql and idx-retail-vs-foreign-flow-by-symbol.sql. Never
-- idx_broker_registry.is_foreign, which measures the executing broker's domicile.
--
-- Lots convert to shares at 100 shares per lot. f_buy_avg_price is derived as value
-- over shares rather than read from f_bavg_per_share, because the derived figure
-- aggregates correctly across brokers; the reported column is returned alongside as a
-- cross-check and the two should agree.
--
-- INTERPRETATION NOTE: foreign buying and foreign selling occur on the same days at
-- the same prices, so the buy-side and sell-side profiles come out near-identical on
-- most symbols. The profile's point of control is a statement about where foreign
-- inventory changed hands, not evidence that price reverses there. A support claim
-- needs the level tested and held as well.

with d as (
  select
    symbol,
    date,
    sum(f_bval)                                        as f_buy_val,
    sum(f_blot) * 100                                  as f_buy_shares,
    sum(f_sval)                                        as f_sell_val,
    sum(f_slot) * 100                                  as f_sell_shares,
    sum(bval + sval)                                   as gross_val,
    sum(f_bavg_per_share * f_blot)
      / nullif(sum(f_blot), 0)                         as f_bavg_reported,
    sum(f_savg_per_share * f_slot)
      / nullif(sum(f_slot), 0)                         as f_savg_reported
  from idx_broker_summary_daily
  where date between '{{start}}' and '{{end}}'
    and symbol in ({{symbols}})
  group by symbol, date
)
select
  d.symbol,
  d.date,
  p.close,
  d.f_buy_shares,
  d.f_sell_shares,
  round((d.f_buy_val  / nullif(d.f_buy_shares, 0))::numeric, 2)  as f_buy_avg_price,
  round((d.f_sell_val / nullif(d.f_sell_shares, 0))::numeric, 2) as f_sell_avg_price,
  round(d.f_bavg_reported::numeric, 2)                           as f_buy_avg_reported,
  round(d.f_savg_reported::numeric, 2)                           as f_sell_avg_reported,
  d.f_buy_val - d.f_sell_val                                     as f_net_val,
  d.gross_val
from d
left join idx_daily_data p on p.symbol = d.symbol and p.date = d.date
order by d.symbol, d.date;
