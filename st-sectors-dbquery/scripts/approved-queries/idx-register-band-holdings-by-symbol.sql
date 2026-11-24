-- name:         idx-register-band-holdings-by-symbol
-- computes:     per IDX company, the share of issued shares held by register entries in the
--               1% to 5% band and at 5% or more, with entry counts, the individual-holder
--               share of the 1% to 5% band, and latest market cap, so a caller can deduct the
--               1% to 5% band from the exchange-reported free float
-- universe:     every symbol on the latest idx_one_percent_ownership snapshot
-- window:       latest register snapshot; latest price within 14 days of the last trading date
-- exclusions:   none; symbols without a price return a null market cap
-- survivorship: point-in-time, the register snapshot is taken as filed
-- statistic:    sums and counts per symbol; sample size is the row count
-- approved:     2026-10-27, Evelyn (confirmation prompt)
-- used by:      free-float-on-the-idx (ownership series part 3)
with snap as (
  select max(date) as snapshot_date from idx_one_percent_ownership
),
px as (
  select max(date) as last_date from idx_daily_data
),
mc as (
  select distinct on (d.symbol) d.symbol, d.market_cap
  from idx_daily_data d, px
  where d.date between px.last_date - 14 and px.last_date
  order by d.symbol, d.date desc
)
select
  o.symbol,
  count(*) as entries_all,
  count(*) filter (where o.percentage >= 1 and o.percentage < 5) as entries_1_to_5,
  round(coalesce(sum(o.percentage) filter (where o.percentage >= 1 and o.percentage < 5), 0)::numeric, 2) as pct_1_to_5,
  round(coalesce(sum(o.percentage) filter (where o.percentage >= 1 and o.percentage < 5 and o.investor_type = 'Individual'), 0)::numeric, 2) as pct_1_to_5_individual,
  round(coalesce(sum(o.percentage) filter (where o.percentage >= 5), 0)::numeric, 2) as pct_5_plus,
  m.market_cap,
  (select snapshot_date from snap) as snapshot_date
from idx_one_percent_ownership o
join snap on o.date = snap.snapshot_date
left join mc m on m.symbol = o.symbol
group by o.symbol, m.market_cap
order by o.symbol;
