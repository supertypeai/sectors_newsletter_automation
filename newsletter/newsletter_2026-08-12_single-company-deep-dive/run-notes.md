# Unattended-run notes, 2026-08-12

`NEWSLETTER_UNATTENDED=1` was set; no human was reachable during this run. Every
decision below followed the documented unattended defaults in SKILL.md's "Running
unattended" table. This file is never read by the send path and is not part of
`newsletter.md`/`newsletter.html`.

- **Issue type**: named explicitly in the request ("single company deep dive"), no
  default needed.
- **`$NEWSLETTER_HOME` resolution**: the `NEWSLETTER_HOME` env var was set (option 1),
  used directly: `/home/runner/work/sectors_newsletter_skills/sectors_newsletter_skills/newsletter`.
- **Subject ticker/trigger**: not specified in the request, so I researched one. Picked
  **DSSA** (PT Dian Swastatika Sentosa Tbk) off a real, very recent trigger: an
  OJK-mandated treasury-share disposal that began 10 August 2026 (9.63B shares, 5% of
  issued capital), confirmed via web search and cross-checked against `news/`. This is
  the "re-angle and search until a genuine why-now trigger turns up" step the workflow
  doc requires, not a fallback default, but noting it since no ticker was given.
- **`$NEWSLETTER_HOME/samples/single-company-deep-dive/`**: present, not absent, so it
  was used for section order and heading-logic reference (trigger → read → numbers →
  valuation → what's next → sources → appendix → disclaimer, matched). Two elements of
  that sample are stale relative to the current hard rules and were **not** copied:
  it carries no UTM parameters on any `sectors.app` link, and its HTML footer is a
  generic copyright block rather than the fixed disclaimer markup newsletter-format.md
  now mandates (both rules are dated 2026-07-24, after the sample's own 2026-07-15
  issue date). This run followed the current `newsletter-format.md` contract instead
  (full UTM params on every owned-domain link, the current fixed footer), matching what
  the most recently delivered weekly-insights-v2 issue (2026-08-10) actually ships.
  Worth refreshing the sample from this run per SKILL.md's own suggestion.
- **Upcoming-events sheet**: reachable this run (plain `curl`, no fallback needed). One
  still-upcoming row as of 2026-08-12: "Making Claude your Investment Companion"
  (24-25 Aug 2026), included as the closing block.
- **Foreign-flow / Supabase MCP / social-card auto-select**: not applicable to this
  issue type (those are weekly-insights-v2-specific mechanisms); no Supabase MCP call
  was needed this run. The required hero chart was generated directly with
  `scripts/charts.mjs` (a `compose` price line, 90-day window, wrapped in an opaque
  background rect per newsletter-format.md).
- **Data-quality judgment call** (not a literal table default, but a call made without
  a human to confirm, flagged per "anything else this skill would ask, take the
  documented default and state the choice here"): DSSA's own price-to-earnings ratio
  for FY2024 (57.1x), FY2025 (201.7x), and the current 2026 read (~49.5x) all fall
  outside `data-quality.md`'s plausibility band (~3x-40x for large caps). This is very
  likely a numerator/denominator scale mismatch: DSSA executed a 1:25 stock split on
  2026-04-09 (and a 10:1 split in 2024-07), and the per-share earnings series looks
  fully restated to the post-split share count while the price series feeding some
  historical-year P/E calculations may not be on the same consistent basis. Rather
  than publish those out-of-band multiples (or the same-shaped 2026 P/B of 6.01x
  against a 1.22x peer average), I omitted the specific figures and reported only the
  in-band evidence instead: 2022/2023 P/E (both in-band, close to their own peer
  averages), the FY2022-2025 revenue/earnings/ROE decline, and the 2026 peer-average
  P/E of 11.82x, stating qualitatively that DSSA's current multiple sits well above
  both without citing the suspect number itself.
- **Dividend section dropped**: every `dividend.*` field returned null for DSSA this
  run (no yield, payout, or upcoming date on file), so that sub-topic was omitted
  entirely rather than left blank or guessed.
- **Analyst consensus / forward guidance dropped**: `future.analyst_rating_breakdown`
  and `future.company_growth_forecasts` were both null. Web search did surface a single
  broker's (MNC Sekuritas) buy-on-weakness call with an explicit entry range, target
  price, and stop-loss; I chose to leave that detail out of the issue entirely rather
  than relay a specific trading call, even attributed, to stay clearly on the
  reporting side of the compliance line (see `compliance.md`'s reconciliation section,
  which frames aggregate `analyst_rating_breakdown` consensus as reportable but doesn't
  extend that same treatment to one broker's tactical entry/target/stop-loss).
- **Rasterize/HTML tooling**: Puppeteer was already installed in the skill's
  `node_modules` (no `npm install` needed this run); `scripts/rasterize.mjs` produced
  `chart-dssa-price.png` from the SVG without issue.
