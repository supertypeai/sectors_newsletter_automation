-- name:         idx-manual-input-prior-year-sankey
-- computes:     FY2023 and FY2024 sankey_component for every symbol that has an idx_manual_input
--               row updated in the last 14 days, to compare against the freshly pushed year
-- universe:     idx_manual_input, symbols with a row updated_on in the last 14 days
-- window:       financial_year 2023 and 2024; recency window is the last 14 days
-- exclusions:   rows with null sankey_component
-- survivorship: not applicable, rows as stored
-- statistic:    raw rows, no aggregation
-- approved:     2026-10-12, Evelyn (confirmed at the guard prompt)
-- used by:      mining group carousel
SELECT symbol, financial_year, sankey_component
FROM idx_manual_input
WHERE financial_year IN (2023, 2024)
  AND sankey_component IS NOT NULL
  AND symbol IN (SELECT symbol FROM idx_manual_input WHERE updated_on >= now() - interval '14 days')
ORDER BY symbol, financial_year
