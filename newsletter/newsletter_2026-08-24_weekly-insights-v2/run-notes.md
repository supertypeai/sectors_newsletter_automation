# Unattended-run notes, 2026-08-24

- Environment: `NEWSLETTER_UNATTENDED=1` was already set in the runner. No
  questions were asked; documented defaults from SKILL.md's "Running
  unattended" table were applied throughout. `NEWSLETTER_HOME` was also already
  set (`<repo-root>/newsletter`), so no fallback path was needed.
- Issue type: explicitly named in the request (`weekly-insights-v2`), which is
  also the unattended default, so no substitution was needed.
- Issue date: used 2026-08-24 (the exact WIB date supplied in the run
  instructions) throughout, per Hard rule 11, rather than inferring "today"
  from this runner's own (UTC) system clock. This value went into the
  frontmatter `date:`, the delivery folder name, the masthead line, and every
  `utm_campaign` suffix.
- Window: `companies/top-changes` returned `latest_close_date: 2026-08-21`
  (a Friday), matching a Mon-Fri window of 17-21 August, so the movers table
  is window-accurate and was used directly (no need for the `top-changes`
  fallback route). Prior week for the WoW compare: 10-14 August.
- Holiday deviation (flagging this as an interpretation, not a scripted
  step): Monday 17 August is Indonesia's 81st Independence Day, a national
  exchange holiday (confirmed via web search, cited in Sources). `idx-total`
  and `index-daily` returned no row for that date. The workflow doc's
  "Monday open to Friday close" convention for the `idx-total` WoW figure has
  no documented fallback for a holiday Monday, so this run used the first
  trading day of the window (Tuesday 18 August) as the week-open basis
  instead, and said so explicitly in the issue's own Key Data Bites line
  ("holiday-shortened week", "Tuesday's reopening level") so the method is
  visible to the reader, not just to this file. LQ45/IDX30 were unaffected
  since those already use a pure Friday-to-Friday basis.
- Foreign flow: Supabase MCP connector WAS available this run. Used the
  documented exchange definition (`idx_daily_data`) via ad hoc SQL matching
  `scripts/fixed-queries/foreign-flow-range.sql`'s exact table/columns/
  aggregation (net volume × close, grouped by symbol over the window), for
  the market-wide ranking and the JARR/ISAT per-ticker figures throughout.
  Never mixed with the broker-domicile definition.
- Block 4 visuals: the GCP bucket listing succeeded (547 objects, one page,
  matching the workflow doc's own last-verified count), so this was the
  "listing fine" case throughout, never a connector/listing failure.
  - JARR finding: filenames carry no ticker information (e.g.
    `volume-spike_20260821_3.jpg` gives no hint which of several tickers it
    depicts), so this run downloaded and visually inspected several
    same-day `volume-spike_2026082*` candidates to identify which slide
    was JARR's own card, rather than guessing from the filename or the
    caption alone. Slide 3 of the 21 August set was confirmed as JARR's
    (today's volume 44.8M, 7d change +52.74%, matching `top-changes` to the
    hundredth of a percent) and used directly; every figure quoted from it
    in the issue was independently reproduced from `daily/JARR.JK/` and the
    foreign-flow SQL before publishing, per the reconciliation rule.
  - Incidental to the above: this run also queried a `social_post_queue`
    Supabase table (captions + image URLs for each generated post) purely to
    narrow down which image number to download and look at, since it is
    faster than downloading all 8-9 slides per day. This table is **not**
    one of the skill's two pinned fixed-queries and isn't referenced in the
    workflow doc; no figure published in the issue came from that table's
    caption text, every number was re-verified against `sectors.mjs` or the
    pinned foreign-flow query first. Flagging this as a deviation from the
    documented "two pinned queries only" Supabase scope, taken for card
    lookup convenience, not as a content source. A future run could avoid it
    entirely by just downloading and eyeballing each day's slides directly.
  - ISAT and FILM findings: no ticker-specific eligible card existed in the
    bucket for the 17-21 August window (checked by filename against both
    tickers and against the generic `volume-spike`/`filings-signal-*`
    listings for the window; neither ticker appears). Fell back to a
    generated chart per finding (`barChart` financial mode for ISAT's daily
    foreign flow, `sparkline` for FILM's daily close), per the documented
    fallback, and skipped the Instagram/Threads credit line under both since
    they aren't sourced cards.
- `$NEWSLETTER_HOME/samples/weekly-insights-v2/` was present; used its
  `queries.md` (honoring its own banner that the foreign-flow rows there
  predate the exchange-definition resolution and should not be copied) and
  the most recently delivered issue, `newsletter_2026-08-16_weekly-insights-v2/`,
  as the primary structural and ticker/HTML-styling precedent, since it
  postdates the sample.
- Upcoming events sheet: reachable via `curl`, one row (the Claude/Sectors
  workshop, 24-25 August 2026). Its first day coincides with this issue's own
  send date; included anyway since the event runs through 25 August and the
  row is not yet fully in the past relative to the issue date.
- What's Ahead corporate-action poll covered the 45 LQ45 constituents plus the
  week's ten top movers (JARR, INET, BSWD, PACK, PSAB, TCPI, ARTO, FILM, MPRO,
  MSIN), TPIA, BREN, plus a widened set (KIJA, BNBR, IATA, BWPT, KOTA, PIPA,
  BYAN, GGRM, TINS, AVIA, ENRG, BSDE, CBDK, YUPI, SMGR, WSKT, WIKA, ADHI, PTPP,
  BBKP) after the initial LQ45+movers poll returned an empty week grid for
  24-28 August; the widened poll surfaced $BWPT's 27 August AGM.
- Scheduled macro rows (3, within the documented 2-4 range): Bank Indonesia's
  next RDG (22-23 Sep), the FTSE Russell September 2026 review's 21 Sep
  effective date, and the FOMC's 16 Sep decision, each web-sourced and cited,
  and each mapped to a ticker/sector already named elsewhere in this issue
  (BBRI/BBCA, PTPP, AMMN/ANTM respectively). Did not include a BPS CPI release
  row; no official September-2026 release date could be confirmed via search
  (only the general end-of-month pattern), and the hard rule against
  speculative/unscheduled rows took precedence over padding to a fourth row.
- Hard-failure checks: no required block returned empty or unusable data, and
  no figure had to be invented. The one interpretive call this run made (the
  holiday week-open basis, above) is disclosed both here and in the issue's
  own copy, not silently absorbed.
