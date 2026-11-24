-- name:        sgx-reit-like-for-like-revaluation-fy24-fy25
-- computes:    Same-property valuation change FY2024 to FY2025 by category, with count up and down
-- universe:    properties present in both FY2024 and FY2025 under the same symbol and property_name
-- window:      as stated in universe
-- exclusions:  rows failing the universe filter
-- caveat:      properties renamed between years drop out; capex can lift valuation without market movement
-- returns:     see select list
-- Approved 2026-10-23.
select a.category, count(*) as n,
       round((percentile_cont(0.5) within group (order by b.market_valuation::numeric / a.market_valuation - 1) * 100)::numeric, 1) as median_chg_pct,
       round(((sum(b.market_valuation)::numeric / sum(a.market_valuation) - 1) * 100), 1) as agg_chg_pct,
       count(*) filter (where b.market_valuation > a.market_valuation) as n_up,
       count(*) filter (where b.market_valuation < a.market_valuation) as n_down
from sgx_reit_property a
join sgx_reit_property b on b.symbol = a.symbol and b.property_name = a.property_name and b.financial_year = 2025
where a.financial_year = 2024 and a.market_valuation > 0 and b.market_valuation > 0
group by a.category order by n desc;
