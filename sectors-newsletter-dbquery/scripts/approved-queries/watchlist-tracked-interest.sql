-- APPROVED fixed query: watchlist-tracked-interest
-- Approved: 2026-07-16
--
-- Supports the sibling sectors-newsletter-generator skill's personalized ticker/sector
-- performance + peer comparison newsletter. This query only supplies the audience and
-- their tracked tickers/sectors, it does not draft anything itself, this is not a
-- dbquery-owned lifecycle email issue type.
--
-- Returns, per active user, the deduped union of tracked tickers and sectors from
-- BOTH user_watchlist and active (is_active = true) user_workflow rows. Eligibility:
-- at least one tracked ticker OR sector across either source. No is_staff filter.
--
-- KNOWN DATA-QUALITY CAVEAT (pending upstream DB cleanup, confirmed against real
-- rows 2026-07-16): tickers are inconsistently suffixed (.JK for IDX, .SI or a bare
-- code for SGX, e.g. "O39" and "O39.SI" both seen for the same underlying stock), and
-- sectors have case duplicates ("Banks" vs "banks"). Left as a raw pass-through
-- deliberately, do not normalize here, revisit once the source DB is amended and
-- ticker suffixes / sector casing are standardized.
--
-- This is the ONLY query this skill may run for watchlist-tracked-interest. Never
-- edit ad hoc; edits require re-approval, see ../../references/supabase-access.md.

WITH ticker_union AS (
  SELECT user_id, jsonb_array_elements_text(tickers) AS ticker
  FROM user_watchlist WHERE tickers IS NOT NULL
  UNION
  SELECT user_id, unnest(tickers) AS ticker
  FROM user_workflow WHERE is_active = true AND tickers IS NOT NULL
),
sector_union AS (
  SELECT user_id, jsonb_array_elements_text(sectors) AS sector
  FROM user_watchlist WHERE sectors IS NOT NULL
  UNION
  SELECT user_id, unnest(sectors) AS sector
  FROM user_workflow WHERE is_active = true AND sectors IS NOT NULL
),
per_user_tickers AS (
  SELECT user_id, array_agg(DISTINCT ticker) AS tickers FROM ticker_union GROUP BY user_id
),
per_user_sectors AS (
  SELECT user_id, array_agg(DISTINCT sector) AS sectors FROM sector_union GROUP BY user_id
)
SELECT
  u.id AS user_id,
  u.email,
  split_part(u.full_name, ' ', 1) AS first_name,
  coalesce(t.tickers, ARRAY[]::text[]) AS tickers,
  coalesce(s.sectors, ARRAY[]::text[]) AS sectors
FROM api_user u
LEFT JOIN per_user_tickers t ON t.user_id = u.id
LEFT JOIN per_user_sectors s ON s.user_id = u.id
WHERE u.is_active = true
  AND (coalesce(array_length(t.tickers,1),0) > 0 OR coalesce(array_length(s.sectors,1),0) > 0)
ORDER BY u.id
LIMIT 50;
