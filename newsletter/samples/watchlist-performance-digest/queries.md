# Watchlist/sector performance digest — resolved query pattern (worked example: 2026-07-16 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/watchlist-performance-digest.md`. Pinned against the
real run that produced `newsletter.md` in this folder (sample-row-1: DBS all-time high,
banks/consumer-services sectors, a null `first_name` fallback case). The exact endpoint
list this run actually used is preserved in that file's own **"Sources / data trace"**
section — this file adds the window rule and reuse discipline around it.

## 1. Audience source (not a query-consistency gap, see below)

Audience came from the sibling `sectors-newsletter-dbquery` skill's approved
`watchlist-tracked-interest.sql` — a fixed, version-controlled query, not something
resolved per-run here. `sample-rows.csv` in the delivery folder
(`$NEWSLETTER_HOME/newsletter_2026-07-16_watchlist-performance-digest/`)
holds the real row (user_id 29, one IDX ticker, one SGX ticker, two tracked sectors);
it was deliberately **not** copied into this skill's `samples/` folder since it carries
a real email address, only the PII-scrubbed `newsletter.md` was copied here.

## 2. Window discipline

- `data_as_of` this run: **2026-07-15**.
- 7-day lookback ending at `data_as_of` for every tracked ticker and sector:
  `?start=2026-07-08&end=2026-07-15`, applied identically across IDX, SGX, and
  sector-level fetches.
- Benchmark: `idx-total/?start=2026-07-08&end=2026-07-15` for the IDX composite's own
  7-day move, used as the "how does this compare to the market" context line, not just
  a bare percentage on the headline mover.

## 3. Section → endpoint → resolved params (from this issue's own Sources / data trace)

| Section | Endpoint | Resolved params this run |
|---|---|---|
| IDX tracked ticker (BBCA) | `company/report/BBCA/?sections=overview,peers`, `daily/BBCA/` | `?start=2026-07-08&end=2026-07-15` |
| IDX tracked ticker (DSSA) | `company/report/DSSA/?sections=overview,peers`, `daily/DSSA/` | `?start=2026-07-08&end=2026-07-15` |
| SGX tracked ticker (D05, stripped from `D05.SI`) | `sgx/company/report/D05/?sections=overview`, `sgx/daily/D05/` | `?start=2026-07-08&end=2026-07-15`; no `peers` section (400s on SGX) |
| Tracked sector (banks) | `subsector/report/banks/`, `companies/top-changes/` | `?classifications=top_gainers,top_losers&periods=7d&sub_sector=banks&n_stock=1` |
| Tracked sector (consumer-services) | `subsector/report/consumer-services/`, `companies/top-changes/` | `?classifications=top_gainers,top_losers&periods=7d&sub_sector=consumer-services&n_stock=1` |
| Composite benchmark | `idx-total/` | `?start=2026-07-08&end=2026-07-15` |

## 4. What actually got applied from the workflow doc's edge cases

- **`.JK`/`.SI` suffix classification**: `D05.SI` → SGX, stripped to bare code `D05`
  before calling `sgx/company/report/`. `BBCA.JK`/`DSSA.JK` → IDX, kept as-is.
- **SGX peer comparison gap**: rendered as "not yet available for SGX names" in the
  table rather than a blank cell or a fabricated figure.
- **`first_name` null fallback**: sample row's `first_name` was `null`; template used
  the compliance-mandated "there" fallback ("Hi there,") rather than dropping the
  recipient or rendering a broken greeting.
- **Ranking**: all deduped tracked items (2 IDX tickers, 1 SGX ticker, 2 sectors) ranked
  by absolute 7-day move in one list; DBS's +5.6% was the headline despite being an SGX
  row with no peer data, ranking is move-size-only, not exchange-biased.

## Reuse checklist for the next watchlist-performance-digest run

1. Re-invoke the dbquery skill's `watchlist-tracked-interest` query fresh for the
   audience, never reuse a cached row set.
2. Same 7-day window for every tracked item and the composite benchmark, every run.
3. Classify every ticker by suffix (`.JK` vs `.SI`/bare) before fetching, strip the
   suffix only for the SGX call path.
4. Never fabricate or silently blank a missing SGX peer-comparison figure, footnote it.
5. Apply the `first_name` null fallback per `sectors-newsletter-generator/references/compliance.md` rather than dropping
   the recipient.
6. Diff the finished draft's section order against `newsletter.md` in this folder:
   greeting + headline mover → ranked table → context paragraph (never a call) → CTA →
   disclaimer footer → Sources/data-trace appendix.
7. Never copy `sample-rows.csv` (or any real recipient PII) into this skill's `samples/`
   folder, only the scrubbed `newsletter.md`.
