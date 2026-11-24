-- name:         sgx-holder-name-search
-- computes:     every active SGX counter whose stored shareholders list contains a holder whose
--               name matches {{holder}} (case-insensitive substring), one row per match, largest first
-- universe:     active rows in sgx_companies, shareholders jsonb unnested
-- window:       as stored, no date filter; the table carries no snapshot date
-- exclusions:   inactive counters; a holder missing from a company's stored list returns no row,
--               so absence here is NOT proof a person holds nothing (deemed interests, nominee
--               lines and holding vehicles under other names are invisible to a name search)
-- survivorship: not applicable, current universe only
-- statistic:    raw rows, share_percentage is a decimal (0.3716 is 37.16 percent)
-- approved:     2026-10-05, user confirmed in session
-- used by:      st-sectors-carousel family ownership sets
SELECT c.symbol, c.name AS company, s.value->>'name' AS holder, (s.value->>'share_amount')::numeric AS share_amount, (s.value->>'share_percentage')::numeric AS share_percentage
FROM sgx_companies c
CROSS JOIN LATERAL jsonb_array_elements(c.shareholders) AS s(value)
WHERE c.is_active = true AND s.value->>'name' ILIKE '%{{holder}}%'
ORDER BY share_percentage DESC
