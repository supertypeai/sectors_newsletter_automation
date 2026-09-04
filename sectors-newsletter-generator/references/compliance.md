# Compliance, read before drafting any section

This newsletter goes to subscribers. It carries the same non-negotiables every Sectors skill does
(`sectors-api/data-quality.md`, `./writing/core.md` section 1), restated here
for prose:

## The hard rules

1. **Never fabricate, estimate, or round-for-effect a number.** Every figure traces to a
   real Sectors API field fetched this run, or a cited source (see `sourcing.md`). No
   "approximately", no derived figure presented as if returned.
2. **If a field is `null`, missing, or implausible, omit the claim.** Don't guess,
   interpolate, or substitute a peer's value. A missing line beats a wrong one.
3. **Descriptive only, never investment advice.** No buy/sell/hold framing, no price
   targets stated as our call, no "undervalued / cheap / a good entry / should own", no
   "fair value". State what the data shows; the reader decides. See the reconciliation
   below for how this applies to the macro-reaction and three-stock-story issue types.
4. **Every figure is band-checked before it ships.** Full landmine table and plausibility
   bands live in `sectors-api/data-quality.md` — don't
   fork them, open that file. Out of band → omit.
5. **Show the date.** Prices, flows, ratios, and news are as-of a date. Every issue
   carries a `data_as_of` field (see `newsletter-format.md`) and every cited news item
   carries its own date.
6. **`sectors.app` is the citation, never "Sectors API" or bare "Sectors."** Internal
   engineering name stays internal; the reader-facing citation is the product they could
   visit. This extends to **raw field paths in body copy**: never write
   `future.company_growth_forecasts`, `historical_valuation[].pe_peer_avg`, or any other
   dotted/bracketed field name mid-paragraph, even backtick-wrapped, even as a citation.
   A subscriber reading prose isn't reading the API schema and a field name explains
   nothing to them there. Cite `sectors.app` inline exactly the way every other
   API-derived figure in the issue does, nothing more specific. (Caught on the ADRO deep
   dive: a draft cited `future.company_growth_forecasts` inline, mid-paragraph, reads as
   internal engineering detail to a subscriber, not a citation.)
   **Field paths belong in the Appendix instead** (`newsletter-format.md`'s **Appendix:
   data sources** section), where they serve a different reader in a different mode:
   someone who's already finished the piece and wants to verify or reproduce a specific
   number. There, map each metric actually used to its endpoint AND field, e.g.
   `company/report/ADRO.JK/` (`future.company_growth_forecasts`: consensus EPS/revenue
   growth), that's traceability serving credibility, not clutter, because it's opt-in,
   clearly demarcated, and never the thing a subscriber has to read to follow the story.

## Reconciling "a good time to purchase" and "a great future forecast" with the no-advice rule

The newsletter's own brief asks, for the macro-reaction issue, whether affected tickers
are "a good time to purchase," and for the three-stock story, for "a great future
forecast." Read literally, both are investment advice — exactly what rule 3 above (and
the identical hard rule in `./writing/core.md`) forbids. This is resolved by **reframing, not
dropping**: the reader's real question — *is this expensive or cheap, and why* — is
answerable factually without ever telling them what to do.

- **Valuation context, not a verdict.** Report where a stock trades *relative to its own
  history and to peers*: "trades at 12x earnings, below its own 5-year average of 17x and
  the peer average of 15x (sectors.app)." State the fact; let the reader draw the
  conclusion. Never label a stock "cheap," "undervalued," "a bargain," or "a good entry."
  Never surface `intrinsic_value` or the phrase "fair value" (it runs systematically high
  — see `data-quality.md`).
- **Fundamentals as evidence, not endorsement.** "ROE of 21%, up from 18% two years ago"
  is reporting. "ROE of 21%, so you should own it" is advice. Stop at the number and its
  benchmark.
- **Consensus is reportable, never endorsed.** "34 analysts, consensus rating Buy, from
  `future.analyst_rating_breakdown` (sectors.app)" is a sourced fact and may appear.
  "Consensus is Buy and we agree" / "so this is a buy" is banned.
- **Forward-looking statements must be attributed.** A "great future forecast" becomes:
  "management has guided FY revenue up 8%," "consensus estimates EPS growth of X% next
  year (`future.company_growth_forecasts`)," "the company's disclosed strategy is Y."
  Never the newsletter's own prediction, never "this stock will double," never hype.
- **First- and second-person imperatives are banned.** No "you should buy," "we'd load
  up," "this is your entry." Close the macro-reaction issue's per-ticker section with a
  neutral "what to watch" (an upcoming print, an ex-dividend date, a macro catalyst) in
  place of any call to action.
- **The disclaimer footer** (defined in `newsletter-format.md`) restates non-advice on
  every issue, no exceptions.

**One-line test, applied to every sentence before an issue ships:** if a sentence tells
the reader what to do with a stock, or states a price/outcome prediction as the
newsletter's own claim, cut it or convert it to a sourced, attributed fact.

This is an editorial decision made when this skill was built, not something the API or
the sibling skill enforces automatically here — hold every draft to it deliberately.
