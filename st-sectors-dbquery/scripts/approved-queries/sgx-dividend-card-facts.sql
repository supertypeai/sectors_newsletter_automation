-- Fixed query: per-ticker facts for an SGX upcoming-dividend card set. Approved 2026-08-28.
--
-- One row per SGX ticker whose ex-date falls inside the range, with the numbers a
-- dividend card needs: payout ratio, forward dividend yield, latest close, and the
-- earliest ex-date in the window. A ticker declaring two components (interim plus
-- special, taxable plus tax-exempt) collapses to one row here by design; use
-- upcoming-dividends-by-date-range when the individual components matter.
--
-- payout_ratio, forward_dividend_yield, dividend_ttm and dividend_yield_5y_avg come
-- from sgx_companies as decimals (0.45 is 45 percent), not percentages. currency is
-- the company's reporting currency, which is often NOT the SGD the counter trades in,
-- so never print it next to close. close is the last row in sgx_daily_data, and
-- price_date is returned so the card can state the as-of date honestly.
--
-- payout_ratio above 1.0 means the declared dividend exceeds earnings, funded from
-- reserves, prior-year profit, or in a REIT's case distributable income that sits
-- above accounting profit. Above 1.0 is a real signal worth showing, not a data error.
--
-- Placeholders: {{start_date}}, {{end_date}} as 'YYYY-MM-DD' bounding the ex-date.
--
-- Returns: symbol, name, payout_ratio, dividend_ttm, forward_dividend_yield,
-- dividend_yield_5y_avg, currency, close, price_date, ex_date.
SELECT d.symbol, c.name, c.payout_ratio, c.dividend_ttm, c.forward_dividend_yield,
       c.dividend_yield_5y_avg, c.currency, p.close, p.date AS price_date,
       min(d.ex_date) AS ex_date
FROM sgx_upcoming_dividend d
LEFT JOIN sgx_companies c ON c.symbol = d.symbol
LEFT JOIN LATERAL (
  SELECT close, date FROM sgx_daily_data x WHERE x.symbol = d.symbol ORDER BY date DESC LIMIT 1
) p ON true
WHERE d.ex_date BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY d.symbol, c.name, c.payout_ratio, c.dividend_ttm, c.forward_dividend_yield,
         c.dividend_yield_5y_avg, c.currency, p.close, p.date
ORDER BY ex_date, d.symbol;
