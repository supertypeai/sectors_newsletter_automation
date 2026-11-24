-- Fixed query: announced-but-unpaid dividends across IDX and SGX whose ex-date OR
-- payment date falls inside an arbitrary date range. Approved 2026-08-28.
--
-- Sources: idx_upcoming_dividend and sgx_upcoming_dividend, the two tables holding
-- dividends declared but not yet paid. Names joined from idx_company_profile /
-- sgx_companies. A ticker can appear more than once in a period: one row per
-- declared component (an interim plus a special, or a taxable plus a tax-exempt
-- tranche), and those rows must not be summed blindly into a single DPS.
--
-- The OR is deliberate. "Dividends in September" means two different calendars: the
-- ex-date calendar (buy by then to receive it) and the payment calendar (cash lands
-- then). A row can qualify on either. Filter on the caller's side if only one is wanted.
--
-- cum_date is IDX-only, NULL for SGX rows. dividend_amount is per share in the
-- listing currency: rupiah for IDX, SGD (or the counter's currency) for SGX, never
-- mix or compare the two columns across markets.
--
-- Placeholders: {{start_date}}, {{end_date}} as 'YYYY-MM-DD'.
--
-- Returns: market, symbol, company_name, ex_date, cum_date, recording_date,
-- payment_date, dividend_amount. Ordered by ex_date.
SELECT 'IDX' AS market, d.symbol, c.company_name, d.ex_date, d.cum_date, d.recording_date, d.payment_date, d.dividend_amount
FROM idx_upcoming_dividend d
LEFT JOIN idx_company_profile c ON c.symbol = d.symbol
WHERE d.ex_date BETWEEN '{{start_date}}' AND '{{end_date}}' OR d.payment_date BETWEEN '{{start_date}}' AND '{{end_date}}'
UNION ALL
SELECT 'SGX' AS market, d.symbol, s.name, d.ex_date, NULL::date AS cum_date, d.recording_date, d.payment_date, d.dividend_amount
FROM sgx_upcoming_dividend d
LEFT JOIN sgx_companies s ON s.symbol = d.symbol
WHERE d.ex_date BETWEEN '{{start_date}}' AND '{{end_date}}' OR d.payment_date BETWEEN '{{start_date}}' AND '{{end_date}}'
ORDER BY ex_date NULLS LAST, market, symbol;
