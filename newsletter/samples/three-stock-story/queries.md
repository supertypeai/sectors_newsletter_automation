# Three-stock story — resolved query pattern (worked example: 2026-07-13 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/three-stock-story.md`. Pinned against the real run that
produced `newsletter.md` in this folder (ADRO, BYAN, CTRA — family-controlled names).

## 1. Window/date discipline

- `data_as_of` this run: **2026-07-10**.
- No fixed lookback window for pick discovery (unlike weekly-wrap's Mon-Fri), but the
  discovery screeners below use a **30d** period and the recency discipline from
  `sectors-newsletter-generator/references/sourcing.md` still applies to every cited news/filing fact: each pick needs a
  *current* reason, not just history, so a fact cited as "why now" must fall inside the
  last ~30 days of `data_as_of`.

## 2. Section → endpoint → resolved params

| Section | Endpoint | Resolved params this run |
|---|---|---|
| Pick discovery (candidate screen) | `companies/top-changes/`, `filings/` | `?classifications=top_gainers,top_losers&periods=30d`; `filings/?limit=20` |
| Per-stock people + numbers | `company/report/<TICKER>/` | `?sections=overview,management,ownership,financials,future`, one call per ticker (ADRO, BYAN, CTRA), batchable into one `--save-dir` call |

## 3. Fields actually cited this run

- `management.key_executives[]`, `ownership.major_shareholders[]`,
  `ownership.whale_investors[]` — the people section per stock.
- `financials.historical_financials[]`, `historical_financial_ratio[]` — the numbers
  table (revenue/earnings YoY, ROE, margin).
- `future.company_growth_forecasts[]`, `future.analyst_rating_breakdown` — outlook
  section, attributed-only per `sectors-newsletter-generator/references/compliance.md`.
- **Type gotcha applied**: `ownership.major_shareholders[].share_percentage` is a
  string, `management.executives_shareholdings[].share_percentage` is a float —
  `parseFloat` before any comparison, same field name across two sections of one report.

## Reuse checklist for the next three-stock-story run

1. Re-run the `top-changes` (30d) + `filings` (limit 20) discovery pair fresh, don't
   reuse a prior issue's candidate list — the whole point is a current "why this, why
   now."
2. Same `company/report` `sections=` string every run
   (`overview,management,ownership,financials,future`) so all three picks return
   comparable fields regardless of which names are chosen.
3. Cast `share_percentage` to float before comparing across the two sections that use
   the same field name with different types.
4. Diff the finished draft's section order against `newsletter.md` in this folder: brief
   framing → three per-stock sections (story → people → numbers → outlook) → closing
   line → Sources.
