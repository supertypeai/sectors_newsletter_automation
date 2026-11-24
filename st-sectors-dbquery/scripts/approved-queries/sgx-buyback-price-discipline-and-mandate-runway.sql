-- name:         sgx-buyback-price-discipline-and-mandate-runway
-- computes:     per-ticker SGX buyback execution quality over a window: average price
--               paid against the latest close and against the window's own price range,
--               plus mandate consumption normalised by how far the mandate period has run
-- universe:     SGX tickers with >=1 sgx_buybacks row inside the window that also have
--               price history in sgx_daily_data
-- window:       parameterised, {{start_date}} to {{end_date}}
-- mandate:      mandate_total and cumulative_purchased are SHARE COUNTS scoped to the
--               CURRENT mandate period, not the calendar window, and reset on renewal.
--               mandate_used is therefore only meaningful next to mandate_start,
--               mandate_end and period_elapsed_pct; a company that renewed recently
--               shows low usage regardless of how aggressively it has been buying.
-- exclusions:   purchase_date before 1990-01-01 (source has corrupt century-0 dates);
--               rows with null or non-positive total_value or total_shares_purchased;
--               tickers with no sgx_daily_data close inside the window
-- survivorship: none applied, point-in-time snapshot; delisted and suspended names are
--               retained if they bought and still have price history
-- statistic:    volume-weighted average price paid per ticker, its gap to latest close,
--               its percentile position in the window's daily close range, and mandate
--               consumption against elapsed mandate time; buy_days returned as sample size
-- approved:     2026-09-01, evelyn
-- used by:      sgx-buyback-concentration carousel
with bounds as (
  select {{start_date}}::date as d0, {{end_date}}::date as d1
),
buys as (
  select b.symbol,
         sum(b.total_value)::numeric            as total_value,
         sum(b.total_shares_purchased)::numeric as total_shares,
         count(distinct b.purchase_date)        as buy_days,
         min(b.purchase_date)                   as first_buy,
         max(b.purchase_date)                   as last_buy
  from sgx_buybacks b, bounds bb
  where b.purchase_date between bb.d0 and bb.d1
    and b.purchase_date >= date '1990-01-01'
    and b.total_value > 0
    and b.total_shares_purchased > 0
  group by b.symbol
),
mandate_now as (
  select distinct on (b.symbol)
         b.symbol,
         (b.mandate->>'mandate_total')::numeric        as mandate_total,
         (b.mandate->>'cumulative_purchased')::numeric as mandate_used_shares,
         (b.mandate->>'mandate_remaining')::numeric    as mandate_remaining,
         (b.mandate->>'mandate_start')::date           as mandate_start,
         (b.mandate->>'mandate_end')::date             as mandate_end
  from sgx_buybacks b, bounds bb
  where b.purchase_date between bb.d0 and bb.d1
    and b.purchase_date >= date '1990-01-01'
  order by b.symbol, b.purchase_date desc
),
px as (
  select d.symbol,
         min(d.close) filter (where d.close > 0) as low_close,
         max(d.close)                            as high_close,
         avg(d.close)                            as mean_close
  from sgx_daily_data d, bounds b
  where d.date between b.d0 and b.d1
  group by d.symbol
),
last_px as (
  select distinct on (d.symbol) d.symbol, d.close as latest_close, d.date as latest_date
  from sgx_daily_data d, bounds b
  where d.date between b.d0 and b.d1
  order by d.symbol, d.date desc
)
select bu.symbol,
       co.name as company,
       bu.total_value,
       bu.total_shares,
       bu.buy_days,
       bu.first_buy,
       bu.last_buy,
       bu.total_value / nullif(bu.total_shares, 0)            as avg_price_paid,
       lp.latest_close,
       lp.latest_date,
       (bu.total_value / nullif(bu.total_shares, 0)) / nullif(lp.latest_close, 0) - 1
                                                              as paid_vs_latest_close,
       (bu.total_value / nullif(bu.total_shares, 0)) / nullif(px.mean_close, 0) - 1
                                                              as paid_vs_window_mean,
       ((bu.total_value / nullif(bu.total_shares, 0)) - px.low_close)
         / nullif(px.high_close - px.low_close, 0)            as paid_range_percentile,
       px.low_close,
       px.high_close,
       mn.mandate_total,
       mn.mandate_used_shares,
       mn.mandate_used_shares / nullif(mn.mandate_total, 0)   as mandate_used_pct,
       mn.mandate_start,
       mn.mandate_end,
       (mn.mandate_end - mn.mandate_start)                    as mandate_days_total,
       greatest(mn.mandate_end - {{as_of_date}}::date, 0)     as mandate_days_left,
       case when (mn.mandate_end - mn.mandate_start) > 0
            then least(greatest(({{as_of_date}}::date - mn.mandate_start)::numeric
                 / (mn.mandate_end - mn.mandate_start), 0), 1)
       end                                                    as period_elapsed_pct
from buys bu
left join mandate_now mn on mn.symbol = bu.symbol
left join px          on px.symbol = bu.symbol
left join last_px lp  on lp.symbol = bu.symbol
left join sgx_companies co on co.symbol = bu.symbol
where lp.latest_close is not null
order by bu.total_value desc;
