-- name:         idx-quarterly-income-stmt-for-symbol
-- computes:     one IDX symbol's quarterly income statement metrics (jsonb as stored, with the
--               cumulative-from-Q1 figures in reporting currency) from {{from_date}} on
-- universe:     a single IDX symbol, {{symbol}}, rows in idx_financial_sheets_quarterly
-- window:       parameterised, date >= {{from_date}}
-- exclusions:   none; rows returned as stored so the caller sees real keys and nulls
-- survivorship: not applicable, single symbol, as filed
-- statistic:    raw rows, no aggregation. income_stmt_metrics is the IDR-translated single quarter,
--               income_stmt_metrics_cumulative is the reporting-currency figure cumulative from Q1
--               (a half year or a full year is read off the cumulative column of the Q2 or Q4 row)
-- approved:     2026-10-12, Evelyn (confirmed at the guard prompt)
-- used by:      mining group carousel
SELECT s.date::text AS period_end, s.currency, s.income_stmt_metrics, s.income_stmt_metrics_cumulative
FROM idx_financial_sheets_quarterly s
WHERE s.symbol = '{{symbol}}'
  AND s.date >= '{{from_date}}'
ORDER BY s.date ASC
