# Unattended-run notes, 2026-08-12

Issue type (three-stock-story) and delivery target were both given explicitly in
the request, so neither required a default. Notes below cover every place this run
made a judgment call under `NEWSLETTER_UNATTENDED=1` with no human reachable to ask.

- **NEWSLETTER_HOME resolution**: used the `NEWSLETTER_HOME` environment variable as
  set by the CI runner (`<repo-root>/newsletter/`), option 1 in the skill's
  resolution order. No fallback needed.
- **Sample reference**: `$NEWSLETTER_HOME/samples/three-stock-story/` was present
  this run (not absent), so no absence-fallback default applied. Used it to check
  section order and heading logic during self-review, per the shared pipeline's
  stage 4.
- **Stock picks**: no tickers were named in the request, so picks came from this
  run's own discovery pass (`companies/top-changes/?periods=30d` +
  `filings/?limit=20`), per the workflow doc's step 1. Landed on MDIA, SGRO, IMPC,
  a connective "founder/tycoon control tested three ways" thread, none forced.
- **SGRO's core "why now" (Sampoerna family's exit to POSCO International, and the
  resulting rename)** is dated November 2025-January 2026, older than the ~30-day
  recency window `sourcing.md` prefers for a lead fact. Judgment call: kept it as
  the section's main hook because it's the standing reason the company's identity
  changed and is still the operative fact for readers unfamiliar with the story,
  and supplemented with a within-two-weeks news item (Kontan Insight, 30 Jul 2026)
  for current-state color. Flagging this rather than silently treating it as
  equivalent to MDIA's and IMPC's same-week hooks.
- **IMPC's 12 August 2026 insider sale** (Tunggal Jaya Investama, 1.45B shares) has
  no independent web corroboration, since it is same-day with this issue and press
  coverage hadn't caught up. Sourced solely to `sectors.app` filings data
  (structured fields: `holding_before`/`after`, `share_percentage_before`/`after`,
  `transaction_value`, `price_transaction[]`), which the compliance rules treat as
  a valid citable source on its own. Web precedent (two prior, similarly-framed
  sales in Aug and Nov 2025) is cited separately and labeled as prior transactions,
  not assumed to explain this one's stated reason.
- **Upcoming Events sheet**: fetched live, one row found ("Making Claude your
  Investment Companion," 24-25 Aug 2026), still in the future relative to this
  issue's 2026-08-12 date, so it was included. No omission needed.
- **Foreign-flow definition / Block 4 social-card auto-select**: not applicable to
  this issue type (both are weekly-insights-v2/monthly-market-pulse-specific
  decision points).
- No question was put to a human at any point in this run.
