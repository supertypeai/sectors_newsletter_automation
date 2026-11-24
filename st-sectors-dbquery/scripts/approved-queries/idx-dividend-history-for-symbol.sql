-- name:         idx-dividend-history-for-symbol
-- computes:     one company's full dividend record three ways, so a screener figure can
--               be reconciled against source: every row in idx_dividend, the per-year
--               aggregate the app reads from historical_dividends, and the report's own
--               trailing-twelve-month fields with the latest close
-- universe:     a single IDX symbol, {{symbol}}
-- window:       full history held for that symbol; no date filter
-- exclusions:   none
-- survivorship: not applicable, single live symbol
-- statistic:    raw rows plus per-year sums of dividend and yield
-- approved:     2026-09-16, Evelyn
-- used by:      KB dividend reconciliation, IDX forward-yield defect write-up
-- note:         symbols in idx_dividend carry the .JK suffix, e.g. 'PSAB.JK'
select 'dividend_row' as kind, d.date::text as k1, d.cum_date::text as k2,
       d.dividend::numeric as v1, d.dividend_original::numeric as v2, d.yield::numeric as v3
from idx_dividend d where d.symbol = '{{symbol}}'
union all
select 'year_total', extract(year from d.date)::text, count(*)::text,
       sum(d.dividend)::numeric, sum(d.dividend_original)::numeric, sum(d.yield)::numeric
from idx_dividend d where d.symbol = '{{symbol}}' group by extract(year from d.date)
union all
select 'report', r.latest_close_date::text, null,
       r.dividend_ttm::numeric, r.yield_ttm::numeric, r.last_close_price::numeric
from idx_company_report r where r.symbol = '{{symbol}}'
order by kind, k1
