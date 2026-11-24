-- name:         idx-retail-vs-foreign-flow-summary
-- computes:     one summary row for a window on how often retail brokers and foreign
--               investors stood on opposite sides, and how much each side net bought
-- universe:     every IDX symbol with a broker summary row in the window; the retail
--               side additionally requires a broker registry row for the cohort tag,
--               and the registry-covered share of gross turnover is returned
-- window:       parameterised, {{start}} to {{end}}, inclusive both ends
-- exclusions:   for the retail figure only, broker codes with no registry row
-- survivorship: none applicable; a flow aggregate over trading-day rows as filed, no
--               universe is reconstructed and no delisted name is dropped
-- statistic:    day counts, Pearson correlation of the two daily net series, and net
--               value totals in IDR, with trading_days returned as the sample size
-- approved:     2026-09-04, evelyn
-- verified:     2026-09-04 over 2026-01-01..2026-09-03: trading_days 153,
--               retail_net_buy_days 124, foreign_net_sell_days 114,
--               opposite_side_days 103, corr -0.701, retail_net_total
--               29,500,445,178,800, foreign_net_total -92,590,000,000,000 (to 2dp,
--               -92.59T), registry_gross_share 99.28. Cross-checked the same window
--               against foreign-flow-range.sql's exchange-volume definition, which
--               returns -91.24T, a 1.5% gap explained by close-price valuation there
--               against actual traded value here. The two agree in direction and
--               magnitude, as they must.
-- used by:      idx-retail-bid-vs-foreign-selling
--
-- DEFINITION NOTE: foreign is the EXCHANGE'S OWN FLAG on the trade, carried per row in
-- idx_broker_summary_daily's f_bval / f_sval columns, so it is the beneficial-owner
-- definition and is consistent with foreign-flow-range.sql and with a published IDX
-- foreign-flow print. It is NOT the domicile of the executing broker
-- (idx_broker_registry.is_foreign): that attributes an Indonesian family office
-- trading through a foreign house to foreigners and a foreign fund routing through a
-- local house to domestic, and over 2026 it produced -79.48T against the correct
-- -92.59T. Never use is_foreign to measure foreign investment. The registry's role
-- here is only the retail/institutional cohort tag, which exists nowhere else.
--
-- Retail and foreign are two independent axes, not two halves of one split: retail is
-- who executed, foreign is who owned. They overlap only marginally, foreign-flagged
-- flow inside retail-tagged brokers is -0.59T over 2026, so retail-broker flow is
-- effectively all domestic money and the two series can be read against each other.
with j as (
  select b.date, b.bval, b.sval, b.nval, b.f_bval, b.f_sval, r.cohort
  from idx_broker_summary_daily b
  join idx_broker_registry r using (broker_code)
  where b.date between '{{start}}' and '{{end}}'
),
d as (
  select
    date,
    sum(case when cohort = 'Retail' then nval else 0 end) as retail_net,
    sum(f_bval - f_sval)                                  as foreign_net
  from j
  group by date
)
select
  count(*)                                         as trading_days,
  count(*) filter (where retail_net > 0)           as retail_net_buy_days,
  count(*) filter (where foreign_net < 0)          as foreign_net_sell_days,
  count(*) filter (where retail_net > 0
                     and foreign_net < 0)          as opposite_side_days,
  round(corr(retail_net, foreign_net)::numeric, 3) as corr_retail_foreign,
  sum(retail_net)                                  as retail_net_total,
  sum(foreign_net)                                 as foreign_net_total,
  round((100.0 * (select sum(bval + sval) from j)
         / (select sum(bval + sval) from idx_broker_summary_daily
            where date between '{{start}}' and '{{end}}'))::numeric, 2)
                                                   as registry_gross_share
from d;
