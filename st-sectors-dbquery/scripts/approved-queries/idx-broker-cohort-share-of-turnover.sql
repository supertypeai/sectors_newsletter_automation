-- name:         idx-broker-cohort-share-of-turnover
-- computes:     each broker cohort's share of gross market turnover and its net value
--               over a window, one row per cohort
-- universe:     as idx-broker-cohort-flow-summary
-- window:       parameterised, {{start}} to {{end}}, inclusive both ends
-- exclusions:   broker codes with no registry row
-- survivorship: none applicable, same reasoning as idx-broker-cohort-flow-summary
-- statistic:    turnover share as a percentage and net value in IDR, with the window's
--               trading-day count returned as the sample size
-- approved:     2026-09-04, evelyn
-- verified:     2026-09-04 over 2026-01-01..2026-09-03: Institutional 52.3% of
--               gross and net -81,300,159,056,400; Mixed 31.5% and
--               +52,065,880,378,300; Retail 16.1% and +29,500,445,178,800;
--               Unknown 0.1% and -40,214,629,300
-- used by:      idx-retail-bid-vs-foreign-selling
--
-- DEFINITION NOTE: broker-domicile and broker-cohort definitions, see the note in
-- idx-broker-cohort-flow-summary.sql. Not interchangeable with
-- foreign-flow-range.sql.
with j as (
  select b.date, b.bval, b.sval, b.nval, r.cohort
  from idx_broker_summary_daily b
  join idx_broker_registry r using (broker_code)
  where b.date between '{{start}}' and '{{end}}'
)
select
  cohort,
  round((100.0 * sum(bval + sval)
         / (select sum(bval + sval) from j))::numeric, 1) as pct_of_gross_turnover,
  sum(nval)                                               as net_val,
  sum(bval + sval)                                        as gross_val,
  (select count(distinct date) from j)                    as trading_days
from j
group by cohort
order by pct_of_gross_turnover desc;
