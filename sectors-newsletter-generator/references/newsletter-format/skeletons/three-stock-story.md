# Section skeleton: three-stock-story

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Markup for every block named below lives in `company-issue-components.md`, copy it from there. The reference issue is `newsletter_2026-10-15_three-stock-story` (BYAN, MAPI, SRTG).

### Three-stock story

Three companies that share one reason to be read together this week. The reason is the issue: a pattern a reader can grasp before knowing the tickers (three controlling holders filing purchases, three dividend cuts, three tycoon-linked names moving). A history lesson per company does not carry the type. Each pick needs a dated, checkable event that explains why it is here now, and the people behind it appear only where they explain the event.

**Title.** A declarative Title Case headline naming the pattern, no tickers, no colon subtitle. `Three Controlling Holders Filed Purchases This Week`.

**Order of blocks, top to bottom:**

1. **Header and headline.** Title row, date line, headline at 21px. No standfirst paragraph, the next block does that job.
2. **The Three (at a glance box).** Shaded `#fbe9d8` box titled for the pattern (`The Three Filings`), one inner card per pick: linked ticker, company name in grey, then two sentences stating the event with its date, size and price. This replaces the old two-paragraph framing.
3. **Why This Pattern Matters.** One H2 stating the general lesson (`Why a Controlling Holder's Buying Matters`), two labelled paragraphs (`What it can signal`, `What it can change`), then a pull quote stating the limit of the signal. Generic to the pattern, no per-stock detail, no advice. Link tickers only where an example is named.
4. **Three per-stock blocks**, each separated by the divider. Fixed shape:
   - H2 `TICKER: Narrative Label` (`BYAN: Founder Sells 30%, Then Buys Again`). Ticker link first, then a colon, then the label stating that stock's finding.
   - Company card: `PT ... Tbk` plus linked ticker, three stat tiles (`Last close`, `Vs 52-week high` coloured red or green, `Market cap`).
   - One intro sentence or short paragraph on who the company and the key person are.
   - **Dated timeline**, five to eight rows, oldest first, ending on the data-as-of close with the move against the relevant high or low in green or red. Dates carry the story: founding or control change, the deal, the filing, the company's response, the latest close. Each row is one to three sentences. Only rows that move the story, a full executive roster is API output, not writing.
   - Optional per-stock chart when one shows something the text cannot (ownership before and after a trade, `ownershipBars`), with a one-sentence italic caption stating the finding.
   - **Finances paragraph**, three or four sentences: the trend, the one ratio that matters, debt, and any attributed forward view (cited consensus, management guidance) folded in. Holding companies and banks swap revenue and margin for the metrics that apply to them, and say so.
   - **Table**, three or four years, columns chosen for that company (`Year, Revenue, Change, Net profit, Net margin`; for a holding company `Year, Net profit, Return on equity`). Gains and losses green and red.
   - **Key takeaway callout**, two or three sentences ending the block on the point a reader should carry, sized against the event (`The IDR 5.60B purchase is 0.02% of the IDR 26.05T sale and changes nothing`).
5. **Share Prices Since <anchor date>.** One sentence ranking the three moves, then `rebasedLines` chart (all three rebased to 100) with an italic caption giving window and trading days. This is the synthesis and replaces the old closing section and comparison table.
6. **CTA card.** `Follow TICKER, TICKER and TICKER on Your Watchlist`, one sentence, button to the watchlist page.
7. **Upcoming Events** block when one applies (`../newsletter-format.md`).
8. **Sources, Appendix, disclaimer footer.**

**Length.** Roughly 1,400 to 1,900 words including timelines. Density comes from the timeline structure, so paragraphs stay short: no paragraph past four sentences, at most three figures in any sentence outside the timeline and tables.

**Voice.** Plain reported statements. The newsletter never says a filing is bullish. State what was filed, what it was worth against the stake or the market value, and what the data says about the company. Forward views appear only as attributed consensus or management guidance, with no trailing disclaimer. Any figure that sounds like a call (`0.11% of its market value`) is a size comparison, not a verdict.

**Charts and images.** PNG in the HTML, SVG kept beside it as source (`scripts/svg2png.mjs`). Alt text states the figures. Markdown uses the same PNG.

**What this type is not.** Not three company biographies. A fun fact or founder detail survives only if it is part of the event or the control story, and carries a date and a figure. Three unrelated names with no pattern do not make an issue, pick a different type or a different trio.
