# Sector spotlight — resolved query pattern (worked example: 2026-07-16 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/sector-spotlight.md`. Pinned against the real run that
produced `newsletter.md` in this folder (banks, Bank Jago's rally vs. the group median).

## 1. Window/hook discipline

- `data_as_of` this run: **2026-07-15**.
- Hook window: **7 days ending at `data_as_of`** (`periods=7d` on the discovery call) —
  this is the standard hook lookback for this type, wide enough to catch a real weekly
  standout without drifting into stale history.
- No fixed window on `subsector/report` or the `company/report` valuation sections —
  both return current-as-of-the-report-date figures, not a requested range.

## 2. Section → endpoint → resolved params

| Section | Endpoint | Resolved params this run |
|---|---|---|
| The hook (discovery) | `companies/top-changes/` | `?classifications=top_gainers,top_losers&periods=7d&sub_sector=banks&n_stock=5` |
| The group (leaderboard) | `subsector/report/banks/` | no date param; trailing slash load-bearing |
| Ranked members (guarded screen) | `companies/` screener | `?where=sub_sector = 'banks' and pe_ttm > 0&order_by=pe_ttm&limit=15&include_query_values=true` — the `pe_ttm > 0` guard kept two negative-P/E names (BCIC, BINA) out of the "cheapest" ranking |
| Per-pick comparison (4 names) | `company/report/<TICKER>/` | `?sections=overview,valuation,financials,dividend`, one call per ticker (ARTO, BDMN, BMRI, BBCA), batched into one `--save-dir` call |

## 3. Fields actually cited this run

- `subsector/report`'s `statistics.filtered_median_pe` (10.5x) — the benchmark every
  pick is read against.
- `subsector/report`'s `market_cap.mcap_summary.mcap_change.1w` (-1.1%) — the sector's
  own weekly move, deliberately contrasted against one name's +23.2% to show the split
  is real, not a sector-wide rally.
- `valuation.historical_valuation[]` per ticker (2026 `pe`, `pb`, vs peer avg via the
  group median) — the comparison table's core columns.
- `financials.historical_financial_ratio[].profitability.roe` (2025) — the ROE column.
- `dividend.yield_ttm` — the yield column, `n/a` rendered plainly for ARTO (no
  meaningful trailing yield yet), not a blank cell with no explanation.

## Reuse checklist for the next sector-spotlight run

1. Same 7d discovery window every run for the hook, re-run fresh, don't reuse a prior
   week's movers list.
2. Keep the `pe_ttm > 0` guard on the ranked-members screener call every time.
3. Same 4-section `company/report` slice
   (`overview,valuation,financials,dividend`) for every pick, so the comparison table's
   columns stay identical regardless of which sub-sector or names are chosen.
4. Always pull the group's own 1-week `mcap_change` from `subsector/report` alongside
   any individual name's move, so a "one name rallied hard" hook can be checked against
   whether the sector as a whole moved with it or not.
5. Diff the finished draft's section order against `newsletter.md` in this folder: The
   hook → The group → The comparison (table + per-pick paragraph) → The takeaway →
   Sources → disclaimer.
