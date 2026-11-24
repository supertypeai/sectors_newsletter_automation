-- name:        sgx-reit-uplift-by-category-and-hold-bucket
-- computes:    FY2025 median per-property uplift (market_valuation / purchase_price - 1) by property
--              category crossed with holding-age bucket (<5y, 5-10y, 10y+)
-- universe:    sgx_reit_property FY2025, positive purchase_price and market_valuation, non-null dates
-- window:      FY2025 only
-- exclusions:  properties missing any of the fields above
-- caveat:      cells under n=10 are anecdotes (Data Centers 10y+ n=3, Office 10y+ n=7); hold bucket
--              is a proxy for purchase vintage; cost basis may be a listing-date revaluation
-- returns:     category, hold_bucket, n, median_uplift_pct
-- Approved 2026-10-23.
with p as (
  select category, (valuation_date - purchase_date) / 365.25 as hold_yrs,
         market_valuation::numeric / purchase_price - 1 as uplift
  from sgx_reit_property
  where financial_year = 2025 and purchase_price > 0 and market_valuation > 0
    and purchase_date is not null and valuation_date is not null
)
select category,
       case when hold_yrs < 5 then '1: <5y' when hold_yrs < 10 then '2: 5-10y' else '3: 10y+' end as hold_bucket,
       count(*) as n,
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1) as median_uplift_pct
from p group by 1, 2 order by 1, 2;
