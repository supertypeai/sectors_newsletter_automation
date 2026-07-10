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

## 5. Section-fill order

Per stock: *the story* → *the people* → *the numbers* → *the outlook* (attributed only).
Open with the thread tying the three together (or the honest absence of one); close with
a short line, not a summary restatement.

## 6. Self-review before delivery

- Is every forward-looking sentence attributed to management guidance, disclosed
  strategy, or cited consensus — never stated as the newsletter's own prediction?
- Is every historical/people fact cited?
- Did `share_percentage`'s type inconsistency get cast before any comparison?
- Does each pick have a real, current "why this, why now," not just an interesting past?
