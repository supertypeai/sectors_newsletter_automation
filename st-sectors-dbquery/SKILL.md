---
name: st-sectors-dbquery
description: The single gateway to the Sectors Supabase project (user-account data and market tables). Runs only pre-approved SQL from `scripts/approved-queries/` and returns rows; no other skill may call the Supabase MCP tools. Market data is a fallback: use this skill for it only after the Sectors API failed to return the requested data (broker or foreign flow over a range, cross-holdings, REIT spreads). Use it directly for user counts, watchlist or workflow contents and any per-user field, which have no API: "how many users have X", "which tickers do users track", "check the DB for", "query Supabase". Also owns the staging and approval flow that turns a candidate query in `scripts/fixed-queries.sql` into an approved file. Returns data only, never writes content. Not for anything the Sectors API returns (tickers, prices, financials, filings).
metadata:
  department: marketing
  owner: evelyn
  tags: "data, research"
  events: "evergreen"
  output: "text"
  status: stable
  version: "1.1"
---

# Sectors DB Query Gateway

This skill is the only sanctioned path from any Sectors skill to the Supabase project,
which holds both user-account data and market tables the Sectors API can't range-query. It exists for one reason: **no content should ever be built
on a query nobody approved.** An improvised `SELECT` that looks right, quietly misses a
`deleted_at IS NULL` filter, and lands as a headline number in a published newsletter is
the exact failure this gateway prevents.

Two consequences follow, and they are the whole skill:

- **Approved queries only.** Runnable SQL lives in `scripts/approved-queries/<slug>.sql`
  and nowhere else. It runs verbatim, unedited. A query that is not in that folder is
  not runnable, no matter how simple or how urgent.
- **Data only, no content.** This skill returns rows. It does not draft emails,
  newsletters, captions, slides, or scripts. Whatever asked for the data does the
  writing.

## Who calls this skill

Any skill or request that needs Supabase data:

- `st-sectors-newsletter` — audience rows for personalized issues, plus broker and foreign
  flow over a date range.
- `st-sectors-articles` — original computations behind a bulletin data study, deep dive or insight.
- `st-sectors-carousel`, `st-sectors-image` — any DB-backed figure a piece
  needs.
- The lifecycle-nudge automation (GitHub Actions in `sectors_newsletter_automation`), which runs the
  credit-expiry, quota-renewal, insider, setup and onboarding queries to pick which contacts enter
  Mailroom sequences. Those five queries back that scheduled job: change one only through the approval flow below.
- The user directly, asking a question about the user base or the market tables.

Those skills are instructed never to call `mcp__supabase__*` themselves. **For market
data they come here only after the Sectors API failed to return the requested data**
(no endpoint expresses it, an error after a retry, an empty or null result, or a value
that fails the band check). Before running a market query, confirm the caller tried the
API first; if it did not, send it back to the API. User-account data has no API and
comes here directly.

## Run flow

1. **Identify the query.** Match the request to a slug in
   `scripts/approved-queries/`. List that folder, read the header comment at the top of
   the candidate file: each one states its eligibility rules and returned columns in
   plain English. Pick the one that actually answers the question.
2. **No match means stop, not improvise.** Go to Approving a new query below. Do not
   assemble something plausible from the schema browser and run it "just this once".
3. **Run it verbatim.** Read the file, pass its SQL text unmodified to
   `mcp__supabase__execute_sql`. No added `LIMIT`, no tweaked filter, no extra column,
   no rewritten join. If the approved query does not return what the caller needs, that
   is a signal the query needs a new approval pass, not a license to edit it inline.
4. **Return the rows, and say which query produced them.** Hand back the result plus the
   slug and approval date from the file header, so whatever writes the content can cite
   its provenance. Read `references/supabase-access.md` before the session's first query
   for the connector contract and the PII rules that govern where those rows may land.

## The guard is enforced, not just documented

`scripts/supabase-guard.mjs` runs as a `PreToolUse` hook on every `mcp__supabase__*`
call, from this skill, any sibling skill, any subagent, any session. It is registered in
`~/.claude/settings.json`. Its decisions:

| Call | Decision |
|---|---|
| Any mutating tool (`apply_migration`, branch tools, edge-function deploys, project tools) | **denied** |
| `execute_sql` with anything but one plain read (writes, DDL, transaction control, chained statements) | **denied** |
| Read-only introspection (`list_tables`, `list_migrations`, `search_docs`, advisors, logs, types) | allowed |
| `execute_sql` matching a file in `scripts/approved-queries/` | allowed, no prompt |
| `execute_sql` matching nothing | **user confirmation required** |

Matching ignores comments and whitespace, and treats a `{{placeholder}}` as a slot for a
plain scalar (a date, a number, a ticker), never for SQL syntax. So a parameterised
approved query runs unprompted with real dates substituted, while a query with an extra
`union` bolted on does not.

**Supabase is read-only from Claude Code, with no exception and no override.** Schema and
data changes are made by a human in Supabase directly. Never ask the user to loosen the
hook or the connector's `--read-only` flag.

## Approving a new query

A new query is the last resort, not the first move. Before drafting anything, prove no
approved query already covers the topic, and record that proof:

0. **Exhaust the folder, and say so out loud.** Run `ls scripts/approved-queries/`, then
   read the header block of every file whose slug is even loosely related to the topic
   (`head -15` on each is enough, the header states eligibility and columns in plain
   English). Never judge a query by its filename or by the catalog table in this file:
   the table is a convenience snapshot and can lag the folder. Then state, in one line
   to the user, which slugs you read and why each one fails, for example "read
   `sgx-dividend-card-facts` and `upcoming-dividends-by-date-range`, both keyed on
   declared dividends, neither carries yield". Skipping this line means the approval
   prompt is not ready to be shown.

   Three outcomes, and only the third leads to a new file:

   - **A query already answers it.** Run that one, even if its column set is wider than
     you wanted. Trim in the caller, not in the SQL.
   - **A query answers a topic you thought was different.** Same metric under another
     name, or your question is a narrower slice of an existing one, is a match. Reuse it.
     Two near-identical files is the exact drift this skill exists to stop, and the
     second one always wins by being newer, not by being right.
   - **An existing query is close but genuinely wrong for the question.** Then the fix is
     an amendment to that file under its own slug, not a parallel file. Same topic, one
     definition, one place. A parallel file is only correct when the topic itself is new.

When you have done that and no approved query answers the question:

1. Draft the candidate in `scripts/fixed-queries.sql`, the staging area. Introspection
   (`mcp__supabase__list_tables`, the docs search) is fine here for understanding table
   shape.
2. Run it once. The guard will stop and ask the user to confirm, showing them the SQL.
   That prompt is the approval: show them the match count it returns and what the piece
   intends to do with it, and don't push a query they hesitate over.
3. Write the confirmed text to `scripts/approved-queries/<slug>.sql`, with the header
   block from `references/query-standards.md`, and add its row to the catalog below in
   the same pass so the next run's folder check sees it. From then on it runs without prompting,
   and every later piece on the same topic reuses the identical query rather than a new
   variant that quietly answers a slightly different question. That consistency is half
   the point of the folder.

Editing an approved query goes through the same gate: change the text and it stops
matching, so the next run prompts again. Thresholds, eligibility logic, and column
changes all need that fresh confirmation before the file is overwritten. Running the
staged draft straight out of `fixed-queries.sql` is never allowed; if it is only in
staging, it is by definition not approved.

## Approved queries

Each file's header is the authoritative definition; this table is a snapshot that can
lag the folder, so the pre-approval check reads the folder, never this list. Current
catalog:

| Slug | Returns |
|---|---|
| `watchlist-tracked-interest` | Each user's tracked tickers and sectors, unioned from `user_watchlist` and active `user_workflow` rows |

Market and research computations the Sectors API can't express, run against market tables
in the same project:

| Slug | Returns |
|---|---|
| `broker-summary-range` | Broker flow aggregated over an arbitrary date range |
| `foreign-flow-range` | Foreign net flow aggregated over an arbitrary date range |
| `idx-broker-cohort-share-of-turnover` | Share of IDX turnover taken by a broker cohort |
| `idx-holdco-stake-value-vs-market-cap` | IDX holding companies: stake value against own market cap |
| `idx-listed-cross-holdings` | Cross-holdings between IDX-listed companies |
| `idx-listed-cross-holdings-edges` | Every >=1% stake one live IDX company holds in another, one row per edge, latest snapshot, with per-owner totals |
| `idx-register-band-holdings-by-symbol` | Per IDX company on the latest register: share held in the 1% to 5% band and at 5%+, entry counts, individual share of the band, latest market cap |
| `entity-symbol-coverage` | Conglomerates and people carrying at least one ticker, with their symbols |
| `upcoming-dividends-by-date-range` | Dividends with ex or payment dates inside a range |
| `upcoming-corporate-events-by-date-range` | AGM and EGM meetings (IDX, SGX), IPO listings and IDX stock splits inside a date range, one row per event |
| `idx-last-close-market-snapshot` | Latest-close index moves, breadth, summed market cap and top gainers, losers and most active (needs {{min_mcap}}) |
| `idx-window-movers-with-foreign-flow` | Top {{n}} gainers and losers by close-to-close return over a window, with traded value and exchange-definition net foreign flow (needs {{base_date}}, {{start}}, {{end}}, {{min_mcap}}, {{min_turnover}}) |
| `idx-latest-filings` | The most recent {{n}} insider and major-holder filings across all IDX symbols |
| `sgx-shareholders-for-symbol` | One SGX counter's stored shareholders list: holder, share_amount, share_percentage (decimal), direct holders only |
| `sgx-holder-name-search` | Every active SGX counter whose stored shareholders list has a holder matching a name substring, with share_amount and share_percentage (decimal) |
| `sgx-market-cap-rank` | SGX counters ranked by market cap as of a date, with universe size |
| `sgx-dividend-card-facts` | Dividend facts for an SGX counter, card-ready |
| `sgx-buyback-value-and-streak-leaders` | SGX buyback value and consecutive-day streak leaders |
| `sgx-buyback-price-discipline-and-mandate-runway` | SGX buyback price discipline and mandate runway |
| `sgx-reit-carry-spread-and-dpu-bridge` | SGX REIT carry spread and DPU bridge |
| `sgx-reit-yield-decomposition-dpu-units-price` | SGX REIT yield change split into DPU growth, unit growth and price change (DPU in cents, divide yields by 100) |
| `sgx-reit-property-valuation-vs-cost-by-year` | Per REIT and financial year: summed purchase price vs market valuation, uplift %, average holding years |
| `sgx-reit-property-uplift-by-country-category-hold` | FY2025 per-property uplift (median, mean) by country, category and holding-age bucket |
| `sgx-reit-indonesia-assets-by-reit` | FY2025 Indonesian properties per SGX REIT: count, holding years, median and aggregate uplift, cost, valuation, NPI |
| `sgx-reit-like-for-like-revaluation-fy24-fy25` | Same-property valuation change FY2024 to FY2025 by category, with count up and down |
| `sgx-reit-transactions-vs-basis` | Median transaction_price vs basis_value by transaction type, basis and financial year |
| `sgx-reit-divestments-named-examples` | Largest and highest-premium REIT divestments vs own valuation, named, FY2023 to FY2025 |
| `sgx-reit-uplift-by-category-and-hold-bucket` | FY2025 median uplift over cost by property category crossed with holding-age bucket |
| `sgx-reit-industrial-divestments-realised-gain` | Per REIT, industrial divestments vs purchase price: count, aggregate and median gain |
| `sgx-reit-uplift-latest-year-by-category-hold` | Median uplift over cost by category, overall and by holding bucket, each trust's latest usable year (covers Mapletree trusts) |
| `sgx-reit-ytd-price-return` | SGX REIT price return between two dates, with latest market cap |
| `idx-retail-vs-foreign-flow-summary` | Retail-broker vs foreign net flow over a range, one summary row |
| `idx-broker-cohort-share-of-turnover` | Each broker cohort's turnover share and net value over a range |
| `idx-retail-vs-foreign-flow-by-symbol` | Per-symbol retail vs foreign net, with the window's price move |
| `idx-register-value-by-investor-type` | IDX 1% register split by investor type, entries and market value, with register coverage of the live universe |
| `idx-board-interlock-vs-register` | People holding three or more IDX board seats, and how many are absent from the register of every board they sit on |
| `idx-register-holders-for-symbols` | Every 1% register entry for a named set of symbols, with holder percentage, type and stake value |
| `idx-foreign-volume-at-price-daily` | Per-symbol daily foreign buy/sell volume with the price each side transacted at, for a foreign volume-at-price profile |
| `scheduled-database-jobs` | Every pg_cron job in the database: schedule, command and whether it is active (operational metadata, not market or account data) |
| `market-coverage-counts` | Per-market coverage counts for the KB: IDX active companies with listing-board split, SGX active counters and suspended subset, KLSE companies |
| `idx-dividend-history-for-symbol` | One IDX symbol's dividend record three ways: every `idx_dividend` row, per-year totals, and the report's TTM fields with latest close |
| `idx-recent-closes-for-symbol` | The last N trading-day closes for one IDX symbol, to tie a displayed figure to the close date that produced it |
| `idx-filings-for-symbol` | Every insider / major-holder transaction filing for one IDX symbol, oldest first, as filed (duplicates kept) |
| `idx-register-history-for-holder` | Every 1% register entry across all snapshots for a holder-name pattern, to trace one holder over time |
| `idx-register-institutional-holder-books` | One row per institutional holder (pension, fund, insurer, FI, government, investment co) on latest register, with holdings and book value |
| `idx-manual-input-recent-breakdowns` | idx_manual_input rows updated in the last 14 days: sankey_component and industry_breakdown jsonb |
| `idx-manual-input-prior-year-sankey` | FY2023 and FY2024 sankey_component for symbols with a recently updated idx_manual_input row |
| `idx-quarterly-income-stmt-for-symbol` | One IDX symbol's quarterly income statement jsonb (IDR single quarter plus reporting-currency cumulative from Q1) from a start date |
| `conglomerate-member-shareholder-registers` | Every conglomerate's member symbols with each symbol's register holders (IDX latest 1% snapshot, SGX stored list), null holder where no register |
| `people-member-evidence` | Every person in the people table with each mapped symbol's register holders, board names and insider filings matched to that person |
| `people-member-register-history` | Per person and mapped IDX symbol: first and last register snapshot where the person's own name appears, pct at last sighting |
| `people-dropped-off-symbol-filings` | Per person-symbol pair that fell off the 1% register: every filing on that symbol since {{since}}, any filer |

**Foreign always means the exchange's own per-row flag** (`f_bval` / `f_sval` in
`idx_broker_summary_daily`, or `foreign_buy_volume` / `foreign_sell_volume` in
`idx_daily_data`), the beneficial-owner definition that a published IDX foreign-flow
print uses. **Never measure foreign investment from `idx_broker_registry.is_foreign`**,
which is the executing broker's domicile: it books an Indonesian family office trading
through a foreign house as foreign money, and over 2026 it returned -79.5T against the
correct -92.6T. The registry's only legitimate use is the retail/institutional cohort
tag, which exists nowhere else.

Conventions for both families, including the required header block: `references/query-standards.md`.

## Hard rules

0. **Search the folder before proposing a new query.** An approval prompt raised without
   the header-read pass in Approving a new query is itself a violation: the user is being
   asked to approve a query nobody checked for duplicates.
1. **Approved query only, never ad-hoc SQL.** The one exception is schema introspection
   while drafting a candidate in staging. A one-off `SELECT` "just to check something",
   even read-only, even for one row, is not allowed, and the guard will stop it.
2. **Read-only, always.** Two layers hold this: the connector runs `--read-only`, and the
   guard denies every mutating call before it reaches the connector. Never attempt a
   write, never ask for either layer to be relaxed.
3. **Never fabricate or extrapolate a number.** Every figure a caller publishes traces
   to a row this skill actually returned. If a query returned nothing, say it returned
   nothing.
4. **Rows are real people's data.** Emails, names, holdings, billing state. See the PII
   rules in `references/supabase-access.md`: rows stay in the session that fetched them,
   never get committed to this repo, and get scrubbed before anything leaves the machine.
5. **No content generation here.** Return the data and stop.

## What's in this skill

```
SKILL.md                          you are here
references/
  supabase-access.md              connector contract, approval flow, PII rules
  query-standards.md              naming and header conventions every approved
                                   query file follows
scripts/
  approved-queries/               the ONLY folder a query may be run from,
                                   one file per slug (see catalog above)
  supabase-guard.mjs              the PreToolUse hook that enforces all of the above
  fixed-queries.sql               staging area for a candidate query awaiting
                                   approval, never a run source
```

## Setup

A `supabase` MCP server must be connected, project-scoped and `--read-only`, added at
user scope so no token lands in a repo. Check with `claude mcp list` before a run. If it
is missing, stop and reconnect it.

The guard hook must also be registered, in `~/.claude/settings.json`:

```json
{ "matcher": "mcp__supabase__.*",
  "hooks": [{ "type": "command",
              "command": "node ~/.claude/skills/st-sectors-dbquery/scripts/supabase-guard.mjs" }] }
```

Node built-ins only, no install. If that entry is missing, the policy in this file is
advisory only, so restore it before running anything against the database. Do not fall back to asking the user to paste data
manually: pasted numbers have no query behind them to audit, which is the entire thing
this skill exists to prevent.
