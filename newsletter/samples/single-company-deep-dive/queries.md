# Single company deep dive — resolved query pattern (worked example: 2026-07-15 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/single-company-deep-dive.md`. Pinned against the real
run that produced `newsletter.md` in this folder (ADRO buyback + Q1 earnings beat). This
issue's own delivered copy already carries an in-body **"Appendix: Sectors API
endpoints (fields used)"** section (see `newsletter.md` near the end) — that appendix is
itself a worked example of `sectors-newsletter-generator/references/newsletter-format.md`'s optional Appendix pattern, and
the table below extracts the same information plus the date-window rule so it survives
even if a future draft skips the in-body appendix.

## 1. Window discipline

- `data_as_of` this run: **2026-07-14**.
- Trigger window: web-searched "last few days" before `data_as_of` (the buyback
  completed 2026-07-13, earnings disclosed 2026-07-14 — both inside a 1-2 day
  lookback).
- Price series window: **90 days ending at `data_as_of`** — `daily/ADRO.JK/?start=<90d
  before 2026-07-14>&end=2026-07-14`. Ranges silently clamp to 90 days, so a wider ask
  quietly truncates; don't request more and assume it was honored.

## 2. Section → endpoint → resolved params (from this issue's own Appendix)

| Section | Endpoint | Fields used |
|---|---|---|
| Trigger sourcing | `news/?symbols=ADRO&limit=10`, `filings/?symbol=ADRO&limit=10`, `company/corporate-actions/ADRO.JK/` | structured filing fields only, never the free-text `body` |
| The numbers / valuation | `company/report/ADRO.JK/?sections=overview,valuation,financials,dividend,future,ownership` | `valuation.historical_valuation[]` (P/E, P/B vs peer avg), `financials.historical_eps`, `financials.historical_financial_ratio[]` (ROE), `dividend.yield_ttm`, `dividend.payout_ratio`, `dividend.historical_dividends`, `dividend.dividend_yield_avg`, `future.company_growth_forecasts`, `future.company_value_forecasts`, `future.analyst_rating_breakdown` |
| Hero chart | `daily/ADRO.JK/?start=<90d-ago>&end=2026-07-14` | 90-day close series |
| Earnings quarter detail | `company/get_quarterly_financial_dates/ADRO.JK/`, `financials/quarterly/ADRO.JK/?report_date=<latest-quarter-end>` | Q1 2026 revenue/net profit vs Q1 2025 |
| Ownership context | `company/report/ADRO.JK/` (`ownership` section) | institutional buyer/seller flow |
| Dividend screen (pick discovery) | `companies/` screener | `total_yield[2025]`, LQ45 constituents ranked by 2025 dividend yield — the screen this issue's pick came from |

## Reuse checklist for the next single-company-deep-dive run

1. Resolve trigger window as "last few days before this run's `data_as_of`," re-search
   fresh, don't reuse a prior trigger.
2. Same `sections=overview,valuation,financials,dividend,future,ownership` string, slice
   down only if the issue's specific argument doesn't need one of them (cost tracks
   section count).
3. 90-day price window ending at `data_as_of`, every run, not a fixed calendar range.
4. Keep authoring the in-body **Appendix: Sectors API endpoints** section
   (`sectors-newsletter-generator/references/newsletter-format.md`'s optional Appendix) for this issue type specifically —
   it's the one type most likely to need source-tracing (a deep dive built on a
   screener + a corporate action), and this sample proves the format reads well once
   filled in.
5. Diff the finished draft's section order against `newsletter.md` in this folder: The
   trigger → The read/numbers → Valuation context → What to watch → Sources → Appendix →
   disclaimer.
