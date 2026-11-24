-- name:         conglomerate-member-shareholder-registers
-- computes:     for every conglomerate and every symbol in its symbols array, the stored
--               shareholder register of that symbol, so each group-to-ticker link can be
--               checked against who actually holds the shares
-- universe:     conglomerates.symbols unnested; IDX names from the latest
--               idx_one_percent_ownership snapshot, SGX names from sgx_companies.shareholders
-- window:       IDX latest register snapshot; SGX as stored, no snapshot date
-- exclusions:   none; a symbol with no register returns one row with null holder, so gaps show
-- survivorship: point-in-time, current registers only
-- statistic:    raw holder rows, holder_pct in percent for both markets
-- approved:     2026-10-27, user (confirmation prompt)
-- used by:      conglomerates table affiliation audit
with members as (
  select c.name as conglomerate, c.slug, unnest(c.symbols) as symbol from conglomerates c
),
snap as (select max(date) as d from idx_one_percent_ownership),
idx as (
  select o.symbol, o.investor_name as holder, o.investor_type as holder_type,
         round(o.percentage::numeric, 2) as holder_pct
  from idx_one_percent_ownership o, snap where o.date = snap.d
),
sgx as (
  select c.symbol, s.value->>'name' as holder, null::text as holder_type,
         round(((s.value->>'share_percentage')::numeric * 100), 2) as holder_pct
  from sgx_companies c cross join lateral jsonb_array_elements(c.shareholders) s(value)
),
regs as (select * from idx union all select * from sgx)
select m.conglomerate, m.slug, m.symbol, r.holder, r.holder_type, r.holder_pct
from members m left join regs r on r.symbol = m.symbol
order by m.conglomerate, m.symbol, r.holder_pct desc nulls last;
