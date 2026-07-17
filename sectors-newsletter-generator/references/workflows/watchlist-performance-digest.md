# Watchlist/sector performance digest, workflow

A fixed template, same structure for every recipient: a ranked performance + peer
comparison table for up to 5 of that user's own tracked tickers/sectors. Only the
values (and which items appear) change per recipient, via `{{merge_tag}}`. Read
`../newsletter-format.md`'s watchlist-performance-digest skeleton and its **Merge-tag
convention** section before drafting, and `../compliance.md` before writing the
context section, this is personalized performance content and the no-advice
discipline applies in full.

This is the one issue type in this skill that needs data this skill cannot fetch
itself (which tickers/sectors a specific user tracks). See SKILL.md's
**Personalization check** before starting here.

## 1. Get the audience via the dbquery skill

Invoke the `sectors-newsletter-dbquery` skill (Skill tool) to run its approved
`watchlist-tracked-interest` query. That query returns, per eligible user: `user_id`,
`email`, `first_name`, `tickers` (array), `sectors` (array). **Never write SQL here,
never ask for Supabase access directly**, this skill has no DB credential and that
discipline is load-bearing, not a formality, see dbquery's
`references/supabase-access.md`.

Known data-quality caveat in the real rows (per that query's own header comment,
pending upstream DB cleanup): tickers are inconsistently suffixed (`.JK` for IDX,
`.SI` or a bare code for SGX, the same underlying stock sometimes appears both ways
for one user), and sectors can have case duplicates (`"Banks"` vs `"banks"`). Handle
both at draft time, don't assume the row is clean:

- **Classify by suffix, not by list membership**: a ticker ending `.JK` is IDX, `.SI`
  or a bare alphanumeric SGX-style code (no `.JK`) is SGX. When both a suffixed and
  bare form of the same underlying code appear for one user, treat them as one item,
  don't double-count it in the ranked table.
- **Normalize sector casing for display and dedup** (`lower(trim(...))` to compare,
  title-case to display), so `"Banks"`/`"banks"` collapse to one row, not two.

Pick one sample user (real row, real tracked items) to build and prove the template
against. This is a template proof, not a batch render, same discipline as any dbquery
worked example: scrub the real email/name before this file is shared outside the
session, per dbquery's `references/supabase-access.md`.

## 2. Fetch 7-day performance per tracked item, exchange-aware

For each of the sample user's tracked tickers, fetch by exchange:

**IDX** (`.JK` suffix):
```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER>/?sections=overview,peers" \
  "daily/<TICKER>/?start=<7d-ago>&end=<data_as_of>" \
  --save-dir <scratch-dir>
```
- `overview.last_close_price` / `daily_close_change` plus the `daily/` series gives the
  7-day move.
- `peers.peers[0].peers_data.companies[]{symbol, pe_ttm, pb_mrq, ...}` is the
  ready-made peer comparison table, no separate screener call needed.

**SGX** (`.SI` suffix or bare code, strip to the bare code first, e.g. `D05.SI` →
`D05`):
```bash
node ../../scripts/sectors.mjs \
  "sgx/company/report/<CODE>/?sections=overview" \
  "sgx/daily/<CODE>/?start=<7d-ago>&end=<data_as_of>" \
  --save-dir <scratch-dir>
```
- **No peer comparison for SGX**: `sections=peers` 400s on `sgx/company/report`
  (`../sectors-api/endpoints.md` §4). Performance only, write **"coming soon"** in
  the peer-comparison cell for SGX rows, never leave it blank and never fake a figure.
- Mind the trailing slash (`sgx/company/report/D05/`, not `.../D05`), a missing slash
  reads like an auth failure but is a routing miss.
- **SGX ticker link** (confirmed 2026-07-16): `https://sectors.app/sgx/<lowercase
  bare code>`, e.g. `https://sectors.app/sgx/d05`. Same lowercase, no-suffix
  convention as the IDX link, just under `/sgx/` instead of `/idx/`.

**Tracked sectors** (from the `sectors` array, no specific ticker):
```bash
node ../../scripts/sectors.mjs \
  "subsector/report/<slug>" \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=7d&sub_sector=<slug>&n_stock=1" \
  --save-dir <scratch-dir>
```
- `subsector/report`'s `market_cap.mcap_summary.mcap_change.1w` is the sector's own
  7-day aggregate move, the row's headline figure.
- `top-changes` filtered to that sector gives the top mover as the row's one-line
  callout, same `sector-spotlight.md` mechanics, reused here.
- A tracked sector name has to resolve to a real `subsectors/` slug first (cacheable
  33-pair list); if it doesn't match one cleanly after the casing normalization from
  step 1, skip that entry and say so, don't guess a slug.
- **Sector link** (confirmed 2026-07-16): `https://sectors.app/indonesia/<slug>`,
  the same slug used in the `subsector/report/{slug}/` call, e.g.
  `https://sectors.app/indonesia/banks`.

## 3. Pull real factors/news for the takeaway paragraph

Before drafting, look for a genuine, dated, factual driver behind each tracked item's
move, not just for the headline:

```bash
node ../../scripts/sectors.mjs \
  "news/?symbols=<TICKER>&limit=5" \
  "news/?sub_sector=<slug>&limit=5" \
  "company/corporate-actions/<TICKER>/" \
  --save-dir <scratch-dir>
```

- `news/` and `company/corporate-actions/` are **IDX-only**. For an SGX name, these
  return nothing relevant, a cited web search is the fallback (`WebSearch`, or the
  `../sourcing.md` gated-fetch pattern for `sectors.app`/`docs.sectors.app` if the
  claim is about the platform itself, not the company). Any web-sourced fact needs a
  dated, named-outlet citation and a **Sources** list entry, same discipline as every
  other issue type (`../sourcing.md`).
- **Verify a web search result against a real fetched number before using it.** A
  search summary can misstate scale (a wrong currency, a wrong order of magnitude);
  cross-check any web-sourced figure (a market-cap milestone, a price level) against
  the actual `overview.market_cap` / `overview.last_close_price` this run already
  fetched, and drop the claim if it doesn't reconcile, don't just trust the search
  snippet.
- **Not every tracked item needs a factor.** Only write one for a row where a real
  source actually turned something up. A row with no real factor just keeps its table
  numbers, no invented "market watchers are optimistic" filler.

## 4. Validate, then pick the headline and cap the table at 5

- Band-check every fetched figure against `../sectors-api/data-quality.md`, same as
  every other issue type in this skill. A null or implausible value gets omitted for
  that row, not faked, and flagged.
- **Headline mover = biggest absolute 7-day move** (ticker: `daily_close_change`-derived
  7-day %; sector: `mcap_change.1w`) across all of the recipient's deduped tracked
  items. This is a significance pick, not tied to table position, there's no
  per-item timestamp in the source data to rank by recency instead.
- **Table row order = exchange group, then signed 7-day move descending within the
  group.** IDX rows (including sector rows, they're Indonesia-only) come before SGX
  rows, alphabetical-by-country order; within each group, most positive move first.
  This is a display rule, separate from which row is the headline.
- Cap the table at 5 rows total, all of the recipient's deduped tracked items if 5 or
  fewer, otherwise the top 5 by absolute move.
- If a tracked item's data came back null/implausible for every field needed to rank
  it, drop it from the table (not from the recipient's audience) and note the drop.

## 5. Draft

Follow `../newsletter-format.md`'s watchlist-performance-digest skeleton: greeting +
headline mover (benchmarked, e.g. vs. the IDX composite's own 7-day move, or vs. the
item's own history for an SGX name), the ranked table (≤5 rows, Exchange column
always shown, IDX rows before SGX, sorted by signed move within each group,
"coming soon" in any not-yet-available peer-comparison cell, sector rows show
aggregate move + top-mover callout), the takeaway paragraph (real dated factors/news
from step 3, only where a real source exists, non-advice throughout), one CTA back to
`sectors.app`. `{{merge_tag}}` every per-recipient static field (`{{first_name}}`),
and clearly mark which table/takeaway values are computed at draft/render time from
the live fetch rather than stored as tags (`../newsletter-format.md`'s **Merge-tag
convention** section covers the exact split). Prove the whole template by rendering
it once against the sample user from step 1. Close with the standard **Appendix:
Sectors API endpoints (fields used)** block (`../newsletter-format.md`'s Appendix
section, required for every issue type, this one included), one bullet per endpoint
actually called this run (the approved dbquery query itself belongs here too, cited
as the audience source, not just the market-data calls).

## 6. Self-review before delivery

- Is the headline mover benchmarked (vs. the IDX composite or its own history), not a
  bare percentage?
- Is the table capped at 5, exchange-grouped (IDX before SGX) then sorted by signed
  move within each group, ticker/sector rows correctly deduped (no `.JK`/`.SI`
  double-count, no `"Banks"`/`"banks"` double-count)?
- Does every row show its Exchange, and does every not-yet-available peer-comparison
  cell say "coming soon" rather than being blank or faked?
- Do IDX ticker links point to `sectors.app/idx/<lower>`, SGX ticker links to
  `sectors.app/sgx/<lower bare code>`, and sector links to
  `sectors.app/indonesia/<slug>`?
- Does the takeaway paragraph cite a real, dated source for every factor/news item it
  states, Sectors-API facts with the standard `(sectors.app)` inline citation and any
  web-sourced fact with a named-outlet citation plus a **Sources** entry? Did any
  web-sourced figure get cross-checked against a real fetched number before use?
- Is the takeaway free of invented factors for rows with no real source, and free of
  investment advice ("so add more," "time to buy") — run `../compliance.md`'s
  one-line test?
- Did any fetched figure fail a plausibility band and get left in anyway? Re-scan
  against `../sectors-api/data-quality.md`.
- Every `{{merge_tag}}` maps to a real field the dbquery query returns, and every
  market-blended table/takeaway value is documented as computed-at-render, not a
  static tag?
- Worked example rendered against one real sample user, PII scrubbed per dbquery's
  `references/supabase-access.md`, before this file is shared outside the session?
- Is the Appendix (endpoint/field trace, including the dbquery audience query) present,
  after Sources and before the disclaimer?
- Disclaimer footer present, unmodified (`../newsletter-format.md`)?
