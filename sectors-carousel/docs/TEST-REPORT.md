# Sectors API v2 — IDX Endpoint Test Report

**Scope:** IDX (Indonesia Stock Exchange) only. **Date:** 2026-06-12 · **Key:**
Samuel's own (resolved from env, never committed) · **Method:** `scripts/probe.py`
(stdlib-only, real User-Agent, no Bearer prefix).

## Coverage
Every IDX path was exercised (company report + 8 sliced sections, quarterly,
segments, daily, listing-performance, screener variants, top-changes, free-float,
most-traded, idx-total, index-daily, subsector report, news, filings, slug
helpers) → **38 calls, 38 saved responses** in `../responses/` (shapes in
`_shapes.txt`).

- **37 / 38** return `200`.
- **1** intentional non-200 kept as evidence: `listing_perf_small.json` — JSPT
  (1998 listing) → `400 "symbol does not exist"`, confirming *listing-performance
  is recent-IPOs-only*. Working version: `listing_perf_recent.json` (BREN).

## Schema was stale — 10 IDX endpoints were missing
The upstream `sectors-endpoints/references/schema.json` is a May-2026 snapshot
with **51 paths**. The live schema (`docs.sectors.app/schema.json`, saved to
`../responses/_openapi_live.json`) has **67 paths**. After Samuel flagged
`corporate-actions`, a diff surfaced **10 IDX endpoints absent from the snapshot**
— all tested live (`../responses/new/`), all 200:

`company/corporate-actions/{symbol}`, `company/shareholders-composition/{symbol}`,
`foreign-flow/{symbol}`, `brokers`, `brokers/top`, `broker-summary/{symbol}`,
`broker-summary/{symbol}/top`, `broker-activity/{broker_code}`,
`broker-activity/{broker_code}/top`, `suspensions`.

Documented in `ENDPOINTS.md` §2b. (The other 6 new live paths are SGX-only —
`sgx/{daily,news,filings,tags,buybacks,short-sell}` — and out of scope.)
**Lesson: verify against the live schema, not a cached OpenAPI file.**

## Coverage cross-check — every IDX path accounted for
Diffed the live schema's **32 IDX paths** against everything called:
- **30** are real callable endpoints — **all tested 200** (responses in `../responses/`).
- **2** are symbol/slug-required base routes with no list form: `/company/report/`
  → `400 "Please provide a valid stock symbol"`, `/subsector/report/` → `400
  "Please provide a valid sector"`. Only their `/{symbol}` / `/{sub_sector}`
  forms are usable (both tested). Evidence in `../responses/params/`.

**Param variations exercised** (not just one combo per endpoint) on the new
endpoints, all live-confirmed (`../responses/params/`): `brokers` `origin`
(foreign→21) and `cohort` (institutional→39) filters; `brokers/top` `metric=gross`;
`broker-activity` `symbol` filter; `broker-summary` `broker_code` filter;
`broker-summary/top` `origin=foreign`; `suspensions` `symbol` filter (FORU→2);
`shareholders-composition` default-year (current year, partial).

## What the probe found (corrections to the upstream `sectors-endpoints` doc)
The API returns a helpful 400 body listing accepted params, so first-pass
failures were all fixable param mistakes. Net new IDX facts:

1. **`news` uses `limit`, not `n_news`.** Full param set:
   `commodity_type, end, extension, keyword, limit, offset, sector, start,
   sub_sector, symbols, tags`.
2. **`top-changes` classifications are only `top_gainers`/`top_losers`** (other
   classes are rejected by this endpoint).
3. **`most-traded` rejects `limit`** — fixed top-5 per day.
4. **Screener `tags in [...]` ≠ index membership** — use the `indices` array
   field; `tags` are company event tags. `tags in ['lq45']` returns empty,
   `indices in ['LQ45']` works.
5. **`companies?q=` returns `llm_translation`** exposing the parsed where/order_by.
6. **`analyst_rating_breakdown`** exists under `report.future` (strong_buy/buy/
   hold/sell/strong_sell/n_analyst) — absent from the upstream doc.
7. **`listing-performance` is much richer** than documented (book-building dates,
   offering price, prospectus URLs, % of total shares).
8. **`filings`** is insider/major-holder *transaction* disclosure (buy/sell,
   holder_type, holding before/after), distinct from `news`.

## Data-quality flags reconfirmed live
- `valuation.intrinsic_value` runs systematically high (BBCA +142% vs last close).
- Small caps (JSPT) null out esg_score, analyst ratings, forecasts, forward_pe,
  indices, affiliates; news/filings coverage is **big-cap only** (JSPT = 0 of both).
- payout/cash-payout > 1, negative P/E for loss-makers — normal, needs sanity bands.

## Reproduce
```bash
export SECTORS_API_KEY=...
python3 scripts/probe.py discover     # resolve slugs (cheap)
python3 scripts/probe.py run          # full IDX probe
python3 scripts/analyze.py            # regenerate responses/_shapes.txt
```
