-- name:         sgx-shareholders-for-symbol
-- computes:     the raw shareholders list stored for one SGX counter: holder name, share_amount,
--               share_percentage (a decimal, 0.1898 is 18.98 percent)
-- universe:     the single symbol {{symbol}} in sgx_companies, with the .SI suffix, e.g. 'C09.SI'
-- window:       as stored, no date filter; the table carries no snapshot date, so state the
--               pull date on any slide and cross-check against the annual report
-- exclusions:   none; nominee and custodian lines (DBSN, Maybank Securities, DBS Nominees)
--               and holding vehicles are returned as stored, the caller rolls them up
-- survivorship: not applicable, single symbol
-- statistic:    raw rows, no aggregation
-- note:         lists direct registered holders, so deemed interests held through a parent are
--               NOT summed here; do not equate this with a substantial shareholder notice
-- approved:     2026-10-05, user confirmed in session
-- used by:      st-sectors-carousel family ownership sets
SELECT symbol, name, is_active, market, shareholders
FROM sgx_companies
WHERE symbol = '{{symbol}}'
