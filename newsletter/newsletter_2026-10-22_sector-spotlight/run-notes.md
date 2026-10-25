# Unattended-run notes, 2026-10-22

Issue type (`sector-spotlight`) was named in the run instructions. Everything below is a decision this run made on its own because no human was reachable to ask.

- **Documentation gap**: the run instructions refer to a `run-notes.md` the skill documents. `SKILL.md` and its references contain no section on unattended defaults or run-notes. This file follows the format of `newsletter_2026-08-20_sector-spotlight/run-notes.md`.
- **`NEWSLETTER_HOME`**: set to `/home/runner/work/sectors_newsletter_automation/sectors_newsletter_automation/newsletter`, used as given.
- **Issue date**: 2026-10-22 per the WIB date in the run instructions (the runner's own clock and the Sectors API both reported 2026-10-21). `data_as_of` is 2026-10-21, the latest close the API returned.
- **Sub-sector and hook (not named in the prompt)**: chose banks. Reasons: largest sub-sector by market cap (IDR 2,075.32T), market cap -9.4% over the week, median P/E 8.0x against a weighted 16.1x (a clear dispersion story), and a dated, sourced hook (MSCI's warning on Indonesia's index status, 16 Oct sell-off).
- **Name that breaks the pattern**: BNGA (CIMB Niaga), one of only two of 25 screened banks that rose over the 14 to 21 Oct window. Compared against BMRI, BBNI and BBRI.
- **7-day window**: 14 Oct close to 21 Oct close, computed from `daily/` closes; it matches the `companies/top-changes` 7d figures (BBCA -13.9%, BNGA +2.7%).
- **Market-cap floor**: IDR 3T, the workflow default, kept. 25 banks passed.
- **EV/EBITDA and interest coverage omitted**: `enterprise_to_ebitda` is null for all four compared banks and interest coverage is not a bank metric. Replaced by P/B, debt/equity and capital adequacy ratio. BBNI's 2025 capital adequacy ratio is null and shows as n/a.
- **Dividend yield column dropped**: `dividend.yield_ttm` and the per-year `total_yield` disagree for BBRI (12.3% vs 7.4% for 2026), BBNI has no 2026 dividend entry (yield_ttm 0), and BMRI's 14.7% sits at the edge of the data-quality band. The column was left out rather than ship inconsistent figures.
- **BSWD outlier**: top gainer on `top-changes` (+124.3%, close IDR 8,075) but not in the 25-name screened set. Mentioned in one sentence, not tabulated. Its market cap was not checked.
- **Derived figures**: median 7-day move of the 25 screened banks (-6.6%) and "23 of 25 fell" are computed from `daily/` closes for the 25 screened tickers.
- **Institutional flow**: only direction is reported (sign of `net_transaction` across the seven monthly readings returned, none for March or May), because the field's unit is not documented.
- **Web sourcing**: two sources cited. Trading Economics item (16 Oct 2026) carries the MSCI claim, but the page mixes dates and index levels across related items, so only the MSCI warning is used from it, attributed. Databoks (16 Oct 2026) supplies the Composite -11.57% and finance index -8.98% figures. Other outlets surfaced in search (RMOL, Kabar Bursa, Sumbarbisnis, NewsBytes) were not fetched and are not cited; their intraday figures differ from the close.
- **Hero chart**: seven-bar `barChart` (`financial: true`) of 7-day moves, no benchmark line (it collided with bar labels in the first render). The HTML references `chart-banks-7d-move.png`; the CI publish-charts step re-hosts it.
- **Upcoming events**: sheet fetched via curl, three rows; two (19 and 24-25 Sep 2026) had passed, one kept (Claude for Market Analysis, 28-29 Oct 2026).
- **Skipped**: `~/.claude/skills/UTM_CONVENTION.md` and the `samples/` `queries.md` path named in SKILL.md do not exist on this runner, so UTM params follow `newsletter-format.md`'s UTM section and the repo's `newsletter/samples/sector-spotlight/` was used as the structural reference. The older 2026-08-20 issue still shows `$`-prefixed tickers and dash connectors; current hard rules were applied instead. No Supabase/dbquery access was needed.
- **Alt-text tickers**: the chart's alt text names tickers in plain text, since an `<a>` cannot sit inside an `alt` attribute.
