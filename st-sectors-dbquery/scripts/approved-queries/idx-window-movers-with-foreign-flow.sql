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
-- approved:     2026-10-15, evelyn (confirmed at the execute_sql prompt)
-- verified:     2026-10-15 over base 2026-10-07, flow 2026-10-08..2026-10-14, min_mcap 0, min_turnover 1,
--               837 symbols in universe: BIKE +176.4% on IDR 90.3B traded and IDR 0.9B net foreign flow,
--               TFCO +94.5% on IDR 1.1B traded, KDTN -46.1%
-- used by:      idx-foreign-flow-rotation (carousel, 2026-10-16)
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
