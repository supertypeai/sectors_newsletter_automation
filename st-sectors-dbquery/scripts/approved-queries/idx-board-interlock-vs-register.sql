-- name:         idx-board-interlock-vs-register
-- computes:     people holding three or more IDX board seats, and how many of them are
--               absent from the 1% register of every company whose board they sit on
-- universe:     directors and commissioners of IDX companies with a null delisting_date
-- window:       parameterised, :snapshot_date for the register; board composition is the
--               current state of idx_company_profile, which carries no history
-- exclusions:   blank, null and placeholder name entries in the directors and commissioners
--               arrays, counted and reported by the piece's appendix
-- survivorship: none applicable; board composition is a current-state snapshot and is
--               reported as such rather than as a historical series
-- statistic:    counts, with the multi-seat population returned as the sample size
-- approved:     2026-09-04, Evelyn
-- used by:      idx-ultimate-beneficial-ownership
with params as (
  select (select max(o.date) from idx_one_percent_ownership o) as snapshot_date, 3 as min_seats
),
seats as (
  select p.symbol, trim(upper(x->>'name')) as person
  from idx_company_profile p, lateral jsonb_array_elements(p.commissioners) x
  where p.delisting_date is null and jsonb_typeof(p.commissioners) = 'array'
  union all
  select p.symbol, trim(upper(x->>'name'))
  from idx_company_profile p, lateral jsonb_array_elements(p.directors) x
  where p.delisting_date is null and jsonb_typeof(p.directors) = 'array'
),
clean as (
  -- placeholder rows: the vendor files an unnamed seat as '-' or a blank. One such
  -- placeholder otherwise aggregates into a single fictitious person holding five seats.
  select symbol, person from seats
  where person is not null and person ~ '[A-Z]' and length(person) > 3
),
multi as (
  select person, count(distinct symbol) as seat_count
  from clean group by person
  having count(distinct symbol) >= (select min_seats from params)
),
reg as (
  select o.symbol, upper(o.investor_name) as investor_name
  from idx_one_percent_ownership o, params p
  where o.date = p.snapshot_date
),
matched as (
  select m.person, m.seat_count,
    (select count(*) from clean c
      where c.person = m.person
        and exists (select 1 from reg r where r.symbol = c.symbol and r.investor_name = m.person)
    ) as seats_where_named
  from multi m
)
select
  count(*) as people_multi_seat,
  sum(seat_count) as seats_held,
  count(*) filter (where seats_where_named = 0) as people_named_nowhere,
  count(*) filter (where seats_where_named > 0) as people_named_somewhere,
  (select count(*) from clean) as board_seats_total,
  (select count(*) from people where symbols is not null and array_length(symbols, 1) > 0) as mapped_people,
  (select count(*) from people
    where symbols is not null and array_length(symbols, 1) > 0
      and pep_roles is not null and pep_roles <> '') as public_office_people,
  (select snapshot_date from params) as snapshot_date
from matched;
