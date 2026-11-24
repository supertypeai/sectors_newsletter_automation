-- Fixed query: SGX market-cap ranking as of a date, one row per active counter.
-- Approved 2026-08-28.
--
-- Ranks every active SGX counter by its most recent market_cap in sgx_daily_data
-- within a 10-day lookback of {{as_of_date}}. The lookback exists because a thinly
-- traded counter may not print every session, and taking a strict single-day snapshot
-- silently drops it from the universe, which quietly inflates every rank below it.
--
-- Counters with a null or zero market_cap and those flagged inactive in sgx_companies
-- are excluded, so mcap_rank runs 1..universe_size over a clean universe. Both the
-- rank and universe_size are returned: a rank is meaningless in a piece without the
-- denominator, and that denominator moves as listings come and go.
--
-- rank() not row_number(), so tied market caps share a rank rather than being split
-- by an arbitrary tiebreak.
--
-- market_cap is in SGD. date is the actual price date behind each row and can differ
-- between counters inside the lookback window, so state it when a piece cites a rank.
--
-- Placeholder: {{as_of_date}} as 'YYYY-MM-DD'. Filter to specific symbols on the
-- caller's side.
--
-- Returns: symbol, name, market_cap, date, mcap_rank, universe_size.
WITH latest AS (
  SELECT DISTINCT ON (d.symbol) d.symbol, d.market_cap, d.date
  FROM sgx_daily_data d
  WHERE d.date >= '{{as_of_date}}'::date - 10
  ORDER BY d.symbol, d.date DESC
),
ranked AS (
  SELECT l.symbol, c.name, l.market_cap, l.date,
         rank() OVER (ORDER BY l.market_cap DESC NULLS LAST) AS mcap_rank
  FROM latest l
  JOIN sgx_companies c ON c.symbol = l.symbol
  WHERE c.is_active IS NOT FALSE AND l.market_cap IS NOT NULL AND l.market_cap > 0
)
SELECT symbol, name, market_cap, date, mcap_rank,
       (SELECT count(*) FROM ranked) AS universe_size
FROM ranked
ORDER BY mcap_rank;
