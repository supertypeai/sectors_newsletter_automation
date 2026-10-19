# Section skeleton: single-company-deep-dive

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Read this file only for the type you are actually writing. Markup for every block named below lives in `company-issue-components.md`, copy it from there. The reference issue is `newsletter_2026-10-14_single-company-deep-dive` (SMAR), match its layout and density.

### Single company deep dive

**This type earns the word "deep dive."** A reader who opens it expects the whole company,
not a note on one week's news: what the business actually sells, whether anything protects
those earnings, what a unit of revenue turns into by the time it reaches net profit, which
macro forces move all of that, and the long-run case for and against owning it. A recent
event can supply the reason to publish now, but it is the door, not the room. If the draft
would collapse to nothing once the event is removed, it is an event note wearing this
type's name, and the fix is more business analysis, not a longer trigger section.

**Opening stack, then five body sections plus the close.** The opening stack is the headline
with the company logo and standfirst, the At a Glance box and the company card with price
chart. After it come, in this order: the entry (why this company, now), the print block when
the entry is an earnings release, the business, the moat, the economics, the macro frame, then
the argued long-term read and what to watch. Do not give the one-line verdict its own standalone section, and do not
split the numbers and the valuation apart, the valuation *is* part of the read and belongs
in the same block as the trend it reinterprets. Headline and every H2 in Title Case.

**Length.** 1,300 to 1,900 words, above the skill's 400-900 default
(`../../newsletter-format.md`'s Length guidance), because the tables and charts carry the
series. Coverage is the promise, not word count: five sections at roughly 150 to 250 words
each is the shape, and a section that needs more
than three paragraphs is carrying numbers that belong in its table or chart. If the
research pass could not fill the business, moat and economics sections with real
company-specific findings, pick a different company or a different issue type.

**Figure density, the rule that decides whether this reads or not.** At most **three
figures per paragraph**, and every one of them earns its place by changing the reader's
mind about something. Everything else goes into the section's table or chart, or gets cut.
A paragraph that runs a series inline ("6.46% in 2023, 6.43% in 2024 and 7.65% in 2025")
is a table that lost its formatting: put the series in the table and let the prose say
which way it moved and why that matters. Prefer the round comparison to the precise one in
body copy, "roughly three times the sector median" over "33.33x against 10.25x", and let
the table carry both decimals.

**Every section opens on its claim.** The H2 states this issue's finding and may carry its
one headline figure (`Gross Margin Has Climbed From 10.4% to 17.3% in a Year`). The first
sentence under it restates the claim in plain words with no figure. The evidence follows. A section that opens with a number makes the
reader assemble the argument themselves, which is what makes a data-dense issue feel like a
data dump.

1. **Headline** — a declarative Title Case sentence naming the company or ticker and the
   structural tension the piece resolves, not this week's event alone.
   `SMAR Margins Doubled, but Operating Cash Flow Turned Negative`. Tighter is better,
   cut possessives and qualifiers. No question, no colon-subtitle. The company logo
   (`logo-<ticker>.png`, 32px, from the carousel skill's `assets/logos.json`, base64 PNG
   decoded to the issue folder) sits inline before the linked ticker.
2. **Standfirst** — directly under the headline in the same block, three short declarative
   sentences, no heading, no inline citations, no comma-chained subordinate clauses. Sentence one, what the business is and its scale.
   Sentence two, the thing about it that is changing. Sentence three, the counterweight,
   opened with a concessive ("Despite the margin compression, return on equity has held
   above 18% for four straight years").
2a. **At a Glance** — shaded `#fbe9d8` box, five bullets with a bold lead-in: the headline
   metric that moved (with the year-earlier figure), the price movement, the profitability or
   growth reading, the core business in one line, and an `Open Question` bullet putting the
   unresolved question to the reader without answering it. Green and red on every signed figure.
2b. **Company card** — shaded `#f2ede4` card: full legal name with linked ticker, three stat
   tiles (`Last close`, `Market cap`, `Market cap rank`), then the 90 day price chart (PNG, non
   zero y-axis) with a caption stating start, end and where the move happened.
3. **Why This Company, Now** — H2 naming the reason to publish, one or two short
   paragraphs, no more. An earnings print, a corporate action, an ownership filing, a
   regulatory change, or a valuation crossing its own historical band. Give the mechanism
   compactly: the rule or filing compelling it, the size in shares and as a percent of
   issued capital, the executing party, and one market print (negotiated volume and
   average price, discount to the regular close, net foreign flow that session). Then stop,
   and hand off to the business. This section is roughly a tenth of the issue. What the
   old event-note format spread across two paragraphs of market microstructure gets
   compressed here, or cut.
3a. **The print block** (only when the entry is an earnings release). An H2 stating the gap the
   quarter exposed (`Profit Doubled While Operations Absorbed Cash`), one sentence, the quarter
   `sankeySite` chart with a caption naming the largest cost and the profit, then a three row
   quarterly table (year-earlier quarter, prior quarter, latest quarter: net profit, operating
   cash flow, free cash flow, total debt) and one paragraph locating the visible source of the
   gap in the balance sheet, saying plainly what the data does not split out.
4. **What the Business Actually Sells** — H2 stating what the revenue is, in the reader's
   language ("Three Quarters of Revenue Is Still Voice and Data"). Carry:
   - The revenue mix by segment, the shares in the chart or a two-column table, the prose
     naming only the largest segment and the fastest-moving one
     (`company/get-segments`, edges where `target === "Total Revenue"`; for a bank, the loan
     book and funding mix from `financials_sector_metrics`).
   - Who the customer is and what they are paying for, in one or two plain sentences. A
     reader who does not follow the sector should finish this paragraph able to describe
     the business to someone else.
   - Where growth is actually coming from, segment by segment, not at the group level. A
     group revenue line that hides one segment growing 40% while another shrinks is the
     thing this section exists to open up.
   - Optional: the full segment decomposition as a `sankey` (revenue in, cost and opex
     out), which is this section's natural chart.
5. **What Protects the Earnings** — H2 stating the verdict on the moat, as a claim
   ("Scale in Deposits, Nothing in Pricing"). Name the moat by kind, then test it against
   evidence rather than asserting it: distribution, switching cost, licence or regulatory
   barrier, cost position, network effect, brand, or none. Evidence available in the data:
   - Position within the sub-sector: market cap rank, and the company's share of the
     sub-sector's total market cap or profit pool (`overview.market_cap_rank`,
     `subsector/report`'s `statistics` and `market_cap.total`).
   - The peer table, five or six comparable names with market cap, P/E TTM, P/B and net
     income, plus the `point_summaries` competitive score where populated
     (`company/report?sections=peers`).
   - The durability test: margin and return on equity stability across the eight-year
     financial history. A moat that is real shows up as returns that do not mean-revert.
     Say so plainly when the history shows the opposite.
   - Name at least one specific competitor and what it does better. A moat section with no
     named rival is a brochure.
6. **The Unit Economics** — H2 stating what a rupiah of revenue becomes
   ("Every Rupiah of Revenue Leaves Nine Cents"). One block, in this order:
   - The margin ladder, carried by the waterfall or bar chart rather than by the sentence:
     revenue to gross profit to operating profit to net profit. In prose, name only the one
     or two rungs that actually moved and say against which earlier year. This is where the
     reader learns whether the business is getting better or worse at turning sales into
     profit, and the chart is what makes that legible.
   - The return on that capital, as a small ratio table rather than a prose series: ROE,
     ROA and the sector-specific driver line by year. For a lender that driver is net
     interest margin, cost of funds, CASA and credit cost; for an operator it is capital
     expenditure against operating cash flow, which says whether growth is self-funded.
     The prose beside the table says which way the ratios moved and what moved them, and
     repeats at most one of the numbers.
   - Leverage and liquidity from `historical_financial_ratio[]`, one sentence naming the
     direction, not a year-by-year recital.
   - The period table (latest quarter plus the last three fiscal years, revenue, net
     profit, and a YoY-change column), with any comparability break as a one-sentence
     footnote directly under it. Write the footnote as a plain statement of fact, never as
     an aside addressed to the reader about the chart.
7. **The Macro Forces That Move It** — H2 naming the dominant one
   ("Rate Cuts Reach This Balance Sheet Before They Reach the Loan Book"). Two or three
   named, dated, cited forces, each traced to a specific line of this company's accounts:
   the policy rate to net interest margin or interest expense; the rupiah to imported cost
   of revenue or foreign-currency debt; a commodity price to a segment's realised price; a
   regulation or tariff to a named revenue stream. Every macro claim needs a source and a
   date (`../../sourcing.md`). Generic sector commentary that never lands on a line item in
   this company's statements does not belong here, cut it.
8. **The Long-Term Read** — H2 stating the interpretation as a claim
   ("The Market Is Pricing the Turnaround Before It Arrives"). One block, in this order. The
   valuation sits in a small table (`Multiple, Latest, Peer average, Own range`) and the closing
   question is set as a pull quote (left rule `#9E0142`, `#fbe9d8` ground):
   - The thesis in three or four sentences, built on the four sections above rather than on
     the event: what the business earns, what protects it, what is changing, and what the
     market is paying for it.
   - Valuation in the same breath: the name's own historical multiples, then where the
     price sits relative to those and to the current sector peer average. Spell out a ratio
     once with its abbreviation, "price-to-earnings (P/E)", and use the abbreviation after.
     Never present `intrinsic_value` as fair value.
   - **The counterargument, always, as its own paragraph**, opened by naming it as such
     ("The counterargument is that..."). Give it real data with the same specificity as the
     main case: the segment growing and by how much, the facility and its capacity and
     guided start quarter, the pipeline under development, the quarter that stabilized. An
     issue that only stacks one side is a disguised call.
   - Close the block by putting the unresolved question to the reader in one sentence
     ("This creates the central investment debate: is the market simply paying too much for
     X, or correctly anticipating Y?"). State the question. Do not answer it
     (`../../compliance.md`).
9. **What to Watch Next** — three or four bullets, one or two sentences each, none longer
   than about 35 words. Bold lead-in naming the thing to watch, then the threshold, quarter
   or counterparty, then why it matters. At least one should be structural (a capacity
   start-up, a licence renewal, a segment crossing a share threshold), not only the next
   print. Not a prose paragraph. Never a place for backward-looking trivia such as last
   month's institutional buyers and sellers, cut that entirely rather than parking it
   here.
10. **CTA card** — H2 `Follow TICKER Into Its Next Print`, one sentence pointing at the watchlist
    on sectors.app, and one button `Read the TICKER company report`. Then the Upcoming events
    block if one applies, **Sources**, the endpoint Appendix, and the disclaimer
    footer (`../../newsletter-format.md`).

**Citation density.** Cite in the body only where a specific claim needs a named outside
source, roughly once per paragraph at most, and never twice in one sentence. The macro
section is the exception in kind, not in density: every force named there is sourced, but
each still carries at most one tag. Trailing `(sectors.app)` after every figure is the
single loudest tell of an unedited draft: the Appendix and the standing "figures are from
sectors.app" disclaimer already carry API provenance, so figures pulled from the API need
no inline tag at all.

**What this type is not.** Not an event note, see the opening paragraph. No founder
history, no "fun fact", no potted biography of the controlling family unless a family's
control is itself part of the moat or governance argument, in which case it belongs in the
moat section with a figure attached, not as colour.
