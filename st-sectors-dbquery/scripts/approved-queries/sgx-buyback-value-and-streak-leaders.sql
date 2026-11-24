-- name:         sgx-buyback-value-and-streak-leaders
-- computes:     per-ticker SGX share buyback leaderboards over a window, two rankings
--               side by side: total consideration paid, and current consecutive
--               trading-day buying streak
-- universe:     SGX tickers with >=1 sgx_buybacks row inside the window
-- window:       parameterised, {{start_date}} to {{end_date}}
-- calendar:     streaks counted against actual SGX trading days from sgx_daily_data,
--               so a weekend or public holiday does not break a run
-- streak:       CURRENT run only, counted backwards from the ticker's most recent buy
--               in the window; a ticker that stopped buying keeps the streak it ended on.
--               A streak whose streak_start equals the window start is left-censored and
--               may have begun earlier, widen the window before publishing it.
-- exclusions:   purchase_date before 1990-01-01 (source has corrupt century-0 dates);
--               rows with null or non-positive total_value or total_shares_purchased
-- survivorship: none applied, the window is a point-in-time snapshot of announced
--               buybacks; delisted and suspended names are retained if they bought
-- statistic:    sum and count per ticker, plus rank on each dimension; row count of the
--               underlying trade rows returned as trades
-- approved:     2026-09-01, evelyn
-- used by:      sgx buyback leaderboard (ad-hoc), st-sectors-carousel buyback stories
with bounds as (
  select {{start_date}}::date as d0, {{end_date}}::date as d1
),
cal as (
  select purchase_date, row_number() over (order by purchase_date) as day_no
  from (
    select distinct d.date::date as purchase_date
    from sgx_daily_data d, bounds b
    where d.date::date between b.d0 and b.d1
  ) s
),
trades as (
  select b.symbol,
         b.purchase_date,
         sum(b.total_value)::numeric            as day_value,
         sum(b.total_shares_purchased)::numeric as day_shares,
         count(*)                               as day_trades,
         max((b.mandate->>'cumulative_purchased')::numeric) as cumulative_purchased,
         max((b.mandate->>'mandate_total')::numeric)        as mandate_total,
         max(b.mandate->>'mandate_end')                     as mandate_end
  from sgx_buybacks b, bounds bb
  where b.purchase_date between bb.d0 and bb.d1
    and b.purchase_date >= date '1990-01-01'
    and b.total_value > 0
    and b.total_shares_purchased > 0
  group by b.symbol, b.purchase_date
),
totals as (
  select symbol,
         sum(day_value)  as total_value,
         sum(day_shares) as total_shares,
         sum(day_trades) as trades,
         count(*)        as buy_days,
         max(purchase_date) as last_buy_date
  from trades group by symbol
),
runs as (
  select t.symbol, t.purchase_date, c.day_no,
         c.day_no - row_number() over (partition by t.symbol order by c.day_no) as grp
  from trades t join cal c using (purchase_date)
),
current_streak as (
  select r.symbol, count(*) as streak_days,
         min(r.purchase_date) as streak_start,
         max(r.purchase_date) as streak_end
  from runs r
  join (
    select symbol, grp
    from (select symbol, grp, day_no,
                 row_number() over (partition by symbol order by day_no desc) as rn
          from runs) z
    where rn = 1
  ) last_grp on last_grp.symbol = r.symbol and last_grp.grp = r.grp
  group by r.symbol
),
latest_mandate as (
  select distinct on (symbol) symbol, cumulative_purchased, mandate_total, mandate_end
  from trades order by symbol, purchase_date desc
)
select tot.symbol,
       co.name                                     as company,
       tot.total_value,
       tot.total_shares,
       tot.trades,
       tot.buy_days,
       tot.total_value / nullif(tot.total_shares, 0) as avg_price_paid,
       tot.last_buy_date,
       coalesce(cs.streak_days, 0)                  as streak_days,
       cs.streak_start,
       cs.streak_end,
       lm.cumulative_purchased / nullif(lm.mandate_total, 0) as mandate_used,
       lm.mandate_end,
       rank() over (order by tot.total_value desc)                          as rank_by_value,
       rank() over (order by coalesce(cs.streak_days, 0) desc,
                             tot.total_value desc)                          as rank_by_streak
from totals tot
left join current_streak cs on cs.symbol = tot.symbol
left join latest_mandate lm on lm.symbol = tot.symbol
left join sgx_companies co   on co.symbol = tot.symbol
order by tot.total_value desc;
