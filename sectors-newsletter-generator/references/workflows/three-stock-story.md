# Three-stock story, workflow

Three companies, told as stories: history, fun facts, the people steering the business,
and an attributed forward outlook. Read `../sourcing.md` and `../compliance.md`'s
"great future forecast" rule before drafting.

## 1. Pick three stocks

Ideally with a connective thread — a sub-sector, a conglomerate group, a shared
founder/tycoon, a theme — but three unrelated names each with a real, current reason to
feature is fine too; say so honestly in the framing rather than forcing a thread that
isn't there.

Cheap, concrete discovery signals (same recipes the carousel skill uses, see
`../sectors-api/endpoints.md` §2 for full syntax):

```bash
node ../../scripts/sectors.mjs \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=30d" \
  "filings/?limit=20" \
  --save-dir <scratch-dir>
```

- `companies/` screener recipes: founder-owned (`major_shareholders_name like '%name%'`
  or `free_float < 0.25`), founder/tycoon cross-company reach
  (`key_executives_name like '%name%'`), dividend aristocrats, fastest growers — any of
  these surfaces a concrete, verifiable candidate rather than a guess.
- `filings/` — an insider-cluster pattern (several same-direction filings in a short
  window) is a real, narratable "why this stock, why now."
- `conglomerates_group[]` / `whale_investors[]` (inside `company/report`'s `ownership`
  section) — join keys toward a "who really owns this" thread across picks.

Each pick still needs a real current reason to feature, not just an interesting history
— recency discipline from `../sourcing.md` applies here too.

## 2. Research the story (web, cited)

Founding story, notable milestones, a genuine fun fact, and — separately — the people
likely to steer the business going forward. Cite everything per `../sourcing.md`.

## 3. Fetch the people and the numbers

```bash
node ../../scripts/sectors.mjs \
  "company/report/<TICKER>/?sections=overview,management,ownership,financials,future" \
  --save-dir <scratch-dir>
```

Repeat per ticker, or batch all three into one `--save-dir` call.

Key fields:
- `management.key_executives[]{name,position}` and
  `executives_shareholdings[]{name,position,share_amount,share_percentage}` — the people
  section.
- `ownership.major_shareholders[]{name,share_percentage,share_amount}`,
  `whale_investors[]`, `conglomerates_group[]` — who actually holds and steers this.
  **Type gotcha**: `major_shareholders[].share_percentage` is a **string**;
  `executives_shareholdings[].share_percentage` is a **float**, same field name, two
  types across sections of the same report — `parseFloat` before any comparison or math.
- `financials.historical_financials[]` and `historical_financial_ratio[]` — the real
  numbers section.
- `future.company_growth_forecasts[]` and `analyst_rating_breakdown` — the only
  legitimate source for the "outlook" section, and only as attributed, sourced consensus
  (see step 4).

Null-guard every field — small caps return `null` for `analyst_rating_breakdown`,
`forward_pe`, `company_value_forecasts`, and more; drop the line rather than render a
blank.

## 4. Write the outlook as attributed statements only

This is `../compliance.md`'s "great future forecast" rule, applied. Allowed: "management
has guided FY revenue up 8%," "consensus of N analysts estimates EPS growth of X%
(`future.company_growth_forecasts`, sectors.app)," "the company's disclosed strategy is
Y." Banned: "this stock will double," an unsourced "bright future ahead," any target
price framed as the newsletter's own call.

Attribution is a sentence construction, not a disclaimer appended to one. Write "KISI
Sekuritas rates it Buy at a IDR 2,400 target" and stop. Never follow an attributed line
with "reported here as sourced consensus, not this newsletter's own view" — the
attribution already did that work, and the trailing note reads as legal padding. Where
`analyst_rating_breakdown` and `company_growth_forecasts` both come back `null`, say
nothing about consensus at all. Do not write a paragraph reporting the absence ("both
fields return null, so no consensus is reported"); a missing field is not news.

## 5. Section-fill order and prose density

Per stock, two sub-parts only: *The Story & People*, then *The Finances* with the
attributed forward view folded into it. Section headings carry a narrative label, not a
bare company name — see the skeleton at
`../newsletter-format/skeletons/three-stock-story.md` for the full shape, including the
thematic title, the two-paragraph framing, and the titled closing synthesis.

This type fails most often by being over-stuffed rather than under-researched. The
research pass collects far more than the draft should carry, so cut deliberately:

- **One citation per claim that needs one, not per clause.** Founding dates, control
  changes, deal values, quotes and the current news hook get a source. Figures that come
  from the Sectors API do not each need a trailing `(sectors.app)` — the disclaimer and
  the Appendix already establish where the numbers come from.
- **Sources list carries only what the draft actually cites.** A twenty-line list where
  the body cites six of them is research spill, not sourcing.
- **Drop the scaffolding vocabulary.** No "The current story is," "The current hook is,"
  "The real news is," "The closest thing to guidance is." Say the thing.
- **Exact-precision figures earn their place.** Keep the numbers that carry the story;
  round or drop the rest rather than stacking four decimals-deep figures in one sentence.
- **Names and roles only where they move the story.** A full executive roster per pick
  is API output, not writing.

## 6. Visuals: check for a real social card first

This type had no visuals guidance of its own before — it was silently inheriting
SKILL.md's generic "every issue gets a generated chart" default and always
running `charts.mjs`, never checking for a real card. Fix, same priority order as
`weekly-insights-v2.md`'s **Visuals: the social cards** section: **a real
social card beats a generated chart whenever one is eligible; `charts.mjs` is the
fallback for when nothing eligible exists, not a first choice taken for
convenience.**

The bucket cannot be listed without a credential (see that section's superseded
note), so in an interactive run, ask the user for each of this issue's three
tickers whether a real card exists for it, then apply the
date/story-prefix/relevance criteria `weekly-insights-v2.md` documents in full to
whatever they supply. A card covering one of the three is enough to illustrate
that stock's section; there's no requirement that all three have one — mix real
cards and a generated fallback per-stock as the user's answers actually support.
**In an unattended run**, there is no one to ask, so every ticker without a
user-supplied card falls back to `charts.mjs` per that same section's unattended
policy. Record which case applied (real card / generated fallback, and why) in
`run-notes.md` for each ticker checked — collapsing them into "used charts" hides
whether a card was genuinely unavailable or just never asked about.

## 7. Self-review before delivery

- Does the title name a pattern a reader can grasp before knowing the tickers, rather
  than listing the three events?
- Does each per-stock heading carry a narrative label plus company plus ticker?
- Two sub-parts per stock, with the forward view inside *The Finances* — no standalone
  outlook block?
- Does the closing section have its own thematic heading and read the three as one
  spectrum, rather than restating each?
- Is every forward-looking sentence attributed to management guidance, disclosed
  strategy, or cited consensus — never stated as the newsletter's own prediction, and
  never followed by a "not this newsletter's view" trailing note?
- Is any paragraph reporting that an API field was null? Delete it.
- Is every historical/people fact cited, once, without a citation on every clause?
- Does the Sources list contain anything the body never cites?
- Did `share_percentage`'s type inconsistency get cast before any comparison?
- Does each pick have a real, current "why this, why now," not just an interesting past?
- Does every `TICKER` mention (table, chart label, AND inline prose) read bold,
  linked, and ticker-blue (`#9E0142`)? Gains/losses green/red (`#568475`/`#D53E50`)?
  (`../newsletter-format.md`'s Color convention, applies to every issue.)
- Is the Appendix (endpoint/field trace) present, after Sources and before the
  disclaimer? **Endpoints and field names only**, one bullet per endpoint, with no section
  label, chart name, table name, derivation or usage note attached to any bullet
  (`../newsletter-format.md`'s Appendix section)?
