-- name:        sgx-reit-transactions-vs-basis
-- computes:    Median transaction_price vs basis_value by transaction type, basis and financial year
-- universe:    every row of sgx_reit_property_transaction
-- window:      as stated in universe
-- exclusions:  rows failing the universe filter
-- caveat:      basis differs by row (valuation, book_value, purchase_price) so compare within basis; acquisitions with null basis are not comparable; small n per cell
-- returns:     see select list
-- Approved 2026-10-23.
select transaction_type, basis, financial_year, count(*) as n,
       count(*) filter (where basis_value > 0 and transaction_price > 0) as n_comparable,
       round((percentile_cont(0.5) within group (order by transaction_price::numeric / basis_value - 1) filter (where basis_value > 0 and transaction_price > 0) * 100)::numeric, 1) as median_vs_basis_pct
from sgx_reit_property_transaction
group by transaction_type, basis, financial_year order by transaction_type, basis, financial_year;
