-- name:         idx-register-history-for-holder
-- computes:     every 1% register entry, across every monthly snapshot, whose holder
--               name matches {{holder_pattern}}, to trace one person's or vehicle's
--               positions over time
-- universe:     all IDX symbols in idx_one_percent_ownership
-- window:       full register history, no date filter
-- exclusions:   none; the name match is loose (ilike), so the caller must drop
--               unrelated holders sharing the name fragment, openly
-- survivorship: point-in-time snapshots as filed
-- statistic:    raw register percentages, no aggregation
-- approved:     2026-09-25, Evelyn
-- used by:      Andry Hakim float carousel (idx_andry_hakim_floats)
-- note:         pattern includes wildcards, e.g. '%hakim%'
select o.date::text as snapshot_date, o.symbol, o.investor_name, o.investor_type,
       round(o.percentage::numeric, 3) as holder_pct
from idx_one_percent_ownership o
where o.investor_name ilike '{{holder_pattern}}'
order by o.symbol, o.date;
