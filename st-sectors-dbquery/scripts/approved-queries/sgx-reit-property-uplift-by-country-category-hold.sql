-- name:        sgx-reit-property-uplift-by-country-category-hold
-- computes:    FY2025 per-property uplift (market_valuation / purchase_price - 1), summarised as
--              median and mean by country, by property category and by holding-age bucket
-- universe:    sgx_reit_property rows, financial_year 2025, positive purchase_price and
--              market_valuation, non-null purchase_date and valuation_date
-- window:      FY2025 only
-- exclusions:  properties missing any of the fields above
-- caveat:      uplift is a ratio within one row, so currency does not distort it, but cost basis
--              may be historic or a listing-date revaluation. Hold buckets are confounded with
--              category and country (old assets are mostly Singapore industrial). Countries with
--              n under 10 are anecdotes. Portfolio mix is not controlled
-- returns:     dim (country|category|hold_bucket), grp, n, median_uplift_pct, mean_uplift_pct,
--              avg_hold_yrs
-- Approved 2026-10-23.
with p as (
  select country, category,
         (valuation_date - purchase_date) / 365.25 as hold_yrs,
         market_valuation::numeric / purchase_price - 1 as uplift
  from sgx_reit_property
  where financial_year = 2025
    and purchase_price > 0 and market_valuation > 0
    and purchase_date is not null and valuation_date is not null
)
select 'country' as dim, country as grp, count(*) as n,
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1) as median_uplift_pct,
       round((avg(uplift) * 100)::numeric, 1) as mean_uplift_pct,
       round(avg(hold_yrs)::numeric, 1) as avg_hold_yrs
from p group by country
union all
select 'category', category, count(*),
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1),
       round((avg(uplift) * 100)::numeric, 1),
       round(avg(hold_yrs)::numeric, 1)
from p group by category
union all
select 'hold_bucket',
       case when hold_yrs < 3 then '1: <3y' when hold_yrs < 7 then '2: 3-7y'
            when hold_yrs < 12 then '3: 7-12y' else '4: 12y+' end,
       count(*),
       round((percentile_cont(0.5) within group (order by uplift) * 100)::numeric, 1),
       round((avg(uplift) * 100)::numeric, 1),
       round(avg(hold_yrs)::numeric, 1)
from p group by 2
order by 1, 2;
