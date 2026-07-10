# Sectors API reference (for the IDX carousel skill)

The data layer for generating Instagram carousels about Southeast Asian stock markets
from the Sectors Financial API v2. The bulk of this reference is **IDX (Indonesia)**,
live-verified 2026-06-12. **SGX (Singapore)** support is thinner — a single-stock
deep-dive only (`sgx/company/report/{symbol}/` + `sgx/daily/{symbol}/`), discovered and
live-verified 2026-07-08, documented in `endpoints.md` §4. Don't assume an IDX endpoint
(movers, flow, sector-pulse, ownership, peers, quarterly financials) has an SGX
equivalent without probing first — most confirmed absent so far.

## What's in this folder
| File | Purpose |
|---|---|
| `endpoints.md` | Working API reference: connection quirks, date/credit rules, and the endpoints a carousel needs (params, the 3-5 fields that matter, which cached example shows each shape). |
| `data-quality.md` | The landmines + hard rules + plausibility bands. **Read this before any number reaches a slide.** |
| `README.md` | This index. |

Cached real responses live one level up: `examples/*.json` (trimmed to 3-item
arrays, best for eyeballing shape) and `responses/*.json` (full). Filenames map to
endpoints; the broker/flow/corporate-action set is under `responses/new/`.
These are captures from a point in time, not a live mirror: a field can vanish
from the live API after capture and still sit in the cached JSON (see
`examples/report_financials.json`'s own `_note` key for exactly this case);
confirm a field is still live in `endpoints.md` before trusting an example's
shape as current.

## Reading order
1. `data-quality.md`, the rules that override everything (no fabrication, no advice, band-check every figure).
2. `endpoints.md`, connection basics first (auth quirk, 90-day cap, 2025-01-02 broker floor, credit costs), then pick endpoints per the table below.
3. The named example JSON for the endpoint you're about to call, to confirm the exact field path.

Fetching: `node scripts/sectors.mjs "<path>"` for one call; when a beat needs several paths (a report plus its daily chart, say), pass them all to one invocation with `--save-dir <dir>` instead of one Bash round trip per path.

## Which endpoint feeds which carousel
| Carousel type | Primary call(s) | Key fields |
|---|---|---|
| **Single-stock deep-dive** | `company/report/{symbol}` (+ `daily/{symbol}` for the chart) | overview KPIs, financials, dividend, ownership, peers radar |
| **Market movers** ("today's gainers/losers") | `companies/top-changes` (+ `most-traded`) | `top_gainers/top_losers` per period; daily top-5 volume |
| **Screener leaderboard** ("cheapest banks", "highest yield") | `companies` (`where`/`order_by`, +`include_query_values`) | `results[]` + `query_values` (the sorted metric inline) |
| **Smart-money / flow** ("who's buying X") | `foreign-flow/{symbol}` + `broker-summary/{symbol}/top` | `net_foreign_inflow`; `top_buyers`/`top_sellers` by `net_idr` |
| **Dividends** (calendar / yield) | `company/report.dividend` + `company/corporate-actions/{symbol}` | `yield_ttm`, `upcoming_dividends`, `ex_date`, `stock_split`, `agm` |
| **Sector pulse** | `subsector/report/{slug}` (+ `free-float`) | `mcap_change{1w,1y,ytd}`, `top_companies`, `filtered_median_pe` |
| **Recent IPO scoreboard** | `listing-performance/{symbol}` | `chg_7d/30d/90d/365d`, `offering_price`, `book_building_*` |
| **Ownership shift** | `shareholders-composition/{symbol}` | monthly `total_l` vs `total_f`, per-holder-type `_l/_f` |

Slug/discovery helpers (`subsectors`, `industries`, `tags`,
`list_companies_with_segments`) are cheap; call them first and cache.

**SGX single-stock deep-dive**: `sgx/company/report/{symbol}/` (mind the trailing slash,
`sections=overview,valuation,financials,dividend` — only those 4 exist, no ownership/peers)
+ `sgx/daily/{symbol}/` for the chart. See `endpoints.md` §4 for the full shape and what's
confirmed NOT to exist yet.

For the full screener field catalog and query recipes, see the source `../../docs/SCREENER.md`
(the maintainer source doc, two levels up from here — `docs/` is a sibling of `references/`, not
inside it). §6 there has six ready-made recipes (dividend aristocrats, fastest growers, best
banks by ROE, founder-owned, cheapest blue chips, beat-last-quarter); open it when a bare
`where`/`order_by` in `endpoints.md` §2 isn't specific enough for what you're trying to find.
