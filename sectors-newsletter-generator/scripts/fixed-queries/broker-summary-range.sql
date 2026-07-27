-- Fixed query: market-wide aggregated broker summary over a date range.
-- Used by workflows/monthly-market-pulse.md Broker Flow section (and any other
-- issue type that needs a multi-day broker net-buy/net-sell ranking, e.g. a
-- weekly window for weekly-insights-v2 or weekly-wrap).
--
-- Replaces the old per-day `brokers/top` API loop (no range param exists on that
-- endpoint) with one Supabase query against idx_broker_summary_daily, summed
-- market-wide (every symbol) per broker_code across the window, joined to
-- idx_broker_registry for the display name.
--
-- Verified live 2026-07-27 against 2026-07-13..2026-07-17 (5 trading days):
-- top net buyer BB (Verdhana Sekuritas Indonesia) +612.12B, matches days_active=5
-- for every row, confirming no partial-week rows sneak in.
--
-- Params: replace {{start}} and {{end}} with 'YYYY-MM-DD' window bounds
-- (inclusive both ends). {{limit}} is the number of rows per side (buyers/sellers).
--
-- This is a read-only aggregate over public market data, not user-account data,
-- so it does not go through sectors-newsletter-dbquery's approved-queries gate;
-- that gate is for PII only (see dbquery's references/supabase-access.md). Still
-- run it via the Supabase MCP connector's read-only query tool, never write.

with agg as (
  select
    broker_code,
    sum(bval)                as buy_val,
    sum(sval)                as sell_val,
    sum(nval)                as net_val,
    count(distinct date)     as days_active
  from idx_broker_summary_daily
  where date between '{{start}}' and '{{end}}'
  group by broker_code
)
select
  a.broker_code,
  r.broker_name,
  a.buy_val,
  a.sell_val,
  a.net_val,
  a.days_active
from agg a
left join idx_broker_registry r on r.broker_code = a.broker_code
order by a.net_val desc;
-- Top {{limit}} rows (by net_val desc) = top net buyers.
-- Bottom {{limit}} rows (by net_val asc, i.e. re-run with `order by a.net_val asc`)
-- = top net sellers. One query covers both; slice client-side rather than
-- running it twice.

-- Sanity check before trusting a run: days_active should equal the number of
-- actual trading days in the window for every broker row (weekends/holidays
-- already excluded since idx_broker_summary_daily only has trading-day rows).
-- If a broker's days_active is lower than the rest, that broker sat out some
-- sessions, not a data gap, state it that way if it comes up in copy.
