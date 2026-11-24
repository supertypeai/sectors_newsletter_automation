-- name:         idx-retail-vs-foreign-flow-by-symbol
-- computes:     per-symbol retail-broker net value against exchange-flagged foreign
--               net value over a window, alongside the symbol's price move
-- universe:     symbols whose gross broker turnover over the window clears
--               {{min_gross}} IDR, and which have a priced row on both window bounds
-- window:       parameterised, {{start}} to {{end}}, inclusive both ends
-- exclusions:   symbols below the turnover floor; symbols missing a close on either
--               bound (suspended or newly listed), which are dropped rather than
--               interpolated
-- survivorship: point-in-time within the window only; a name suspended or delisted
--               mid-window is excluded by the bound-price requirement, which biases
--               the surviving set upward and must be stated wherever the rows are used
-- statistic:    net value in IDR per side and simple close-to-close return, with
--               days_active returned per symbol as the sample size
-- approved:     2026-09-04, evelyn
-- verified:     2026-09-04 over 2026-08-04..2026-09-03 at min_gross 5e12, 30 symbols
--               in universe: TPIA retail +423B against foreign -1,030B; CPIN retail
--               +54B against foreign -750B; KIJA retail +43B against foreign -54B;
--               BBRI retail -568B against foreign +1,761B; BBCA retail -437B against
--               foreign +1,457B
-- used by:      idx-retail-bid-vs-foreign-selling
--
-- DEFINITION NOTE: foreign is the exchange's own per-row flag (f_bval / f_sval), the
-- beneficial-owner definition, consistent with foreign-flow-range.sql and with a
-- published IDX foreign-flow print. Never substitute idx_broker_registry.is_foreign,
-- which measures the executing broker's domicile and answers a different question.
-- See the fuller note in idx-retail-vs-foreign-flow-summary.sql.
--
-- The turnover floor is the knob that decides which market this describes. At a high
-- floor the universe is large caps and the retail column can invert sign against the
-- market-wide summary, because retail's net buying is concentrated in names below
-- the floor. Set it deliberately and state it, never inherit it from another run.
with j as (
  select b.symbol, b.date, b.bval, b.sval, b.nval, b.f_bval, b.f_sval, r.cohort
  from idx_broker_summary_daily b
  join idx_broker_registry r using (broker_code)
  where b.date between '{{start}}' and '{{end}}'
),
flow as (
  select
    symbol,
    sum(case when cohort = 'Retail' then nval else 0 end)         as retail_net,
    sum(f_bval - f_sval)                                          as foreign_net,
    sum(case when cohort = 'Institutional' then nval else 0 end)  as institutional_net,
    sum(bval + sval)                                              as gross_val,
    count(distinct date)                                          as days_active
  from j
  group by symbol
  having sum(bval + sval) >= {{min_gross}}
),
bounds as (
  select min(date) as d0, max(date) as d1
  from idx_daily_data
  where date between '{{start}}' and '{{end}}'
),
px as (
  select
    d.symbol,
    max(d.close) filter (where d.date = (select d0 from bounds)) as close_start,
    max(d.close) filter (where d.date = (select d1 from bounds)) as close_end
  from idx_daily_data d
  where d.date between '{{start}}' and '{{end}}'
  group by d.symbol
)
select
  f.symbol,
  f.retail_net,
  f.foreign_net,
  f.institutional_net,
  f.gross_val,
  f.days_active,
  p.close_start,
  p.close_end,
  round((100.0 * (p.close_end - p.close_start) / nullif(p.close_start, 0))::numeric, 1) as return_pct,
  (select count(*) from flow) as symbols_in_universe
from flow f
join px p using (symbol)
where p.close_start is not null and p.close_end is not null
order by f.retail_net desc;
