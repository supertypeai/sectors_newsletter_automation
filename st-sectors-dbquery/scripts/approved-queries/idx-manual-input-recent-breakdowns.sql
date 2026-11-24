-- name:         idx-manual-input-recent-breakdowns
-- computes:     the most recently pushed idx_manual_input breakdown rows: symbol, financial_year,
--               updated_on, industry_breakdown and sankey_component jsonb
-- universe:     idx_manual_input rows with updated_on in the last 14 days
-- window:       rolling 14 days back from now()
-- exclusions:   rows where both industry_breakdown and sankey_component are null
-- survivorship: not applicable, rows as stored
-- statistic:    raw rows, no aggregation; sankey links carry revenue segments into Total Revenue
-- approved:     2026-10-12, Evelyn (confirmed at the guard prompt)
-- used by:      mining group carousel
SELECT symbol, financial_year, updated_on, industry_breakdown, sankey_component
FROM idx_manual_input
WHERE updated_on >= now() - interval '14 days'
  AND (industry_breakdown IS NOT NULL OR sankey_component IS NOT NULL)
ORDER BY updated_on DESC, symbol, financial_year DESC
