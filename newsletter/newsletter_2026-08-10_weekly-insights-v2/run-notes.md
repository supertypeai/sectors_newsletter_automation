# Unattended-run notes, 2026-08-10

- Environment: `NEWSLETTER_UNATTENDED=1` set. No questions were asked; documented
  defaults from SKILL.md's "Running unattended" table were applied throughout.
- Deviation from the literal request: the user asked for defaults to be recorded
  in an HTML comment at the top of the delivered file. SKILL.md explicitly
  documents that as the exact anti-pattern a prior run caused (an HTML comment
  ships byte-for-byte in the sent email, is visible in message source to any
  recipient, and counts against Gmail's ~102KB clipping threshold; a real incident
  on 2026-07-29 leaked run-notes this way). This run followed the skill's
  documented mechanism instead: this separate `run-notes.md` file, never read by
  the send path. Flagged to the user in-conversation before proceeding.
- Issue type: named explicitly in the request (`weekly-insights-v2`), no default
  needed for type selection.
- Window: today (2026-08-10, Monday) has no fresh `data_as_of` gap issue; resolved
  Mon-Fri window is 3-7 August 2026, prior week 27-31 July 2026, per the
  workflow's window logic. Issue date (2026-08-10) used throughout per Hard rule
  11, not a computed Monday.
- Foreign flow: Supabase MCP connector WAS available this run. Used the
  documented exchange definition (`idx_daily_data` via
  `scripts/fixed-queries/foreign-flow-range.sql`), not the broker-domicile
  aggregation, market-wide and for the MAPI/ASII figures in "What the Data
  Unearthed."
- Block 4 visuals: connector was available and `social-media-bucket-listing.sql`
  ran successfully (query fine, not a connector-absence or query-error case).
  - MAPI finding: real eligible card found in-window
    (`filings-becoming-mapi-ocean_continuum_20260807_{1,2}.jpg`), used directly.
  - ASII finding: real eligible card found in-window
    (`filings-signal-chain-asii-buy_20260806_{1,2}.jpg`), used directly.
  - VKTR finding: query returned rows, but none eligible for a VKTR-specific
    card in the 3-7 Aug window (checked date filter, story-prefix exclusions,
    and relevance; no filename matched). This is the "query fine, nothing
    eligible" case, not a connector or query defect. Fell back to a generated
    `sparkline` chart (`chart-vktr-rights-rally.svg`/`.png`) per the documented
    fallback, and skipped the Instagram/Threads credit line under that one image
    since it isn't a sourced card.
- `$NEWSLETTER_HOME/samples/weekly-insights-v2/` was present (not absent) this
  run; used its `queries.md` and `newsletter.md` as the resolved-recipe and
  section-order reference, with the explicit caveat in that file's own banner
  that its foreign-flow rows predate the 2026-07-27 exchange-definition
  resolution and were not copied.
- Upcoming events sheet: reachable via `curl`, one still-upcoming row (24-25 Aug
  2026 Claude/Sectors workshop), included as the standing closing block.
- Top Weekly Movers: `companies/top-changes` returned `latest_close_date:
  2026-08-07`, matching the window's Friday, and no stock-split/rights-issue
  distortion was found on inspection of the top five gainers/losers (unlike the
  18 Jul and 27-31 Jul issues, which both had to fall back to the LQ45-only
  computed-movers route). Used `top-changes` directly, market-wide, per the
  primary (non-fallback) path in workflow doc §2. LQ45 breadth and
  best/worst-LQ45 stats were still computed separately via the 45-constituent
  `daily/` pull, Friday-to-Friday (31 Jul close to 7 Aug close), consistent with
  the WoW basis used everywhere else in the issue.
- Hard-failure checks: no required block returned empty data, and no figure had
  to be invented. One field was dropped rather than guessed: VKTR's rights-issue
  subscription price returned `0` (implausible for a real rights offer), so the
  issue reports the ratio and trading dates only and says the price was omitted,
  per Hard rule 3.
