# Macro-reaction, workflow

Ties the last ~2 days of macro news to the sectors/tickers it plausibly affects, then
reports those tickers' fundamentals and valuation context. Read `../sourcing.md` and
`../compliance.md`'s reconciliation section before drafting — this is the issue type
where the no-advice line matters most.

## 1. Source the macro news

Web search per `../sourcing.md`'s "past ~2 days" priority list (BI rate moves, USD/IDR,
commodity prices, Indonesian regulation/fiscal news, major global macro). State the
event plainly and cite it — this is the issue's opening section, "The news."

## 2. Predict affected sectors/tickers, with a stated mechanism

The mechanism is a claim you make openly, not a hidden assumption. Examples:
- A BI rate cut → banks (net interest margin), rate-sensitive property/autos (financing
  cost).
- A coal price move → coal miners.
- A USD/IDR move → dollar-debt names (financing cost) and importers (input cost) vs.
  exporters (revenue benefit).

A rate or currency event usually chains across more than one asset class before it
reaches equities. Before narrowing to a sub-sector table, check whether the following
links exist in the ~2-day window and are worth reporting:
- **FX**: USD/IDR level and direction (Bank Indonesia is the primary source).
- **Sovereign rating**: any S&P/Moody's/Fitch action or statement in the window.
- **Competing yield instrument**: SRBI, SBN, or a similar tool the central bank or
  government is using alongside (or instead of) the rate move itself.

Only include a link that clears the comparison rule in step 6, don't chain to an asset
class just to look broad. If FX or rating didn't move or get mentioned in the window,
say nothing about it rather than manufacturing a paragraph.

Enumerate the actual candidate names, don't reason about a sector in the abstract:

```bash
node ../../scripts/sectors.mjs \
  "companies/?where=sub_sector = 'banks'&order_by=-market_cap" \
  --save-dir <scratch-dir>
```

Swap the `where` clause for whatever sub-sector/industry the mechanism points at (see
`../sectors-api/endpoints.md` §2 for the screener syntax
and more recipes; `subsectors/`, `industries/` are the cheap slug-discovery calls if you
need the exact kebab slug first). Also check the API's own `news/` endpoint
(`sector`/`sub_sector`/`keyword`) as a second source for which tickers are already being
discussed in connection with the event.

## 3. Fetch fundamentals + valuation context per affected ticker

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER>/?sections=overview,valuation,financials,future,dividend" \
  "daily/<TICKER>" \
  --save-dir <scratch-dir>
```

Repeat per ticker, or batch several tickers' paths into one `--save-dir` call.

Key fields:
- `valuation.historical_valuation[]{pe,pb,ps,*_peer_avg,year}` — company vs. its own
  history and vs. peer average. `forward_pe` for a forward look.
  **Never surface `intrinsic_value`** — it runs systematically high (see
  `../sectors-api/data-quality.md`) — and never use the phrase "fair value."
  A regional or cross-market multiple (e.g. IDX sector vs. ASEAN peers) is not in the
  Sectors API. If a citable web source states one and it clears step 6's comparison
  rule, include it with its source. Don't fabricate or estimate one to fill the gap,
  and don't add it just because a competing research note did.
- `financials.historical_financial_ratio[].profitability{roa,roe,net_profit_margin}` —
  real fundamentals, paired with their own trend.
- `future.analyst_rating_breakdown{strong_buy,...,n_analyst}` and
  `company_growth_forecasts[]{eps_growth,revenue_growth,estimate_year}` — reportable as
  sourced consensus, never endorsed (`compliance.md`).

## 4. Validate

Band-check every multiple against `../sectors-api/data-quality.md`'s plausibility bands before it
ships: drop negative P/E, cross-check `pe_ttm` against `forward_pe` and the peer
average (it's a frequent liar), don't chart margins for loss-makers, null-guard every
small-cap field rather than rendering a blank.

## 5. Write the entry-point section as objective valuation context, not a verdict

This is `../compliance.md`'s reconciliation, applied: report where the stock trades
relative to its own history and to peers, report the real fundamentals and their trend,
report disclosed consensus if any — then stop. No "cheap," "a good entry," "undervalued."
Close each per-ticker section with a neutral "what to watch" (an upcoming print, an
ex-dividend date, the next macro data point) instead of a call to action.

## 6. Every number needs a comparison anchor

A number by itself, a rate, a rupiah figure, a percent move, isn't information until
it's placed against something: its own history, a peer, a threshold, a prior period.
"BI Rate at 5.75%" says little on its own; "+100bps since the start of 2026" says
something. Before a figure goes in the draft, ask what it's being compared to:
- vs. the same metric's own recent history (last quarter, last year, since a named
  date)
- vs. a peer, a sector average, or a benchmark index
- vs. a stated threshold or target (a policy band, a rating floor, a budget limit)

If a number clears none of these, cut it rather than including it for texture. Don't
pad a section with figures just to look dense, quantify a claim only when the
quantity carries a message the reader would act on or understand differently without
it.

## 7. Self-review before delivery

- Does "who it touches" state the mechanism, or just assert an effect?
- Run `../compliance.md`'s one-line test on every sentence in the per-ticker sections:
  does it tell the reader what to do, or predict an outcome as our own claim? Cut or
  convert to a sourced fact.
- Is every macro claim cited, and every ticker figure either a real API field or a
  cited source?
- Does every number in the draft carry a comparison per step 6, or is it a bare
  figure that should be cut?
- Does "what to watch" name a specific, dated institutional event (a scheduled board
  meeting, a rating review, an index reclassification date) rather than a generic
  "next print"? A vague forward-watch item is a sign the research stopped early, not
  a stylistic choice.
- Does every `TICKER` mention (table, chart label, AND inline prose) read bold,
  linked, and ticker-blue (`#9E0142`)? Gains/losses green/red (`#568475`/`#D53E50`)?
  (`../newsletter-format.md`'s Color convention, applies to every issue.)
- Is the Appendix (endpoint/field trace) present, after Sources and before the
  disclaimer? **Endpoints and field names only**, one bullet per endpoint, with no section
  label, chart name, table name, derivation or usage note attached to any bullet
  (`../newsletter-format.md`'s Appendix section)?
