# Unattended-run notes, 2026-11-12

Issue type (three-stock-story) and delivery target were given in the request. Defaults and judgment calls made with `NEWSLETTER_UNATTENDED=1` and nobody to ask:

- **Issue date**: 2026-11-12 as instructed (WIB), used for `date:`, the folder name and every `utm_campaign`. `data_as_of` is 2026-11-11, the latest close the API returned.
- **NEWSLETTER_HOME**: used the environment variable (`<repo-root>/newsletter/`).
- **Exchange**: IDX, since the ask named no market and the type is IDX by construction.
- **Stock picks**: none were named. Discovery ran `companies/top-changes/` (30d) and `filings/?limit=40`. The 30-day top movers were illiquid or distressed names with no common thread, so the pattern came from the filings stream: majority holders (all above 60% after the filing) adding to their stakes. Picks: DGIK, IATA, NRCA. IMPC also showed same-day holder purchases but was left out because the 2026-08-12 issue already covered it.
- **Why-now reconciliation against the tape**: DGIK's 9 Nov purchase (204.26M shares vs 1.80M traded), IATA's 3 Nov purchase (IDR 66, below that day's low of IDR 74, 1.23B shares vs 121.79M traded) and NRCA's 9 Nov purchase (14M shares vs 1.21M traded) are all described as larger than, or outside, the regular-market tape. The copy states the figures and does not speculate on why.
- **52-week high basis**: the tiles and last timeline rows use `overview.all_time_price["52_w_high"]` for all three picks. The chart uses the `daily/` series only. "Highest/lowest close of the last 90 days" rows come from `daily/`, not from the overview's 90-day fields (they differ: NRCA 610 close vs 630 intraday).
- **Rebased chart window**: 2 to 11 November (8 trading days), anchored on the last close before the first purchase date in the trio (IATA, 3 Nov). The skeleton gives no fixed window.
- **Sources and fetch failures**: Bisnis.com pages returned HTTP 403 to WebFetch, so no Bisnis claim is used in the issue (a 2021 GDK acquisition price, the IATA rename and the 22 June 2026 AGM were seen only in search snippets and were left out). Cited and fetched: EmitenNews (4 Nov 2026 and 12 Aug 2026) and Kabar Bursa (6 Aug 2026). The EmitenNews 4 Nov article gave a DGIK close of IDR 122 that conflicts with the API (IDR 132); the API figure governs and the source figure is not used. A search result mentioned a Tokyu Construction 25% stake in DGIK dated 4 Nov 2026, but the fetched article did not mention it, so it is omitted.
- **DGIK timing**: the treasury-share transfer window opens 11 Nov, yet the filed purchases are dated 6, 9 and 10 Nov and total 560.51M shares, more than the 400.21M treasury shares in the plan. The issue states both facts side by side and draws no link.
- **Null fields**: `future.analyst_rating_breakdown` and `company_growth_forecasts` are null for all three, so the issue says nothing about consensus. No management guidance was found for any pick.
- **IATA 2022 revenue change** (+1,869.6%) is an outlier and is shown as n/a with a one-line caption, per the plausibility rule.
- **Company name for IATA**: the API still lists "MNC Energy Investments", which is used. The rename reported in search results could not be verified from a fetched source.
- **Upcoming Events block**: the sheet was fetched live. All three rows (19 Sep, 24 to 25 Sep, 28 to 29 Oct 2026) are before 12 Nov 2026, so the block is dropped per `upcoming-events-source.md`.
- **UTM_CONVENTION.md**: `~/.claude/skills/UTM_CONVENTION.md` does not exist on this runner, so links follow the five-parameter pattern in `newsletter-format.md`.
- **Sample diff**: `samples/three-stock-story/newsletter.html` and the 2026-08-12 issue use the pre-2026-10-15 format (`$` tickers, per-section "The story / The people" prose). The skeleton and `company-issue-components.md` were followed instead, and the `$` was not reproduced (hard rule 16). The reference issue `newsletter_2026-10-15_three-stock-story` named in the skill is not in the repo.
- **Sources list headlines** keep the original ticker text where a headline names one (DGIK, IATA, SSIA) and are not linked.
- **Not done**: `samples/three-stock-story/` was not refreshed, and nothing was committed.
- No question was put to a human at any point.
