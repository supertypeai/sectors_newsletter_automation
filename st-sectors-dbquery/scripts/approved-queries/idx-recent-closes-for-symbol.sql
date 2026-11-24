-- name:         idx-recent-closes-for-symbol
-- computes:     the last {{n_days}} trading-day closes for one IDX symbol, so a figure
--               shown in the app can be tied to the exact date whose close produced it
-- universe:     a single IDX symbol, {{symbol}}, rows in idx_daily_data
-- window:       most recent {{n_days}} rows by date, descending
-- exclusions:   none
-- survivorship: not applicable, single live symbol
-- statistic:    raw closes, no aggregation
-- approved:     2026-09-16, Evelyn
-- used by:      tying an app-displayed figure to the close date that produced it
-- note:         symbols carry the .JK suffix, e.g. 'MPMX.JK'
select d.date::text as date, d.close::numeric as close, d.volume::numeric as volume
from idx_daily_data d
where d.symbol = '{{symbol}}'
order by d.date desc
limit {{n_days}}
