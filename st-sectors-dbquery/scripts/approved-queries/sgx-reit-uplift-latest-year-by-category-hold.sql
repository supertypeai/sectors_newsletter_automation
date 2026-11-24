-- name:        sgx-reit-uplift-latest-year-by-category-hold
-- computes:    median per-property uplift (market_valuation / purchase_price - 1) by property category,
--              overall and crossed with holding-age bucket (<5y, 5-10y, 10y+), using each trust's
--              latest financial year that carries usable data
-- universe:    sgx_reit_property rows with positive purchase_price and market_valuation and non-null
--              purchase_date and valuation_date, one financial year per trust (its latest usable)
-- window:      FY2024 or FY2025 depending on the trust; Mapletree trusts have no usable FY2025 rows
-- exclusions:  properties missing any field above
-- caveat:      mixes FY2024 and FY2025 vintages across trusts; the FY2025-only queries silently drop
--              trusts without FY2025 purchase data (Mapletree Logistics and Industrial among them), so
--              prefer this one for category claims; cells under 10 properties or one trust are anecdotes
-- returns:     category, hold_bucket (incl. 'all'), n, n_reits, median_uplift_pct
-- Approved 2026-10-23.
with usable as (
  select symbol, category, financial_year,
         (valuation_date - purchase_date) / 365.25 as hold_yrs,
         market_valuation::numeric / purchase_price - 1 as uplift
  from sgx_reit_property
  where purchase_price > 0 and market_valuation > 0 and purchase_date is not null and valuation_date is not null
), latest as (select symbol, max(financial_year) as fy from usable group by symbol),
p as (select u.* from usable u join latest l on l.symbol = u.symbol and l.fy = u.financial_year)
select category,
       case when hold_yrs is null then 'all' when hold_yrs < 5 then '1: <5y' when hold_yrs < 10 then '2: 5-10y' else '3: 10y+' end as hold_bucket,
       count(*) as n, count(distinct symbol) as n_reits,
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1) as median_uplift_pct
from (select category, hold_yrs, symbol, uplift from p union all select category, null, symbol, uplift from p) x
group by 1, 2 order by 1, 2;
