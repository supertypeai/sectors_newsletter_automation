-- name:         people-dropped-off-symbol-filings
-- computes:     for every person-symbol pair in the people table where the person's own
--               name appeared on the IDX 1% register in an earlier snapshot but not in the
--               latest one, every insider filing on that symbol filed from {{since}} onward,
--               whoever the filer, so a sale by the person (under any spelling) or the
--               counterparty's purchase can be found
-- universe:     people.symbols unnested, IDX only; dropped-off defined as max matching
--               snapshot < latest snapshot
-- window:       register full history; filings timestamp >= {{since}}
-- exclusions:   pairs never on the register; pairs still on the latest snapshot
-- survivorship: point-in-time snapshots and filings as filed
-- statistic:    raw rows, one per pair and filing; pairs with no filing return one row
--               with null filing columns
-- approved:     2026-10-28, user (confirmation prompt), run with since = 2026-01-01
-- used by:      people table affiliation audit, dropped-off holders
with members as (
  select p.investor_name as person, p.slug, unnest(p.symbols) as symbol
  from people p
  where p.symbols is not null and array_length(p.symbols, 1) > 0
),
latest as (select max(date) as d from idx_one_percent_ownership),
hits as (
  select m.person, m.slug, m.symbol, o.date, o.percentage
  from members m
  join idx_one_percent_ownership o
    on o.symbol = m.symbol and o.investor_name ilike '%' || m.person || '%'
),
dropped as (
  select person, slug, symbol, max(date) as last_seen,
         (array_agg(round(percentage::numeric, 2) order by date desc))[1] as pct_at_last_seen
  from hits group by person, slug, symbol
  having max(date) < (select d from latest)
)
select d.person, d.symbol, d.last_seen::text, d.pct_at_last_seen,
       f.timestamp::text as filed_at, f.holder_name, f.transaction_type,
       f.amount_transaction, f.share_percentage_before, f.share_percentage_after,
       f.source
from dropped d
left join idx_filings f on f.symbol = d.symbol and f.timestamp >= '{{since}}'
order by d.person, d.symbol, f.timestamp;
