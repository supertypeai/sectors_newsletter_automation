-- name:         people-member-register-history
-- computes:     for every person in the people table and every symbol in their symbols
--               array, the person's own-name history on that symbol's IDX 1% register
--               across all snapshots: first and last snapshot where a holder name
--               contains the person's name, the percentage at the last such snapshot,
--               and the register's latest snapshot date, so a person who sold out can
--               be told apart from one who never appeared
-- universe:     people.symbols unnested, IDX symbols only (.JK)
-- window:       full idx_one_percent_ownership history
-- exclusions:   SGX symbols (no register history stored); name match is ilike on the
--               full person name, so vehicles and spelling variants do not match
-- survivorship: point-in-time snapshots as filed
-- statistic:    one row per person and symbol, nulls where the name never appeared
-- approved:     2026-10-27, user (confirmation prompt)
-- used by:      people table affiliation audit
with members as (
  select p.investor_name as person, p.slug, unnest(p.symbols) as symbol
  from people p
  where p.symbols is not null and array_length(p.symbols, 1) > 0
),
hits as (
  select m.slug, m.symbol, o.date, o.investor_name, o.percentage
  from members m
  join idx_one_percent_ownership o
    on o.symbol = m.symbol and o.investor_name ilike '%' || m.person || '%'
),
agg as (
  select slug, symbol, min(date) as first_seen, max(date) as last_seen
  from hits group by slug, symbol
)
select m.person, m.slug, m.symbol, a.first_seen::text, a.last_seen::text,
       (select round(h.percentage::numeric, 2) from hits h
         where h.slug = m.slug and h.symbol = m.symbol and h.date = a.last_seen
         order by h.percentage desc limit 1) as pct_at_last_seen,
       (select max(date) from idx_one_percent_ownership)::text as latest_snapshot
from members m
left join agg a on a.slug = m.slug and a.symbol = m.symbol
where m.symbol like '%.JK'
order by m.person, m.symbol;
