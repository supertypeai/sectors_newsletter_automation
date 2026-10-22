# Sector spotlight, resolved query pattern (worked example: 2026-10-22 issue, banks)

Source recipe: `~/.claude/skills/sectors-newsletter/references/workflows/sector-spotlight.md`. Pinned against the run that produced `newsletter.md` and `newsletter.html` in this folder (banks, the week MSCI warned Indonesia could be removed from its global indexes).

## 1. Window and hook

- `data_as_of`: **2026-10-21**. Hook window: 7 days ending at `data_as_of` (14 Oct close to 21 Oct close).
- The hook came from web sources (Trading Economics and Databoks, 16 Oct 2026), not from the movers list. The movers list only said whether the move was broad.

## 2. Section, endpoint and resolved params

| Section | Endpoint | Resolved params |
|---|---|---|
| Opening, glance, valuation history, median vs weighted, forecasts | `subsector/report/banks/` | no date param, trailing slash load-bearing |
| Lowest and highest multiples | `companies/` screener | `?where=sub_sector = 'banks' and pe_ttm > 0 and market_cap > 3000000000000&order_by=pe_ttm&limit=25&include_query_values=true` |
| Week's moves, group split | `daily/{ticker}/` | `?start=2026-10-14&end=2026-10-21`, one call per ticker, `close` first and last |
| Group breadth | `companies/top-changes/` | `?classifications=top_gainers,top_losers&periods=7d&sub_sector=banks&n_stock=7` |
| Named bank and peers | `company/report/<TICKER>/` | `?sections=overview,valuation,financials,dividend,ownership`, BNGA, BMRI, BBNI, BBRI |

## 3. Derived figures (state "simple average" in the caption)

- Average week of the lowest-multiple group: mean of the five 7-day moves (BJTM -2.0, BBTN -9.6, BJBR -4.0, BMRI -6.6, BBNI -4.7) = -5.4%.
- Average week of the highest-multiple group: mean of the four moves with data (SUPA -23.1, MAYA -17.2, ARTO -22.6, BBHI -23.7) = -21.7%.
- Name every member of the seven highest P/Es that is missing from an average, and any member that contradicts the pattern (BBMD, 27.6x, +2.5%).
- Median P/E change: (14.7 - 8.0) / 14.7 = 45.6%, written "about 46%".

## 4. Reuse checklist

1. Keep the `pe_ttm > 0` guard and the stated market-cap floor on the screener.
2. Pull each group's own `mcap_change` from `subsector/report` next to any single-name move.
3. Group the names by the pattern the screener shows (here state-owned and regional versus smaller digital lenders) before pulling moves, so the comparison card has a reason to exist.
4. Peer table: pick one angle, keep three columns, send the reader to company reports for the rest.
5. Diff the draft's section order against `newsletter.md`: opening, glance, how to read, valuation history, week split, named bank, forecasts, takeaway, CTA, events, sources, appendix, disclaimer.
