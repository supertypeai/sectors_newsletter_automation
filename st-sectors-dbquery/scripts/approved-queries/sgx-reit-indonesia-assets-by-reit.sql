-- name:        sgx-reit-indonesia-assets-by-reit
-- computes:    FY2025 Indonesian properties per SGX REIT: count, holding years, median and aggregate uplift, cost, valuation, NPI
-- universe:    sgx_reit_property FY2025, country Indonesia, positive purchase_price and market_valuation, non-null dates
-- window:      as stated in universe
-- exclusions:  rows failing the universe filter
-- caveat:      aggregate cost and valuation sum per REIT, assumed one currency per trust; npi may be null
-- returns:     see select list
-- Approved 2026-10-23.
select symbol, count(*) as n, round(avg((valuation_date - purchase_date) / 365.25)::numeric, 1) as avg_hold_yrs,
       round((percentile_cont(0.5) within group (order by market_valuation::numeric / purchase_price - 1) * 100)::numeric, 1) as median_uplift_pct,
       round(((sum(market_valuation)::numeric / sum(purchase_price) - 1) * 100), 1) as agg_uplift_pct,
       sum(purchase_price) as cost, sum(market_valuation) as valuation, sum(net_property_income) as npi,
       string_agg(distinct category, ', ') as categories
from sgx_reit_property
where financial_year = 2025 and country = 'Indonesia'
  and purchase_price > 0 and market_valuation > 0 and purchase_date is not null and valuation_date is not null
group by symbol order by n desc;
