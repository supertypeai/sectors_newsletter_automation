# Did you catch it, workflow

FOMO family, one type-slug (`did-you-catch-it`). One ticker that hit a real, dated,
sourced low, already cleared a fundamentals guard **at that low**, then rallied.
**Product goal, not just editorial**: this piece exists to prove a `sectors.app`
workflow alert (criteria-triggered) would have caught the moment, and to push the
reader toward setting one up. The story is told **signal first, payoff second**: state
the trigger date and the exact conditions true on it, before showing what happened
after. Reported as a single broadcast piece, same content for every reader, no
per-recipient framing (this skill has no account data, can't tell who already holds the
ticker, see SKILL.md's **Personalization check**). Read `../newsletter-format/skeletons/did-you-catch-it.md`, `../compliance.md` (the imperative ban matters most here, see
**Framing guardrail** below), and `../sourcing.md` before drafting.

**Scope note (mirrors SKILL.md's not-yet-built list):** this workflow covers only "did
you catch it." Sector Rotation Miss is a separate FOMO topic with its own trigger
(sector-relative move), not built yet, don't stretch this doc to cover it. Missed
Dividend was dropped from the FOMO family on 2026-08-10 (see SKILL.md's not-yet-built
list for why), don't build it off this doc or any other.

## 1. The screener, adapted to what the API can actually verify

The content plan's canonical screener (write once, reuse everywhere):

```
price_change_7d_ago  <= -5%
AND price_change_now >= +10%
AND pe_ratio         <  sector_median_pe
AND roe              >  sector_median_roe
AND debt_to_equity   <= debt_to_equity_90d_ago
AND market_cap       >  1e12  -- IDR, filter illiquid
```

Translate each leg to a real field, don't approximate the spec into something looser.
The trough-detection leg has a materially better source than earlier drafts of this doc
assumed, verified live 2026-07-28, use it:

- **The trigger date and price** (`price_change_7d_ago <= -5%`, i.e. "a real recent
  low"): **`company/report/<TICKER>/?sections=overview`'s `overview.all_time_price`**
  carries `{ytd_low, 52_w_low, 90_d_low, ytd_high, 52_w_high, 90_d_high, all_time_low,
  all_time_high}`, each a `{date: price}` single-pair object, e.g. `"90_d_low":
  {"2026-07-24": 446}` (live example, MTEL.JK). This is an **authoritative, dated,
  sourced trough**, not something scanned or approximated from a daily-close series.
  Take whichever of `90_d_low` / `ytd_low` / `52_w_low` carries the **most recent
  date** (closest to now is the most relevant trigger for a newsletter's cadence);
  that date is T0, that price is the trigger price. `"7 days ago"` in the content plan
  is illustrative, not a fixed lookback, this field is the real mechanism.
  `overview.tags[]` (big-cap only, null-guard) is a live bonus check: if it still
  carries `52-w-low` / `90-d-low` / `ytd-low`, that's a second, independent
  confirmation the low is current and real, cite it if present, skip it if the field
  is null for this ticker (small-cap), don't treat its absence as disqualifying.
- **The payoff** (`price_change_now >= +10%`): `overview.last_close_price` vs the
  trigger price from T0 above, plain percentage change, ≥10% is the bar.
- **`roe > sector_median_roe`**: `subsector/report/{slug}/` gives `filtered_median_pe`
  but no median ROE. Compute it the same way `sector-spotlight` computes a ranked
  list: `companies/?where=sub_sector = '<slug>' and roe[<year>] > 0&order_by=-roe[<year>]&include_query_values=true`,
  take the median of the returned `roe` query_values client-side. The `roe[<year>] > 0`
  guard matters here too, same reasoning as the `pe_ttm > 0` guard elsewhere: a
  negative-ROE name distorts a median as badly as it distorts a top-of-list sort.
- **`debt_to_equity <= debt_to_equity_90d_ago`**: no daily or 90-day-lagged leverage
  field exists for IDX names (`debt_to_equity` as a flat current value is documented
  **SGX-only**; IDX's own leverage lives in `historical_financial_ratio[].leverage`,
  one point per **year**, not per 90 days). Use the latest two annual points
  (`historical_financial_ratio[current_year].leverage` vs `[prior_year].leverage`) as
  a "not deteriorating year over year" proxy, and say so plainly in the Appendix,
  annual granularity, not the 90-day window the content plan names. Never present the
  annual comparison as if it were the literal 90-day figure.
- **`pe_ratio < sector_median_pe`** and **`market_cap > 1e12`** map directly:
  `valuation.historical_valuation[]`'s latest year against `subsector/report/{slug}/`'s
  `statistics.filtered_median_pe`; `overview.market_cap > 1e12` (IDR 1 trillion) as a
  plain guard, drop any candidate below it, illiquid names don't belong in a piece
  meant to send readers back to `sectors.app`. **Fundamentals are read at report date**
  (current), not literally priced on T0, a reasonable proxy since P/E, ROE, and
  leverage move far slower than price, especially when T0 is recent (favor the most
  recent of the three low dates in the trigger leg above for exactly this reason); say
  so plainly in the Appendix, same discipline as the leverage substitution.

**A discovery shortcut exists but doesn't fit this retrospective piece**: `companies/`
supports `where=tags in ['52-w-low']` (verified live, returns real matches with a full
`query_values.tags[]` list per company, e.g. `insider-1-month-buy`,
`last-volume-above-10d-volume-average`, `dividend-yield-ttm-above-5-percent`,
`public-float-under-25`). It only surfaces names **currently** at a low, i.e. the rally
hasn't happened yet for that name, so it can't itself prove the "signal then rally"
story this issue tells. Keep it in mind for a future prospective/live-alert piece; for
`did-you-catch-it`, discovery has to start from names already up (below), then this
section's `all_time_price` field supplies the dated trigger retroactively.

## 2. Fetch order

Discover already-rallied candidates:

```bash
node ../../scripts/sectors.mjs \
  "companies/top-changes/?classifications=top_gainers&periods=30d&n_stock=10" \
  --save-dir <scratch-dir>
```

For each candidate, pull the trigger date/price and the fundamentals guard in one
batch:

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER>/?sections=overview,valuation,financials" \
  --save-dir <scratch-dir>
```

Read `overview.all_time_price` for T0 (§1), confirm the ≥5%/≥10% legs from
`overview.last_close_price` vs the trigger price. Once a candidate survives, pull the
daily series for the **chart only** (rendering, not detection, the trough date is
already known from `all_time_price`):

```bash
node ../../scripts/sectors.mjs \
  "daily/<TICKER>/?start=<T0-minus-buffer>&end=<today>" \
  --save-dir <scratch-dir>
```

Then the sub-sector benchmark:

```bash
node ../../scripts/sectors.mjs \
  "subsector/report/<slug>/" \
  "companies/?where=sub_sector = '<slug>' and roe[<year>] > 0&order_by=-roe[<year>]&include_query_values=true&limit=30" \
  --save-dir <scratch-dir>
```

Pick **one** ticker per issue, this is a single-name spotlight, not a screener dump. If
several candidates clear the screen, prefer the one with the most recent T0 (freshest
signal, tightest fundamentals-proxy window) and the largest market cap, easiest for a
reader to verify themselves.

## 3. One piece, no assumed reader state

This skill has no account data (see SKILL.md's **Personalization check**), it cannot
tell which readers already hold the ticker and which don't. "Did you catch it" is
written to work either way: it states the trigger and the move as fact and lets the
question in the headline do the work, a reader who held it reads confirmation, a reader
who didn't reads the prompt to set the same alert up for next time. Don't draft two
versions or split by assumed audience, one broadcast piece, same copy for every
recipient.

## 4. Framing guardrail (read `../compliance.md` first)

FOMO is loss/win-framed by design (content plan's own tone directive), which sits right
next to the imperative ban in `compliance.md` rule 3 and the reconciliation section's
"first- and second-person imperatives are banned." The trigger and the move, reported
factually, carry the emotional weight, the copy doesn't need to push:

- Report the trigger and the move as **fact, past tense, dated**: "hit a 90-day low of
  IDR 446 on July 24, has since closed at IDR 495, up 11%" reads the loss/win angle
  without a single imperative.
- The fundamentals guard (P/E vs sector median, ROE vs sector median, leverage trend) is
  **valuation context, same as every other type**, never "still cheap, don't miss it
  twice." State the number and the benchmark, stop there.
- **No countdown, no scarcity language, no "before it's too late."** The move already
  happened, there's no real deadline being reported, inventing urgency where none
  exists is the exact hype `../compliance.md` and `../writing/brand-voice.md` rule out.
- CTA is **behavioral, not transactional**: "add to watchlist" or "set up a workflow
  alert," never "buy now," never a price target. Since the whole point of this type is
  driving the workflow-alert feature, name the **actual conditions** the piece just
  proved out (the low-price trigger, the fundamentals guard) as what the alert would
  watch for, concrete beats generic. This is also the one place this piece could slide
  into advice fastest, hold the line on no-buy-signal regardless.

## 5. Draft

**Signal first, payoff second, matching the actual sequence of events:**

1. **The signal** — H1 poses the question the subject line already asked ("did you
   catch [ticker]'s move?" phrased as this issue's actual headline, not that literal
   sentence), one-line standfirst naming T0 and the trigger price plainly ("hit a
   90-day low of IDR 446 on July 24"). Cited to `sectors.app`.
2. **What was already true at the low** — the fundamentals guard as a small table
   (P/E vs sector median, ROE vs sector median, leverage trend), stated as conditions
   that already held **on T0**, not discovered after the fact. This is the "criteria"
   half of the alert story, valuation context only, per §4 above.
3. **What happened next** — the payoff: last close vs the trigger price, the rally
   percentage, the hero chart (daily close from T0 to today, `line` or `sparkline`
   from `charts.mjs`, the trough visually evident, the up-move following it).
4. **What to watch** — objective, non-prescriptive close.
5. **CTA** — name the actual conditions from step 2 as a settable alert ("a workflow
   watching for [sector] names at a fresh low with P/E under the sector median would
   have flagged this on July 24"), then the ask: set up a workflow alert, or add the
   ticker to a watchlist. Then Sources, Appendix (flag the two documented spec
   adaptations explicitly, see §6), disclaimer footer.

## 6. Self-review before delivery

- Does every sentence pass `compliance.md`'s one-line test (tells the reader what to do
  with the stock, or predicts an outcome, → cut or convert to a sourced fact)?
- Is T0 sourced from `overview.all_time_price` (a real dated field), not scanned or
  guessed from a `top-changes` bucket label?
- Does the draft lead with the signal (T0 + fundamentals guard) before the payoff
  (the rally), matching how the alert would actually have fired, not the reverse?
- Is the ROE-vs-sector-median comparison computed from a real client-side median (guarded
  `roe[<year>] > 0`), not eyeballed against one peer?
- Is the leverage comparison labeled **annual**, explicitly, in the Appendix, not
  presented as the literal 90-day figure the content plan names? Is the fundamentals
  guard labeled as report-date, not literally priced on T0?
- Does the piece avoid assuming or asserting the reader's own holding either way (§3)?
- No countdown/scarcity language (§4)?
- Does the CTA name the actual conditions proved out in the piece as a settable alert,
  not a generic "set up a workflow" with no specifics?
- Every `TICKER` bold, linked, ticker-blue; gains/losses green/red
  (`../newsletter-format.md`'s Color convention)?
- Appendix present, after Sources, before the disclaimer, and does it note the two
  documented spec adaptations (fundamentals guard at report date not literally at T0,
  leverage compared annually not at 90 days)? **Endpoints and field names only**, one bullet per endpoint, with no section
  label, chart name, table name, derivation or usage note attached to any bullet
  (`../newsletter-format.md`'s Appendix section)?
