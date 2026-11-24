-- name:         market-coverage-counts
-- computes:     per-market company/counter coverage for the customer-facing
--               "what do you cover" knowledge base page, with the IDX listing-board
--               split and the SGX active/suspended split so the KB can state what a
--               headline coverage number does and does not include
-- universe:     IDX = idx_company_profile with a null delisting_date (the same
--               definition idx_active_company_profile uses); SGX = sgx_companies with
--               is_active IS NOT FALSE, matching sgx-market-cap-rank; KLSE =
--               klse_companies in full, the table carries no active or delisting flag
-- window:       none, current snapshot as of run time
-- exclusions:   IDX delisted companies only; nothing excluded for SGX beyond
--               is_active = false, nothing excluded for KLSE
-- survivorship: snapshot, not point-in-time; delisted names are absent rather than
--               retained, which is what a coverage claim should reflect
-- statistic:    row counts
-- approved:     2026-09-14, Evelyn
-- used by:      sectors knowledge base, coverage page
select 'IDX' as market, 'active companies' as segment, count(*)::int as n
from idx_company_profile where delisting_date is null
union all
select 'IDX', 'board: ' || coalesce(listing_board, 'unknown'), count(*)::int
from idx_company_profile where delisting_date is null group by listing_board
union all
select 'SGX', 'active counters', count(*)::int
from sgx_companies where is_active is not false
union all
select 'SGX', 'active and suspended', count(*)::int
from sgx_companies where is_active is not false and is_suspended is true
union all
select 'KLSE', 'companies', count(*)::int from klse_companies
order by market, segment
