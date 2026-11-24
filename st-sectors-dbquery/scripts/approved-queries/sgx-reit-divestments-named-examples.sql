-- name:        sgx-reit-divestments-named-examples
-- computes:    the 6 largest and 6 highest-premium REIT property divestments measured against the
--              trust's own valuation, with REIT name, property, date, price, basis and premium
-- universe:    sgx_reit_property_transaction divestments, basis valuation, positive prices, FY2023 to FY2025
-- window:      financial_year 2023 to 2025
-- exclusions:  rows without a positive basis_value or transaction_price
-- caveat:      a deal can appear in both lists; highest-premium is dominated by small or hotel assets,
--              so do not read it as typical; price and basis currency assumed identical within a row
-- returns:     kind, symbol, name, property_name, completed_date, financial_year, basis,
--              transaction_price, basis_value, premium_pct
-- Approved 2026-10-23.
with d as (
  select t.symbol, c.name, t.property_name, t.completed_date, t.financial_year, t.basis,
         t.transaction_price, t.basis_value,
         round((t.transaction_price::numeric / t.basis_value - 1) * 100, 1) as premium_pct
  from sgx_reit_property_transaction t
  join sgx_companies c on c.symbol = t.symbol
  where t.transaction_type = 'divestment' and t.basis = 'valuation'
    and t.basis_value > 0 and t.transaction_price > 0 and t.financial_year between 2023 and 2025
)
(select 'largest' as kind, d.* from d order by transaction_price desc limit 6)
union all
(select 'highest_premium', d.* from d order by premium_pct desc limit 6);
