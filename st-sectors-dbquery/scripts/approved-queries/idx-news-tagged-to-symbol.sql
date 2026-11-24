-- name:         idx-news-tagged-to-symbol
-- computes:     every IDX news article tagged to one symbol inside a date window, oldest first: id, title, source, sector, publish date
-- universe:     one symbol, {{symbol}} (with .JK suffix), rows in idx_news whose symbols array contains it
-- window:       parameterised, timestamp >= {{start_date}} and < {{end_date}} (end exclusive)
-- exclusions:   none; every tagged article in the window is returned (includes the exchange's own announcement PDFs, source host idx.co.id)
-- approved:     2026-10-13, Evelyn
-- used by:      indonesia/news redesign mockup (insider filings with tagged news)
select n.id, n.title, n.source, n.sector, n.timestamp::date::text as published_on
from idx_news n
where '{{symbol}}' = any(n.symbols)
  and n.timestamp >= '{{start_date}}'
  and n.timestamp < '{{end_date}}'
order by n.timestamp asc, n.id asc
