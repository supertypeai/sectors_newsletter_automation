-- name:        sgx-reit-ytd-price-return
-- computes:    price return between the last close on or before {{base_date}} and the last
--              close on or before {{as_of_date}}, per SGX-listed REIT, plus latest market cap
-- universe:    symbols in sgx_reit_profile joined to sgx_companies, active and not suspended
-- window:      parameterised, {{base_date}} to {{as_of_date}}
-- exclusions:  symbols with no close on or before the base date, or a zero/null base close
-- caveat:      last_date is returned so a stale price series is visible; a REIT whose last
--              print is months old is not comparable to one printing daily
-- returns:     symbol, name, sub_sector, base_date, base_close, last_date, last_close,
--              ytd_price_return_pct, market_cap
-- note:        price return only, distributions excluded, so this is not total return
-- Approved 2026-09-08.

with base as (
  select d.symbol,
         (select close from sgx_daily_data x
           where x.symbol = d.symbol and x.date <= date '{{base_date}}'
             and x.close is not null
           order by x.date desc limit 1) as base_close,
         (select date from sgx_daily_data x
           where x.symbol = d.symbol and x.date <= date '{{base_date}}'
             and x.close is not null
           order by x.date desc limit 1) as base_date,
         (select close from sgx_daily_data x
           where x.symbol = d.symbol and x.date <= date '{{as_of_date}}'
             and x.close is not null
           order by x.date desc limit 1) as last_close,
         (select date from sgx_daily_data x
           where x.symbol = d.symbol and x.date <= date '{{as_of_date}}'
             and x.close is not null
           order by x.date desc limit 1) as last_date,
         (select market_cap from sgx_daily_data x
           where x.symbol = d.symbol and x.date <= date '{{as_of_date}}'
             and x.market_cap is not null and x.market_cap > 0
           order by x.date desc limit 1) as market_cap
  from (select distinct p.symbol from sgx_reit_profile p
        join sgx_companies c on c.symbol = p.symbol
        where coalesce(c.is_active, true) and not coalesce(c.is_suspended, false)) d
)
select b.symbol,
       c.name,
       p.sub_sector,
       b.base_date,
       b.base_close,
       b.last_date,
       b.last_close,
       round(((b.last_close - b.base_close) / b.base_close) * 100, 2) as ytd_price_return_pct,
       b.market_cap
from base b
join sgx_companies c on c.symbol = b.symbol
join sgx_reit_profile p on p.symbol = b.symbol
where b.base_close is not null and b.base_close > 0 and b.last_close is not null
order by ytd_price_return_pct desc;
