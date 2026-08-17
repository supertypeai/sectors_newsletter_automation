# Unattended-run notes, 2026-08-16

- Environment: `NEWSLETTER_UNATTENDED=1` was already set in the runner. No
  questions were asked; documented defaults from SKILL.md's "Running unattended"
  table were applied throughout. `NEWSLETTER_HOME` was also already set
  (`<repo-root>/newsletter`), so no fallback path was needed.
- Issue type: not named in the request, defaulted to `weekly-insights-v2` per the
  unattended default table (also the type explicitly requested this run).
- Deviation from the literal request: the user asked for every default to be
  recorded, and separately said never to use an HTML comment in `newsletter.html`
  or the visible body/Appendix. This file follows the skill's documented
  mechanism (a separate `run-notes.md`, never read by the send path) rather than
  any in-file marker.
- Window: today (2026-08-16, Sunday) has no fresh `data_as_of` gap; resolved
  Mon-Fri window is 10-14 August 2026, prior week 3-7 August 2026, per the
  workflow's window logic. Issue date (2026-08-16) used throughout per Hard rule
  11, not a computed Monday, even though this run landed on a Sunday rather than
  the type's usual Monday send day.
- idx-total's prior-week WoW comparison bullet (behind the prior week's "+2.91%")
  was recomputed fresh from this run's own `idx-total` fetch (Monday open
  2026-08-03 to Friday close 2026-08-07), rather than copied from the 2026-08-10
  issue's own published "+2.64%" figure for the same window. The two disagree;
  this run trusted its own live recomputation over the earlier issue's figure,
  consistent with Hard rule 1 (every figure traces to a real API field fetched
  this run). Not flagged in the issue itself, only noted here.
- Foreign flow: Supabase MCP connector WAS available this run. Used the
  documented exchange definition (`idx_daily_data` via
  `scripts/fixed-queries/foreign-flow-range.sql`), not the broker-domicile
  aggregation, for the market-wide figure and the TPIA/CUAN/IMPC/BBRI figures
  throughout.
- Block 4 visuals: connector was available and `social-media-bucket-listing.sql`
  ran successfully (query fine, not a connector-absence or query-error case).
  - IMPC finding: real eligible card found in-window
    (`filings-signal-cluster-impc-buy_20260814_{1,2}.jpg`), used directly.
  - TPIA finding: query returned rows, but none eligible for a TPIA-specific
    card in the 10-14 Aug window (checked date filter, story-prefix exclusions,
    and relevance; no filename matched). This is the "query fine, nothing
    eligible" case, not a connector or query defect. Fell back to a generated
    `barChart` (financial mode) of daily net foreign flow
    (`chart-tpia-foreign-flow.svg`/`.png`) per the documented fallback, and
    skipped the Instagram/Threads credit line under that image since it isn't a
    sourced card.
  - CUAN finding: same as TPIA, no eligible card in-window despite an
    `earnings-report-cpin-spike_20260811_{1,2}.jpg` card existing for a
    different ticker (CPIN) that week; not used since it doesn't illustrate the
    CUAN finding and its content wasn't verified against this issue's figures.
    Fell back to a generated `barChart` (`chart-cuan-foreign-flow.svg`/`.png`),
    same treatment as TPIA.
- `$NEWSLETTER_HOME/samples/weekly-insights-v2/` was present (not absent) this
  run; used its `queries.md` and `newsletter.md` as the resolved-recipe and
  section-order reference, with the explicit caveat in that file's own banner
  that its foreign-flow rows predate the 2026-07-27 exchange-definition
  resolution and were not copied. The most recent delivered issue
  (`newsletter_2026-08-10_weekly-insights-v2/`) was used as the primary
  structural and ticker-convention precedent, since it postdates the sample and
  reflects more recent corrections (e.g. bold+link treatment on every table-cell
  ticker mention, a fresh bold+link on the first prose mention after a table
  even if the same ticker already appeared bold-linked inside that table).
- Upcoming events sheet: reachable via `curl`, one still-upcoming row (24-25 Aug
  2026 Claude/Sectors workshop), included as the standing closing block. The
  poster image URL in the sheet changed from the one baked into the prior
  issue's HTML (now `.../images/claude_poster.png` rather than the
  commit-pinned `.../learn_claude_poster.png` URL); this run used the sheet's
  current URL, not the old cached one.
- Top Weekly Movers: `companies/top-changes` returned `latest_close_date:
  2026-08-14`, matching the window's Friday, so the movers are window-accurate
  and were used directly (market-wide), per the primary (non-fallback) path in
  workflow doc §2. LQ45 breadth and best/worst-LQ45 stats were still computed
  separately via the 45-constituent `daily/` pull, Friday-to-Friday (7 Aug close
  to 14 Aug close), consistent with the WoW basis used for LQ45/IDX30 elsewhere
  in the issue (idx-total itself uses a Monday-open-to-Friday-close basis
  instead, matching the wording convention established in prior issues, e.g.
  "from a Monday open of IDR X").
- What's Ahead corporate-action poll covered the 45 LQ45 constituents plus the
  week's 10 top movers (GIAA, MDIA, ARKO, BYAN, MGLV, NSSS, MLPT, IMPC, ELPI,
  RLCO) plus TPIA, BREN, and four names surfaced by headline scanning (BRNA,
  ENRG, AVIA, DOOH) — 59 tickers total, zero credits. This returned an empty
  Mon-Fri (17-21 Aug) week grid from the LQ45+movers set alone; widened per the
  workflow's "widen the list if a week comes back empty" guidance, which
  surfaced ENRG's rights-issue trading-window start (20 Aug) for the week grid.
- Hard-failure checks: no required block returned empty data, and no figure had
  to be invented. Nothing was dropped this run for implausibility.
