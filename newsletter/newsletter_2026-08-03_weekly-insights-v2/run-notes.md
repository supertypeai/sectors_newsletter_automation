# Unattended-run notes, weekly-insights-v2, 2026-08-03

Per SKILL.md's "Running unattended" section: this file records every default/judgment
call this run took. Never read by the send path, never copied into `newsletter.md` or
`newsletter.html`.

- **Issue type**: given explicitly in the run instructions as `weekly-insights-v2`, not
  inferred from a bare request.
- **Window**: today (2026-08-03, a Monday) is the actual send date. `data_as_of` came
  back as 2026-07-31 (Friday) from `idx-total/`, so the reporting window is Mon 27 Jul
  to Fri 31 Jul, the most recently completed trading week. Prior week for WoW compares:
  Mon 20 Jul to Fri 24 Jul.
- **Foreign flow (Supabase MCP connector)**: available and used successfully this run,
  both the market-wide query and the per-ticker filter against
  `scripts/fixed-queries/foreign-flow-range.sql` / `idx_daily_data`. No fallback needed;
  the exchange definition was used throughout, never the broker-domicile
  `foreign-flow/{symbol}` endpoint.
- **Block 4 visuals (Supabase MCP connector)**: available and used successfully.
  `scripts/fixed-queries/social-media-bucket-listing.sql` returned the bucket's file
  list; all three "What the Data Unearthed" findings were illustrated with real,
  eligible, window-correct social cards
  (`stock-performance-gainers-lq45_20260731_1.jpg`,
  `earnings-report-tins-spike_20260730_1.jpg`,
  `filings-signal-chain-iata-sell_20260730_1.jpg`). No `charts.mjs` fallback was needed
  this run, so no `chart-*.svg`/`.png` files were generated or delivered; this type's
  documented exception (social cards substitute for the standard hero chart) applies in
  full.
- **Card exclusions worth flagging**: two `foreign-flow-1/2_20260727` cards exist with a
  filename date inside this week's window, but their own content covers the *prior*
  week (20-24 Jul), so they were not used (read the window off the image, not the
  filename, per the workflow doc). Two `foreign-flow-1/2_20260801` cards likely cover
  this week's actual data but are dated 1 Aug (a Saturday), outside the hard Mon-Fri
  filename-date filter, so they were excluded too even though probably useful. Neither
  exclusion was treated as a connector failure; both are the date filter working as
  documented.
- **Card reconciliation note**: the `stock-performance-gainers-lq45_20260731_1.jpg`
  card's own printed aggregate ("INDEX +0.7%") does not reconcile with the
  independently computed LQ45 index WoW (+1.05%, from `index-daily/lq45/`), likely a
  different aggregation method on the card's side (possibly a different index proxy or
  a rolling calculation). The card's per-ticker figures (INKP, INCO, BRPT, SCMA, AADI,
  etc.) all reconciled exactly against the API-computed constituent closes and were
  used; the card's own index-level summary number was not quoted anywhere in the
  issue, per the reconciliation rule ("keep the card as decoration and quote the API's
  numbers" where a figure doesn't check out).
- **Top Weekly Movers**: `companies/top-changes` returned `latest_close_date:
  2026-07-31`, which does match the window's Friday, so by the letter of the gotcha
  table it was technically usable. It was not used: its own top gainer (MLPT) showed a
  +2,611% "move" that is an unadjusted-stock-split artifact (MLPT split 1:25 on 29 Jul,
  reported in the prior issue), not a real price change, and the rest of the
  whole-exchange list skewed toward the same illiquid micro-caps the workflow doc warns
  about. Fell back to computing movers directly from the LQ45 universe's daily closes
  (§2b route), consistent with both of the two most recently delivered issues' own
  choice on this point (2026-07-13 and 2026-07-28), and disclosed in the issue's own
  Top Weekly Movers intro and appendix.
- **`$NEWSLETTER_HOME/samples/weekly-insights-v2/`**: present this run, used as the
  section-order/format reference. Also cross-checked the two most recent delivered
  issues in the same folder tree
  (`newsletter_2026-07-28_weekly-insights-v2/`,
  `newsletter_2026-08-01_monthly-market-pulse/`) for current formatting precedent.
- **Masthead greeting**: the workflow doc documents a 2026-07-29 revision removing any
  greeting line ("Hi there," / "Good morning!") from this type's masthead. The most
  recently delivered issue (2026-07-28) still carried "Hi there," predating or missing
  that revision. This run followed the current documented spec and omitted any
  greeting line.
- **"The Other Side" block**: included as block 8, per the current workflow doc
  (nine blocks total). The most recently delivered issue (2026-07-28) did not include
  this block at all. This run followed the current documented spec rather than that
  prior delivery's precedent.
- **Sources section in the HTML**: the most recently delivered issue's HTML had no
  dedicated "Sources" list block (citations were inline only). Hard rule 10 states the
  required order as "main content blocks -> primary CTA -> Upcoming Events -> Sources ->
  Appendix -> disclaimer", and sourcing.md requires a Sources list on every issue, so
  this run added an explicit HTML "Sources" section (matching the one already present
  in the `.md` draft) between Upcoming Events and the Appendix.
- **Issue numbering**: no authoritative prior-issue log was available. Known reference
  points: the skill's own sample is issue #28 (window 6-10 Jul); `queries.md` for the
  superseded sample references an 18 Jul send for window 13-17 Jul (implying #29,
  unconfirmed independently); the most recently delivered issue is #30 (window 20-24
  Jul, sent 28 Jul). Assuming an uninterrupted weekly cadence, this issue (window 27-31
  Jul) is **#31**. This is an inferred sequence number, not confirmed against an
  external send log; flagging for reviewer correction if the actual sequence differs.
- **Upcoming Events sheet**: reachable, fetched live via `curl`. One still-upcoming row
  as of the issue date ("Making Claude your Investment Companion", 24-25 Aug 2026,
  online); included in full (all five fields, verbatim from the sheet). The n8n and
  Hermes rows present in older samples/issues are no longer in the live sheet, consistent
  with the prior issue's own observation that past events drop off the sheet over time.
- **TINS card figures verified independently**: the `earnings-report-tins-spike`
  card's printed profit/revenue growth (+305% / +17%) were cross-checked against
  `company/report/TINS.JK/?sections=financials`'s `yoy_quarter_earnings_growth`
  (3.04555806789774, i.e. +304.56%) and `yoy_quarter_revenue_growth`
  (0.174128418426681, i.e. +17.41%) before use. The newsletter states the API's own
  2-decimal figures (+304.56% / +17.41%) rather than the card's rounded marketing
  numbers, per this skill's number-formatting convention; the two are the same
  underlying figure, not a discrepancy.
- **TINS and IATA are not LQ45 constituents**: they never appear in the Top Weekly
  Movers or Key Data Bites tables (which are scoped to the LQ45 universe this issue).
  Their figures in "What the Data Unearthed" were sourced directly from `daily/`,
  `company/report/.../financials`, `filings/`, and the Supabase foreign-flow query,
  not from the LQ45-universe computation used for the tables.
- **`upcoming_dividend` field**: `company/corporate-actions/AKRA.JK/` carries a
  dedicated `upcoming_dividend` field (ex-date 2026-08-03, IDR 50/share, payment
  2026-08-14), separate from the generic historical `dividend` array. Flagging since an
  extraction pass that only checks `dividend` will miss it, as an earlier pass in this
  same run did before being corrected.
- **Web research used**: BI's 2026 RDG meeting schedule and the BPS July-CPI release
  date are not in the Sectors API; both were sourced via web search and cited in
  Sources, per sourcing.md's mandatory web-research rule for this kind of scheduled
  macro row.

No hard failures this run. No fetch returned empty/unusable data for a required block.
