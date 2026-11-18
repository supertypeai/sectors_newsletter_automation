# Unattended-run notes, 2026-11-19

Issue type (`sector-spotlight`) was named in the run instructions. `NEWSLETTER_UNATTENDED=1`. Every decision below was made without a human to ask.

- **Issue date**: 2026-11-19 per the WIB date in the run instructions (the Sectors API reported today as 2026-11-18). `data_as_of` is 2026-11-18, the latest close returned.
- **Sub-sector and hook (not named in the prompt)**: Oil, Gas & Coal. Largest dispersion story among the 33 sub-sectors: 88 companies, IDR 1,144.95T, median P/E 9.3x against weighted 26.0x, YTD -53.2%. Hook: Newcastle coal rebound the week of 9 to 13 Nov (CNBC Indonesia Research, 15 Nov 2026). Banks (last spotlight) was not repeated.
- **7-day window**: 11 Nov close to 18 Nov close from `daily/`; matches `top-changes` 7d (ITMG +4.0%).
- **Dropped sub-sector `mcap_change.1w` (+7.8%)**: it contradicts the members (median screened member -0.1%, largest name BYAN -3.7%), so it was not published. YTD figure kept.
- **Dropped sub-sector `weighted_avg_growth_data` / `growth_forecasts`** (2025 earnings growth +194.5%, 2026 forecast +97.4%): contradicts member earnings (AADI, ADMR, ITMG fell 35% to 47% in 2025). The forecast section was replaced with a member-level "the E fell" block. The issue says so in a caption.
- **Dropped 2026 `pb`** from `valuation.historical_valuation` (values like 27,642x are garbage). P/E only was used.
- **ADRO earnings excluded** from the earnings tiles: its 2023 earnings/revenue of 76.9% fails plausibility. ADRO's ROE (8.9%) and net cash are still shown in the peer table; ROE is computed as `earnings / total_equity` for 2025 from `historical_financials`, not read from a ratio field (`historical_financial_ratio` is not in the report payload for these names).
- **Market-cap floor**: IDR 3T workflow default; 36 of 88 passed with `pe_ttm > 0`.
- **Group cards**: groups defined from `overview.industry/sub_industry` (coal producers: PTBA, AADI, GEMS, BSSR, ITMG, ADRO; Oil & Gas: RATU, ENRG, RAJA, SHIP). ABMM, DEWA, BULL, ELSA, MEDC, AKRA were left out because their industry was not checked. MBSS (coal distribution, -16.8%) and PGAS (+1.3%) disclosed as contradicting names. Moves are simple averages: coal +1.7%, oil and gas -10.5%.
- **Name that breaks the pattern**: ADMR (-7.4%, 85.4% owned by ADRO per `ownership.major_shareholders`), compared with ADRO, AADI, ITMG on P/E, ROE and net debt to EBITDA (2025).
- **Flow strip omitted**: ADMR institutional flow is net-buy in most months and does not cut against the price move clearly; not required by the skeleton.
- **Web sourcing**: one source cited (CNBC Indonesia Research via IMA, 15 Nov 2026), fetched. The journalarta.com article returned 403 and was not used. KabarBursa (14 Oct 2026) was read but is older than the week and not cited.
- **Upcoming Events**: sheet fetched by curl, four rows; only "Building Agents that Build Your Business" (9 to 10 Dec 2026) is still upcoming.
- **CTA URL**: `https://sectors.app/indonesia/oil-gas-coal` follows the banks pattern; not verified live.
- **No `$`**: "USD 146.75" is written out instead of a dollar sign (hard rule 16 grep). Tickers appear only inside links; the Appendix uses `{ticker}` placeholders.
- **Skipped**: `~/.claude/skills/UTM_CONVENTION.md` and the Desktop `samples/` path named in SKILL.md do not exist on this runner. UTM params follow `newsletter-format.md`; structure follows the repo's `newsletter/samples/sector-spotlight/` and the 2026-10-22 issue. No chart generated (sector-spotlight uses HTML blocks). No Supabase/dbquery access needed.
- **Not committed**: files are left in the working tree for the CI step to publish.
