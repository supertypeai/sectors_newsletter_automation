# Section skeleton: sector-spotlight

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Read this file only for the type you are actually writing.

### Sector spotlight

A **subsector-level argument**, not a three-name peer table with a hook glued on top. The
issue starts at the whole sub-sector's valuation, explains why the group prints the number
it prints, and only then narrows to individual names. A single company appears as evidence
inside that argument, never as the subject of the issue.

Every section heading below carries a **claim**, phrased as the finding rather than the
data source ("Palm Oil and Poultry Dominate the Cheap End", not "Screener Results"). Every
table gets a **one-line italic caption underneath** naming the source and the window
("Subsector historical valuation.", "7-day change from 12 August's close to 19 August's
close."). Four to six tables across the issue is normal here; this type is table-heavy by
design.

1. **H1 = the subsector finding.** States what the whole group is doing and the reason in
   one line, drafted fresh each run from that run's numbers. "Food & Beverage Trades at a
   Five-Year Low, Led by Commodities". Never a ticker-led headline, and never a reused
   template.
2. **Dateline + lede.** The italic `*Sectors Sector Spotlight, <date>. Data as of
   <date>.*` line, then one paragraph sizing the group: median P/E, number of listed
   companies, total market cap.
3. **The group's own history** — a table of the sub-sector's median P/E, P/B and P/S over
   the last five years, current year bolded, from
   `subsector/report`'s `valuation.historical_valuation`. Under it, the paragraph that
   makes the number mean something: the median against the market-cap-weighted P/E, and
   what the gap says about the group's internal composition (commodity producers vs
   branded names, banks vs multifinance, and so on). This dispersion read is the spine of
   the issue.
4. **Where the valuation actually sits** — the screener table, one row per member above a
   stated market-cap floor, ranked by P/E, columns ticker, company, P/E, market cap. Then
   the read: which industries cluster at the cheap end, and why that means the group's
   headline multiple is not a "buy the sector" number.
5. **Recent performance** — the 7-day (or the run's stated window) movers table for the
   sub-sector, with the group's own move stated above it. Then the contrast: which part of
   the sub-sector drove the move and which part did not participate. This section exists
   to show whether the rebound or sell-off is broad-based.
6. **The name that breaks from the group** — one company picked because it contradicts
   the pattern established above, not because it is the biggest. Its trigger (index
   review, earnings, a filing) in a sentence, then the **peer table**: price, P/E,
   EV/EBITDA, debt/equity, interest coverage, ROE, dividend yield, one row per close peer,
   **best-in-column values bolded**. The caption states which period each column comes
   from, since valuation columns are the current-year series while leverage and
   profitability are the last reported fiscal year.
   Then the leverage-adjusted read: a cheaper P/E next to materially higher debt is not
   the same discount it looks like on the headline multiple. Close on the fundamentals
   direction (ROE trend, latest-quarter earnings growth, institutional flow) where it
   cuts against the price.
7. **What the group's earnings are expected to do** — realized growth for the last full
   year against the forecast for the current one (`growth.weighted_avg_growth_data`,
   `growth.growth_forecasts`), and the one sentence explaining what that forecast does to
   the trailing multiple. This is what turns "cheap" into "priced for slower earnings".
8. **The Key Takeaway** — three or four short paragraphs: what the headline multiple
   really represents, which part of the group the rebound favoured, how the featured name
   reads against its peers, and the open question the reader is left to watch. Valuation
   context throughout, never "the one to buy".
9. **Sources** list, **Appendix** (endpoint/field trace), disclaimer footer, in that
   order.
