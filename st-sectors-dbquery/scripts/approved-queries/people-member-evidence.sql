-- name:         people-member-evidence
-- computes:     for every person in the people table and every symbol in their symbols
--               array, the evidence that ties them: the symbol's stored register holders,
--               its board (IDX commissioners and directors, SGX management), and insider
--               filings on that symbol tagged to the person's slug or filed under a holder
--               name containing the person's name, so each person-to-ticker link can be
--               checked against shares, seats and filings
-- universe:     people.symbols unnested; IDX register from the latest
--               idx_one_percent_ownership snapshot, SGX register from sgx_companies.shareholders
-- window:       IDX latest register snapshot; SGX and boards as stored; filings full history
-- exclusions:   none; a symbol with no register or board returns nulls, so gaps show
-- survivorship: point-in-time, current registers and boards only
-- statistic:    one row per person and symbol; holders as 'name (pct%)' joined by ' | ',
--               board names joined by ' | ', filings counted
-- approved:     2026-10-27, user (confirmation prompt)
-- used by:      people table affiliation audit
with members as (
  select p.investor_name as person, p.slug, p."group" as person_group, unnest(p.symbols) as symbol
  from people p
  where p.symbols is not null and array_length(p.symbols, 1) > 0
),
snap as (select max(date) as d from idx_one_percent_ownership),
regs as (
  select o.symbol, o.investor_name as holder, round(o.percentage::numeric, 2) as pct
  from idx_one_percent_ownership o, snap where o.date = snap.d
  union all
  select c.symbol, s.value->>'name', round(((s.value->>'share_percentage')::numeric * 100), 2)
  from sgx_companies c cross join lateral jsonb_array_elements(c.shareholders) s(value)
  where jsonb_typeof(c.shareholders) = 'array'
),
reg_agg as (
  select symbol, string_agg(holder || ' (' || pct || '%)', ' | ' order by pct desc nulls last) as register_holders
  from regs group by symbol
),
board as (
  select p.symbol, x->>'name' as name
  from idx_company_profile p, lateral jsonb_array_elements(p.commissioners) x
  where jsonb_typeof(p.commissioners) = 'array'
  union all
  select p.symbol, x->>'name'
  from idx_company_profile p, lateral jsonb_array_elements(p.directors) x
  where jsonb_typeof(p.directors) = 'array'
  union all
  select c.symbol, coalesce(x->>'name', x #>> '{}')
  from sgx_companies c, lateral jsonb_array_elements(c.management) x
  where jsonb_typeof(c.management) = 'array'
),
board_agg as (
  select symbol, string_agg(distinct name, ' | ') as board_names from board
  where name is not null and length(trim(name)) > 3 group by symbol
),
filings as (
  select m.slug, m.symbol, count(f.*) as filings_matched,
         string_agg(distinct f.holder_name, ' | ') as filing_holders
  from members m
  join (
    select symbol, holder_name, idx_investor_slug from idx_filings
    union all
    select symbol, holder_name, null from sgx_filings
  ) f on f.symbol = m.symbol
     and (f.idx_investor_slug = m.slug or f.holder_name ilike '%' || m.person || '%')
  group by m.slug, m.symbol
)
select m.person, m.slug, m.person_group, m.symbol,
       r.register_holders, b.board_names,
       coalesce(f.filings_matched, 0) as filings_matched, f.filing_holders
from members m
left join reg_agg r on r.symbol = m.symbol
left join board_agg b on b.symbol = m.symbol
left join filings f on f.slug = m.slug and f.symbol = m.symbol
order by m.person, m.symbol;
