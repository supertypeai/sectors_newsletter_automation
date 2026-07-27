# Macro-reaction — resolved query pattern (worked example: 2026-07-13 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/macro-reaction.md`. Pinned against the real run that
produced `newsletter.md` in this folder (rupiah slide / coal vs. property split).

## 1. News window (do this first, every run)

- `data_as_of` this run: **2026-07-10**.
- News sourcing window: **the last ~2 calendar days before `data_as_of`**, i.e.
  2026-07-08 → 2026-07-10 for this run. This is a web-search window
  (`sectors-newsletter-generator/references/sourcing.md`), not an API `start`/`end` param — the API has no macro-news feed
  of its own beyond the IDX-tagged `news/` endpoint used as a secondary cross-check.
- Rule to reapply next run: always "last 2 days ending at `data_as_of`," never a fixed
  calendar range and never "since the prior issue," so the window doesn't silently
  drift wider each time an issue is skipped.

## 2. Section → endpoint → resolved params

| Section | Endpoint | Resolved params this run |
|---|---|---|
| The news | (web search, not API) | last-2-days window above; cross-check `news/?sector=<slug>` or `?keyword=<term>` for API-side corroboration |
| Winners and losers (candidate discovery) | `companies/` screener | `?where=sub_sector = 'coal-mining'&order_by=-market_cap` and the property-sector equivalent — swap the `where` clause per the mechanism identified in step 1, never reuse a stale ticker list from a prior issue |
| Per-ticker fundamentals + valuation | `company/report/<TICKER>/` | `?sections=overview,valuation,financials,future,dividend`, one call per ticker (ADRO, BYAN, BSDE, CTRA this run), batchable into one `--save-dir` call |
| Per-ticker price context | `daily/<TICKER>/` | no explicit window param in the recipe; used for the current price, not a series chart in this issue type |

## 3. Fields actually cited this run

- `valuation.historical_valuation[]{pe,pb,ps,*_peer_avg,year}` — the comparison table's
  P/E / P/E-vs-peer-avg columns.
- `financials.historical_financial_ratio[].profitability{roe}` — the ROE column.
- `dividend.yield_ttm` — the div. yield column.
- `future.analyst_rating_breakdown`, `future.company_growth_forecasts[]` — reported as
  sourced consensus only, never endorsed (`sectors-newsletter-generator/references/compliance.md`).

## Reuse checklist for the next macro-reaction run

1. Re-derive the news window as "last 2 days ending at this run's `data_as_of`," don't
   copy 2026-07-08→10 forward.
2. Re-run the `companies/` screener with a `where` clause matched to *this* run's
   mechanism — the sub-sector slug will differ from coal/property whenever the
   triggering macro event differs.
3. Same four `company/report` sections every run
   (`overview,valuation,financials,future,dividend`) regardless of which tickers are
   affected, so the comparison table always has the same columns available.
4. Diff the finished draft's section order against `newsletter.md` in this folder:
   The news → Winners and losers (or the situational-heading variant, see
   `sectors-newsletter-generator/references/newsletter-format.md`) → comparison table + per-ticker paragraph → What to
   watch → Sources.
