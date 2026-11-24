-- name:        sgx-reit-yield-decomposition-dpu-units-price
-- computes:    per-REIT decomposition of the change in trailing distribution yield into
--              its three drivers: distribution-per-unit growth, unit-count growth
--              (dilution), and price change. Yield is DPU divided by the close on or
--              before the trust's own financial-year end.
-- universe:    SGX-listed REITs in sgx_reit_profile with a sgx_reit_performance row in
--              BOTH financial years carrying non-null distribution_per_unit and
--              units_in_issue, and a close in sgx_daily_data within 10 trading days
--              before each period end
-- window:      parameterised, {{fy_base}} to {{fy_latest}} (bigint financial_year)
-- exclusions:  trusts present in only one financial year; null DPU or units_in_issue;
--              no close inside the 10-day lookback of either period end
-- caveats:     (1) units_to_be_issued is populated for roughly 20 of 35 trusts, so the
--              units_incl_pending columns are returned separately and must never be
--              mixed into the headline unit_growth_pct.
--              (2) Financial year ends differ across trusts (Sep, Dec, Mar, Jun), so a
--              single FY column spans period ends from 2025-09-30 to 2026-03-31, and
--              the price snapshots differ accordingly. period_end dates are returned.
--              (3) Yield here is trailing on declared DPU, not the forward yield quoted
--              on a screener, so it will not tie to a live yield table.
--              (4) Trusts reporting in a non-SGD currency are returned with currency so
--              the caller can drop them; DPU and price must share a currency to divide.
--              (5) UNITS: distribution_per_unit is stored in CENTS of the reporting
--              currency for these trusts, so yield_base_pct / yield_latest_pct come out
--              100x too large and MUST be divided by 100 before publication. The columns
--              are left unscaled here because the convention is not uniform upstream and
--              a silent divide would hide a bad row.
--              (6) CONSOLIDATIONS: unit_growth_pct cannot tell a unit consolidation from
--              a buyback. Any trust whose unit count moves more than about 20 percent must
--              be checked against filings before its dilution figure is used.
--              (7) SPLIT SYMBOLS: ESR-REIT is present under TWO symbols and is silently
--              dropped by the symbol join. J91U.SI was retired after a 10-for-1
--              consolidation and carries the sgx_reit_performance and sgx_reit_profile
--              rows but no prices; 9A4U.SI carries the price history (632 rows from
--              2024-03-04) but no fundamentals. Do NOT simply alias the two: the 9A4U
--              series spans the consolidation date, so pairing a pre-consolidation DPU
--              with a post-consolidation close (or the reverse) puts the yield out by a
--              factor of ten. Resolving this needs a data-layer fix and a check of
--              whether the price series is consolidation-adjusted.
-- statistic:   per-trust levels and year-on-year changes, no aggregate
-- reviewed:    2026-09-08, approved by user in session
-- used by:     2026-09-08_carousel_sgx-reit-yield-decomposition

WITH perf AS (
    SELECT f.symbol,
           c.name,
           c.currency,
           p.sub_sector,
           f.financial_year,
           f.date::date                              AS period_end,
           f.distribution_per_unit                   AS dpu,
           f.units_in_issue                          AS units,
           f.units_to_be_issued                      AS units_pending,
           f.portfolio_value,
           f.aggregate_leverage,
           f.cost_of_debt
    FROM sgx_reit_performance f
    JOIN sgx_reit_profile p ON p.symbol = f.symbol
    JOIN sgx_companies    c ON c.symbol = f.symbol
    WHERE f.financial_year IN ({{fy_base}}, {{fy_latest}})
      AND f.distribution_per_unit IS NOT NULL
      AND f.units_in_issue        IS NOT NULL
),
priced AS (
    SELECT pf.*,
           (SELECT d.close
              FROM sgx_daily_data d
             WHERE d.symbol = pf.symbol
               AND d.date <= pf.period_end
               AND d.date >  pf.period_end - INTERVAL '10 days'
             ORDER BY d.date DESC
             LIMIT 1)                                AS close_at_period_end
    FROM perf pf
)
SELECT b.symbol,
       b.name,
       b.sub_sector,
       b.currency,
       b.period_end                                                              AS base_period_end,
       l.period_end                                                              AS latest_period_end,
       b.dpu                                                                     AS dpu_base,
       l.dpu                                                                     AS dpu_latest,
       ROUND((l.dpu::numeric / NULLIF(b.dpu::numeric, 0) - 1) * 100, 2)                    AS dpu_growth_pct,
       b.units                                                                   AS units_base,
       l.units                                                                   AS units_latest,
       ROUND((l.units::numeric / NULLIF(b.units, 0) - 1) * 100, 2)                AS unit_growth_pct,
       b.units + COALESCE(b.units_pending, 0)                                    AS units_incl_pending_base,
       l.units + COALESCE(l.units_pending, 0)                                    AS units_incl_pending_latest,
       (b.units_pending IS NOT NULL AND l.units_pending IS NOT NULL)             AS units_pending_both_years,
       ROUND(b.dpu::numeric * b.units, 0)                                        AS distribution_pool_base,
       ROUND(l.dpu::numeric * l.units, 0)                                        AS distribution_pool_latest,
       ROUND(((l.dpu::numeric * l.units) / NULLIF(b.dpu::numeric * b.units, 0) - 1) * 100, 2) AS distribution_pool_growth_pct,
       b.close_at_period_end                                                     AS price_base,
       l.close_at_period_end                                                     AS price_latest,
       ROUND((l.close_at_period_end::numeric / NULLIF(b.close_at_period_end::numeric, 0) - 1) * 100, 2) AS price_change_pct,
       ROUND((b.dpu::numeric / NULLIF(b.close_at_period_end::numeric, 0)) * 100, 2)        AS yield_base_pct,
       ROUND((l.dpu::numeric / NULLIF(l.close_at_period_end::numeric, 0)) * 100, 2)        AS yield_latest_pct,
       ROUND((l.dpu::numeric / NULLIF(l.close_at_period_end::numeric, 0)) * 100
           - (b.dpu::numeric / NULLIF(b.close_at_period_end::numeric, 0)) * 100, 2)        AS yield_change_pp,
       b.aggregate_leverage AS leverage_base, l.aggregate_leverage AS leverage_latest,
       b.cost_of_debt       AS cost_of_debt_base, l.cost_of_debt AS cost_of_debt_latest,
       l.portfolio_value    AS portfolio_value_latest
FROM priced b
JOIN priced l ON l.symbol = b.symbol
WHERE b.financial_year = {{fy_base}}
  AND l.financial_year = {{fy_latest}}
  AND b.close_at_period_end IS NOT NULL
  AND l.close_at_period_end IS NOT NULL
ORDER BY yield_change_pp DESC NULLS LAST;
