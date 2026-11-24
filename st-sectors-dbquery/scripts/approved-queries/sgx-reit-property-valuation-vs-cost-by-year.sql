-- name:        sgx-reit-property-valuation-vs-cost-by-year
-- computes:    per REIT and financial year, summed purchase price against summed market
--              valuation, the uplift between them, and average holding age at valuation date
-- universe:    sgx_reit_property rows with positive purchase_price and market_valuation and
--              non-null purchase_date and valuation_date
-- window:      every financial year present (2023 to 2025 at approval)
-- exclusions:  properties missing any of the four fields above, so counts are a subset of
--              each trust's portfolio
-- caveat:      amounts are in the reporting currency as stored; foreign-currency assets may mix
--              cost and valuation currencies. Purchase price can be a historic or listing-date
--              basis, and mixed property sets between years (n_props) shift the sums
-- returns:     symbol, financial_year, n_props, cost, valuation, uplift_pct, avg_hold_yrs
-- Approved 2026-10-23.
select symbol, financial_year,
       count(*) as n_props,
       sum(purchase_price) as cost,
       sum(market_valuation) as valuation,
       round((sum(market_valuation)::numeric / nullif(sum(purchase_price), 0) - 1) * 100, 1) as uplift_pct,
       round(avg((valuation_date - purchase_date) / 365.25)::numeric, 1) as avg_hold_yrs
from sgx_reit_property
where purchase_price > 0 and market_valuation > 0
  and purchase_date is not null and valuation_date is not null
group by symbol, financial_year
order by symbol, financial_year;
