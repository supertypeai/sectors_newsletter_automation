-- name:         idx-last-close-market-snapshot
-- computes:     index moves, breadth, total market cap and the top movers of the latest trading day against the one before it
-- universe:     indices in index_daily_data (all codes, IDX and others) for the 'index' rows; IDX stocks in idx_daily_data
--               with market_cap >= {{min_mcap}} (IDR), volume > 0 and a prior-day close > 0 for gainer, loser, active and breadth rows
-- window:       latest date in each table against the latest earlier date
-- exclusions:   zero-volume stocks; stocks under the market-cap floor (use 5000000000000, Rp5T, for the news page)
-- survivorship: not applicable, single-day snapshot
-- statistic:    percent change of close; breadth row carries counts up (close col) and down (prev col) and the summed market
--               cap now and previous day (mcap and value cols) over the filtered universe only, not the whole exchange
-- approved:     2026-10-14, user confirmed at the execute_sql prompt
-- used by:      news page mockup, Day view market block
with ld as (select max(date) as d from index_daily_data),
pd as (select max(date) as p from index_daily_data where date < (select d from ld)),
sd as (select max(date) as d from idx_daily_data),
sp as (select max(date) as p from idx_daily_data where date < (select d from sd)),
m as (
  select t.symbol, c.company_name, t.close::float8 as close, y.close::float8 as prev, t.market_cap::float8 as mcap, y.market_cap::float8 as prev_mcap, t.value::float8 as value,
         ((t.close::float8 / nullif(y.close::float8, 0) - 1) * 100)::float8 as pct
  from idx_daily_data t
  join idx_daily_data y on y.symbol = t.symbol and y.date = (select p from sp)
  left join idx_company_profile c on c.symbol = t.symbol
  where t.date = (select d from sd) and t.volume > 0 and y.close > 0 and t.market_cap >= {{min_mcap}}
)
select 'index' as kind, i.index_code as symbol, i.index_name as name, i.price::float8 as close, pi.price::float8 as prev,
       round(((i.price::float8 / nullif(pi.price::float8, 0) - 1) * 100)::numeric, 2)::float8 as pct, null::float8 as mcap, null::float8 as value, i.date::text as as_of
from index_daily_data i join index_daily_data pi on pi.index_code = i.index_code and pi.date = (select p from pd)
where i.date = (select d from ld)
union all
select 'breadth', 'up', null, count(*) filter (where pct > 0)::float8, count(*) filter (where pct < 0)::float8, null, sum(mcap), sum(prev_mcap), (select d from sd)::text from m
union all
(select 'gainer', symbol, company_name, close, prev, round(pct::numeric, 2)::float8, mcap, value, (select d from sd)::text from m order by pct desc limit 5)
union all
(select 'loser', symbol, company_name, close, prev, round(pct::numeric, 2)::float8, mcap, value, (select d from sd)::text from m order by pct asc limit 5)
union all
(select 'active', symbol, company_name, close, prev, round(pct::numeric, 2)::float8, mcap, value, (select d from sd)::text from m order by value desc limit 5);
