-- name:         upcoming-corporate-events-by-date-range
-- computes:     shareholder meetings (AGM and EGM, IDX and SGX), IPO listings and IDX stock
--               splits whose event date falls inside {{start_date}} to {{end_date}}, one row per event
-- universe:     idx_agm, sgx_agm (meeting_type gives AGM or EGM), idx_ipo_details by listing_date,
--               idx_stock_split by split date; names from idx_company_profile / sgx_companies
-- window:       parameterised, 'YYYY-MM-DD'
-- exclusions:   none; cancelled meetings are returned as filed (agm_place can read "Dibatalkan"),
--               and a symbol can hold more than one meeting on different dates
-- survivorship: not applicable, forward-looking calendar
-- columns:      kind, market, symbol, company_name, event_date, detail (time, ratio or offer price),
--               place, secondary_date (recording, cum or offering start)
-- approved:     2026-10-14, user confirmed at the execute_sql prompt
-- used by:      news page mockup, Upcoming block
select 'AGM' as kind, 'IDX' as market, a.symbol, c.company_name, a.agm_date::text as event_date,
       a.agm_time::text as detail, a.agm_place as place, a.recording_date::text as secondary_date
from idx_agm a left join idx_company_profile c on c.symbol = a.symbol
where a.agm_date between '{{start_date}}' and '{{end_date}}'
union all
select coalesce(g.meeting_type, 'AGM'), 'SGX', g.symbol, s.name, g.agm_date::text, g.agm_time::text, g.agm_place, g.recording_date::text
from sgx_agm g left join sgx_companies s on s.symbol = g.symbol
where g.agm_date between '{{start_date}}' and '{{end_date}}'
union all
select 'IPO', 'IDX', i.symbol, i.company_name, i.listing_date::text, i.offering_price::text, null, i.offering_start_date::text
from idx_ipo_details i
where i.listing_date between '{{start_date}}' and '{{end_date}}'
union all
select 'SPLIT', 'IDX', p.symbol, c.company_name, p.date::text, p.ratio, null, p.cum_date::text
from idx_stock_split p left join idx_company_profile c on c.symbol = p.symbol
where p.date between '{{start_date}}' and '{{end_date}}'
order by event_date, kind, symbol;
