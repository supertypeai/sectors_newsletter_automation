-- Fixed query: market-wide weekly aggregated foreign flow, exchange definition.
-- Used by workflows/weekly-insights-v2.md's weekly foreign-flow finding/Key Data
-- Bites figure. Resolved 2026-07-27 (see that file, and memory
-- project_carousel_foreign_flow_bug): the exchange definition, volume-based off
-- idx_daily_data, is the one to use for weekly aggregated foreign flow. Never the
-- broker-domicile definition (idx_broker_summary_daily/idx_broker_registry,
-- what `foreign-flow/{symbol}` and `broker-summary/top` return) for this figure,
-- the two can disagree on direction, not just size, and mixing them in one issue
-- publishes a contradiction.
--
-- Replaces any temptation to loop `foreign-flow/{symbol}` per ticker per day; this
-- is one Supabase query, market-wide, for the whole week in one shot.
--
-- Verified live 2026-07-27 against 2026-07-13..2026-07-17 (5 trading days), exact
-- match to the cent against the earlier hand-checked figures: BMRI +563,164,779,000
-- (563.16B), ANTM +237,893,446,000 (237.89B), TPIA +237,826,354,500 (237.83B),
-- BBCA +145,616,167,500 (145.62B), ASII -534,215,772,000 (-534.22B),
-- MAPI -187,832,653,500 (-187.83B), BBRI -30,269,067,000 (-30.27B).
--
-- Params: replace {{start}} and {{end}} with 'YYYY-MM-DD' window bounds
-- (inclusive both ends), Mon-Fri for weekly-insights-v2.

select
  symbol,
  sum((foreign_buy_volume - foreign_sell_volume) * close) as net_foreign_flow,
  count(distinct date)                                    as days_active
from idx_daily_data
where date between '{{start}}' and '{{end}}'
group by symbol
order by net_foreign_flow desc;
-- Top rows = top net foreign buys, bottom rows (re-sort asc, or read from the
-- tail) = top net foreign sells. Filter to a specific ticker list with
-- `and symbol in ('BBCA.JK', 'BMRI.JK', ...)` when the figure only needs a named
-- few, not a market-wide ranking. Note the .JK suffix, bare tickers return zero
-- rows silently (no error), always confirm the suffix before trusting an empty
-- result.
--
-- Sanity check: days_active should equal the window's actual trading-day count
-- for every row (idx_daily_data only has trading-day rows, so this isn't a
-- weekend/holiday artifact). A symbol below that count was suspended or newly
-- listed mid-window, not a data gap, say so if it lands in a table.
--
-- This is public market data, not user-account data, so it does not go through
-- sectors-newsletter-dbquery's PII-only approved-queries gate (see that skill's
-- references/supabase-access.md). Still read-only, run via the Supabase MCP
-- connector's query tool, never write.
