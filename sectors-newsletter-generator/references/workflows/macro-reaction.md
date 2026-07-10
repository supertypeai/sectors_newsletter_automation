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

## 6. Self-review before delivery

- Does "who it touches" state the mechanism, or just assert an effect?
- Run `../compliance.md`'s one-line test on every sentence in the per-ticker sections:
  does it tell the reader what to do, or predict an outcome as our own claim? Cut or
  convert to a sourced fact.
- Is every macro claim cited, and every ticker figure either a real API field or a
  cited source?
