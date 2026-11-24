-- name:        sgx-reit-carry-spread-and-dpu-bridge
-- computes:    per-REIT portfolio NPI yield (net property income / stated portfolio value),
--              the carry spread against the trust's own weighted cost of debt, and a
--              distribution-per-unit bridge decomposing DPU change into net distributable
--              income growth and unit-count growth
-- universe:    SGX-listed REITs present in sgx_reit_profile with a sgx_reit_performance row
--              carrying non-null portfolio_value, net_property_income and cost_of_debt;
--              the "top N" cut is by stated portfolio value in the latest financial year
-- window:      parameterised, :fy_base to :fy_latest (financial_year labels, not calendar)
-- exclusions:  rows with null portfolio_value, net_property_income or cost_of_debt; trusts
--              reporting in a currency other than SGD are returned with their currency so the
--              caller can drop them rather than mixing units
-- survivorship: point-in-time is not available in sgx_reit_performance, which holds one row per
--              trust per financial year as last restated. A trust delisted between the two
--              financial years therefore drops out of the base year as well, which biases any
--              two-year aggregate toward survivors. Report the constituent count in both years
--              and name any trust present in one year only.
-- caveats:     (1) net_property_income is the consolidated figure and excludes income from
--              joint ventures and associates, while portfolio_value in several trusts includes
--              the trust's share of JV-held assets. For JV-heavy structures (Keppel REIT,
--              Suntec REIT) the resulting NPI yield understates economic asset yield and is not
--              comparable to a wholly-owned portfolio. Flag, do not silently average.
--              (2) Financial year ends differ across trusts (Dec, Mar, Jun, Sep). A single
--              "FY2025" column therefore spans year-ends from 2025-09-30 to 2026-03-31.
--              (3) Yield is measured on year-end valuation. A large acquisition completed late
--              in the year adds full value and partial income, depressing measured yield.
-- statistic:   per-trust levels and year-on-year changes, plus equal-count aggregates with the
--              constituent count returned alongside
-- reviewed:    2026-08-03, Sectors Research desk
-- used by:     2026-08-03_data-study_sgx-reit-carry-spread

WITH universe AS (
    SELECT f.symbol,
           c.name,
           c.currency,
           p.sub_sector,
           f.financial_year,
           f.date AS period_end,
           f.portfolio_value,
           f.net_property_income,
           f.gross_revenue,
           f.net_distributable_income,
           f.number_of_shareholder_units,
           f.number_of_unitholders,
           f.cost_of_debt,
           f.aggregate_leverage,
           f.interest_coverage_ratio,
           f.weighted_average_debt_maturity,
           f.weighted_average_lease_expiry,
           f.portfolio_occupancy,
           f.distribution_per_unit,
           f.net_asset_value_per_unit
    FROM sgx_reit_performance f
    JOIN sgx_reit_profile p ON p.symbol = f.symbol
    JOIN sgx_companies    c ON c.symbol = f.symbol
    WHERE f.financial_year IN (:fy_base, :fy_latest)
      AND f.portfolio_value    IS NOT NULL
      AND f.net_property_income IS NOT NULL
      AND f.cost_of_debt        IS NOT NULL
),
ranked AS (
    SELECT symbol
    FROM universe
    WHERE financial_year = :fy_latest
    ORDER BY portfolio_value DESC
    LIMIT :top_n
),
metrics AS (
    SELECT u.*,
           ROUND((u.net_property_income::numeric / NULLIF(u.portfolio_value, 0)) * 100, 2) AS npi_yield_pct,
           ROUND((u.net_property_income::numeric / NULLIF(u.portfolio_value, 0)) * 100
                 - u.cost_of_debt::numeric, 2)                                            AS carry_spread_pp,
           ROUND((u.net_property_income::numeric / NULLIF(u.gross_revenue, 0)) * 100, 1)   AS npi_margin_pct
    FROM universe u
    WHERE u.symbol IN (SELECT symbol FROM ranked)
)
SELECT b.symbol,
       b.name,
       b.sub_sector,
       b.currency,
       b.period_end                AS base_period_end,
       l.period_end                AS latest_period_end,
       b.portfolio_value           AS pv_base,
       l.portfolio_value           AS pv_latest,
       ROUND((l.portfolio_value::numeric / NULLIF(b.portfolio_value, 0) - 1) * 100, 2)                 AS pv_growth_pct,
       b.net_property_income       AS npi_base,
       l.net_property_income       AS npi_latest,
       ROUND((l.net_property_income::numeric / NULLIF(b.net_property_income, 0) - 1) * 100, 2)         AS npi_growth_pct,
       b.npi_yield_pct, l.npi_yield_pct AS npi_yield_pct_latest,
       ROUND(l.npi_yield_pct - b.npi_yield_pct, 2)                                                     AS npi_yield_change_pp,
       b.cost_of_debt, l.cost_of_debt AS cost_of_debt_latest,
       ROUND(l.cost_of_debt::numeric - b.cost_of_debt::numeric, 2)                                     AS cost_of_debt_change_pp,
       b.carry_spread_pp, l.carry_spread_pp AS carry_spread_pp_latest,
       ROUND(l.carry_spread_pp - b.carry_spread_pp, 2)                                                 AS carry_spread_change_pp,
       b.net_distributable_income AS ndi_base,
       l.net_distributable_income AS ndi_latest,
       ROUND((l.net_distributable_income::numeric / NULLIF(b.net_distributable_income, 0) - 1) * 100, 2) AS ndi_growth_pct,
       b.number_of_shareholder_units AS units_base,
       l.number_of_shareholder_units AS units_latest,
       ROUND((l.number_of_shareholder_units::numeric / NULLIF(b.number_of_shareholder_units, 0) - 1) * 100, 2) AS unit_growth_pct,
       b.distribution_per_unit AS dpu_base,
       l.distribution_per_unit AS dpu_latest,
       ROUND((l.distribution_per_unit::numeric / NULLIF(b.distribution_per_unit, 0) - 1) * 100, 2)     AS dpu_growth_pct,
       b.aggregate_leverage AS leverage_base, l.aggregate_leverage AS leverage_latest,
       b.interest_coverage_ratio AS icr_base, l.interest_coverage_ratio AS icr_latest,
       b.portfolio_occupancy AS occupancy_base, l.portfolio_occupancy AS occupancy_latest,
       b.weighted_average_lease_expiry AS wale_base, l.weighted_average_lease_expiry AS wale_latest,
       b.net_asset_value_per_unit AS nav_base, l.net_asset_value_per_unit AS nav_latest,
       b.npi_margin_pct AS npi_margin_base, l.npi_margin_pct AS npi_margin_latest,
       (SELECT COUNT(*) FROM ranked) AS sample_size
FROM metrics b
JOIN metrics l ON l.symbol = b.symbol
WHERE b.financial_year = :fy_base
  AND l.financial_year = :fy_latest
ORDER BY l.portfolio_value DESC;
