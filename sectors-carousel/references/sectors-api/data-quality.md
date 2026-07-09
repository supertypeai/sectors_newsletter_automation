# Data Quality, read before any number reaches a slide

A finance carousel lives or dies on its numbers. The Sectors API returns plenty of
values that are real-but-misleading or outright garbage, and it does NOT sanity-check
them. The numeric guardrail in this skill stops fabrication; it does not stop a true
field that means something other than it looks like. That is your job. This file is
the checklist.

---

## The hard rules (non-negotiable)

1. **Never fabricate, estimate, round-for-effect, or back-fill a number.** Every
   figure on a slide must come from a real API field this run, or a cited web source.
   No "approximately", no "~", no derived figure presented as if returned.
2. **If a field is `null`, missing, or implausible, omit the claim or drop the whole
   block.** Do not guess, interpolate, or substitute a peer's value. A missing card
   beats a wrong card.
3. **Descriptive only. Never investment advice.** No buy/sell/hold framing, no price
   targets, no "undervalued / cheap / should own", no "fair value". State what the
   data is, not what to do about it.
4. **A figure you can't sanity-check, you can't publish.** Run every number through
   the plausibility bands below. Out of band → omit it.
5. **Show the date.** Prices, flows, and ratios are as-of a date. Stamp it; stale or
   undated numbers read as wrong.

---

## Landmines (each one verified live)

| Field / case | The trap | What to do |
|---|---|---|
| `valuation.intrinsic_value` | DCF runs **systematically high** (BBCA 13,694 vs 5,650 close = +142%; +124-264% across 5 blue chips, at/above the most bullish analyst target). | **Never** show it, and **never** call it "fair value". Use analyst ratings or peer multiples instead. |
| Small-cap nulls | esg_score, analyst_rating_breakdown, forecasts, forward_pe, indices, affiliates, company_value_forecasts all `null` on small caps (e.g. JSPT). | Null-guard every one. Drop the card; don't render a blank or a zero. |
| `news` | **Big-cap-skewed.** BBCA 443 articles (2026-07-02); JSPT 0. | Don't promise a news card for a small cap. Fall back to `sub_sector` news or omit. |
| `filings` | Skews big-cap but **not exclusive**: a ~Rp 296B small cap topped the live stream (2026-07-02), while JSPT had zero. | Don't assume presence or absence for any cap size; query, then null-guard. |
| Corporate-action types | Empty types return `null`, not `[]`. | Guard before iterating `dividend[]`, `stock_split[]`, `agm[]`, etc. |
| Screener garbage values | Numeric screens don't validate. `order_by=-roe[2024]` put TLDN on top at `roe=262` (26,200%). | Apply bands below **before** rendering any ranking. Check `pagination.total_count` before "top N". |
| Trailing P/E | `pe_ttm` is a frequent liar (negative for loss-makers, absurd for thin earnings). Negative P/E also passes any `pe_ttm < X` screener filter and sorts first (verified: GOTO at −88.5× topped a "cheapest" screen). | Band-check; drop negatives; always add `pe_ttm > 0` to a cheap-valuation screen; cross-check vs `forward_pe` / peer avg. |
| Loss-maker margins | Net-margin series go impossible/meaningless when the company loses money. | Don't chart margins for loss-makers. |
| `payout_ratio` > 1 | Payout > 100% is **common** on IDX; `cash_payout_ratio` can exceed 1 (a BBCA pull once read 2.6; a 2026-07-02 pull read 0.69, the value moves as TTM windows roll, so re-fetch rather than reuse). | Allowed up to a band; beyond it, omit rather than imply a screaming yield. |
| ROE > 100% | Real for some, garbage for others; the API won't tell you which. | Band-check (see below). |
| Filing-body numbers | The free-text `body` of a filing has unreliable figures. | Use the **structured** fields (`transaction_value`, `holding_before/after`, `share_percentage_*`), never numbers parsed from prose. |
| Paired custodian/beneficial-owner filings | The same underlying trade can file twice under two different filer names, a custodian and its "A/C" beneficial-owner alias, e.g. "Chengdong Investment Corporation" and "Hsbc-Fund Svs A/C Chengdong Investment Corp-Self" on BUMI, sharing identical `share_percentage_before/after` and dates. | Before treating two filer names as two distinct holders, compare share counts + dates; collapse a matching pair to one entity and disclose the collapse openly in the slide's detail copy, never double-count or silently pick one label. |
| Broker / flow history | Begins **2025-01-02**; earlier windows return 200 + empty silently; >90-day ranges clamp silently. | Compare earliest returned date to what you asked. No multi-year broker claims. |
| `shareholders-composition/{symbol}` current year | Silently returns **partial months** for the current year (a live pull came back with only 5 of 12 months). Same "quiet gap" pattern as the broker floor above. | Check how many months actually came back before claiming a full-year trend; use the latest prior full year for a year-over-year claim. |
| Smart FY | "latest year" resolves to a different year by query month. | Pin the year (`revenue[2024]`) when you need a determinate figure on a slide. |
| `peers[].peers_data.companies[].point_summaries` | Individual axes can be **non-discriminating**: one eval found the "future" dimension scored 100/100 for 10 different bank peers at once; a 2026-07-02 re-check saw the same axis take only two distinct values (18/30) across BBCA's 10 peers, still near-useless. It's a proprietary internal rubric, not a plain ratio. | Check each axis actually varies across the companies you're charting before using it in a `radar`. If it doesn't, build the scorecard from real, individually-sourced ratios instead (ROE, NIM, CASA, etc.), and say so in the chart's caption/source line. |
| `overview.all_time_price.90_d_high` (and siblings) vs `daily/{symbol}` | Can disagree with the raw daily close for the same date (one eval saw 58 vs 55). Likely a different intraday/adjustment basis. | For any chart or claim built from a price series, pull `daily/{symbol}` directly and use that series throughout, don't mix it with `all_time_price` summary fields. |
| P&L line items (`operating_pnl` and friends in `financials.historical_financials`) | Exposed line items often do **NOT reconcile** to the earnings delta they should explain; an eval building a bank earnings bridge found no exposed decomposition that summed to the bottom line except revenue = NII + non-interest income. | Before building a `waterfall`, verify the contributors actually sum to the stated end total. If they don't close, drop back to bar/stackedbar + prose; never force a plausible-looking bridge. |
| `share_percentage` type inconsistency | `report.ownership.major_shareholders[].share_percentage` is a **string** (`"0.54942"` in `examples/report_ownership.json`) while `management.executives_shareholdings[].share_percentage` is a **float** (`3e-05` in `examples/report_management.json`), same field name, two different types across sections of the same report. | `parseFloat` before any math or before feeding a donut spec; skipping the cast silently breaks arithmetic or the chart. |
| Field-vintage nulls | Even BBCA's `historical_financials` has `ebit`, `ebitda`, `gross_loan`, `provision`, `total_deposit` all `null` in 2018 but populated by 2020 (`examples/report_financials.json`). | Not only a small-cap problem; check per-year before charting a full window, older years of a series can be structurally incomplete even for a blue chip. |
| Sector-level P/E extremes | `subsector/report`'s `statistics` carries `min_company_pe: -71.7` and `max_company_pe: 2202.2` in the cached banks sample (`examples/subsector_report.json`). | The per-company P/E-liar landmine (above) lives at the aggregate level too. Never surface a sector P/E range verbatim; band-check the underlying companies the same way you would a single ticker's `pe_ttm`. |
| Broker gross vs net scale | `brokers/top` sample has broker CC with `gross: 4,616,313,142,400` and `net: -639,908,303,600` (`examples/new/brokers_top.json`), the two live on different scales and can point opposite directions. | Never bar-chart gross and net on one axis; use `scatter` (x=gross, y=net) or two separate rankings. |

Coverage reality: blue chips are clean. Anomalies cluster in **loss-makers, small
caps, and fresh IPOs**. The cleaner the company, the safer the number.

---

## Plausibility bands (IDX large caps)

Inside the band, render it. Outside, treat as suspect → omit (or verify against a
cited source). These are sanity gates, not precision claims.

| Metric | Sane range (large cap) | Outside → |
|---|---|---|
| Trailing/forward P/E | ~3 to ~40 | Negative or >~60: drop (loss-maker or garbage) |
| Dividend yield (ttm) | 0% to ~12% | >~15%: verify or omit (likely special/one-off or bad) |
| Payout ratio | 0 to ~1.2 | >~1.5: omit the payout claim |
| Cash payout ratio | 0 to ~2 | Beyond: omit (timing artifact, not a trend) |
| ROE | 0 to ~0.40 (banks can reach ~0.50) | >~0.6 or negative: drop from any ranking |
| ROA | 0 to ~0.25 | >~0.3 or negative: suspect |
| Net profit margin | varies by sector; banks high | Negative → don't chart; >1 → garbage |
| Daily close change | roughly −0.15 to +0.15 | Beyond ±25% (ARB/ARA limits): double-check the date/field |
| Free float | 0 to 1 | Outside: bad parse |

For small/mid caps the bands widen and break more often. When in doubt, omit. The
skill's reputation survives a missing stat; it does not survive a fabricated or
laughably wrong one.

---

## One-line decision rule

> Real field, in band, with a date → use it. Anything else → drop the claim, and if
> that empties the slide, drop the slide. Never describe what to do with the stock.
