-- name:        sgx-reit-industrial-divestments-realised-gain
-- computes:    per REIT, industrial and logistics divestments matched to the property's purchase price:
--              count, summed sale price vs summed purchase price, aggregate and median gain
-- universe:    sgx_reit_property_transaction divestments joined by symbol and property_name to the
--              latest sgx_reit_property row with a positive purchase_price, category Industrial & Logistics
-- window:      all financial years present
-- exclusions:  sales whose property_name does not match a property row (30 of the divestments matched
--              at approval), non-positive prices
-- caveat:      partial sample; gain excludes capex, costs and income; totals are in each trust's reporting
--              currency; verified at approval: CapitaLand Ascendas REIT's five Singapore sales total
--              S$329.0m vs S$274.2m purchase price, matching its August 2025 announcement
-- returns:     symbol, name, n_sales, sale_total, cost_total, gain_pct, median_gain_pct, countries
-- Approved 2026-10-23.
with prop as (
  select distinct on (symbol, property_name) symbol, property_name, category, purchase_price, purchase_date, country
  from sgx_reit_property
  where purchase_price > 0
  order by symbol, property_name, financial_year desc
)
select t.symbol, c.name, count(*) as n_sales,
       sum(t.transaction_price) as sale_total, sum(p.purchase_price) as cost_total,
       round(((sum(t.transaction_price)::numeric / sum(p.purchase_price) - 1) * 100), 1) as gain_pct,
       round((percentile_cont(0.5) within group (order by t.transaction_price::numeric / p.purchase_price - 1) * 100)::numeric, 1) as median_gain_pct,
       string_agg(distinct p.country, ', ') as countries
from sgx_reit_property_transaction t
join prop p on p.symbol = t.symbol and p.property_name = t.property_name
join sgx_companies c on c.symbol = t.symbol
where t.transaction_type = 'divestment' and t.transaction_price > 0 and p.category = 'Industrial & Logistics'
group by t.symbol, c.name order by n_sales desc;
