# Query standards

Conventions every file in `scripts/approved-queries/` follows. Read this before drafting
a candidate in `scripts/fixed-queries.sql`, and before approving one.

Two families live in the folder and they carry slightly different headers:

- **Account queries** select an audience or report on user-account state (onboarding,
  credits, quota, watchlists). Approved for eligibility logic.
- **Market/research queries** compute something out of market data the Sectors API cannot
  express (flow ranges, cross-holdings, spreads). Approved for methodology.

## Naming

`<what-it-computes>.sql`, kebab-case, describing the computation rather than the piece it
was written for. A query written for one article is usually re-used by three later ones.

Good: `free-float-spread-dispersion.sql`, `foreign-flow-range.sql`,
`onboarding-unclaimed-reward.sql`.

Bad: `study1.sql`, `coal-article-query.sql`, `temp.sql`.

## Header block, required in every file

Account query:

```sql
-- name:         onboarding-unclaimed-reward
-- returns:      one row per eligible user: user_id, email, first_name, started_at
-- eligibility:  active, non-staff users with >=1 onboarding_progress row and zero
--               onboarding_claims rows
-- exclusions:   soft-deleted accounts, staff, superusers
-- approved:     <date>, <approver>
-- used by:      <skill / issue slug>
```

Market/research query:

```sql
-- name:         drawdown-recovery-base-rate
-- computes:     share of IDX names that recovered a >20% quarterly drawdown within 4 quarters
-- universe:     IDX common stock with a full price history over the window
-- window:       parameterised, :start_date to :end_date
-- exclusions:   suspended >5 sessions in the window; delisted before window end;
--               fewer than 8 quarters of history
-- survivorship: universe is point-in-time as of each quarter start, delisted names retained
-- statistic:    count and share, equal-weighted, sample size returned alongside
-- approved:     <date>, <approver>
-- used by:      <article slugs>
```

The `survivorship` line is not optional on any historical study. Omitting it is how a
result comes out wrong in the direction that flatters the finding.

## Rules

- **Parameterise dates and thresholds** on market/research queries, so the same file can
  be re-run for a refresh or a later piece.
- **Return the sample size** next to every statistic in a research result set.
- **Read-only.** No writes, ever.
- **Approve before first use**, and record the approver and date in the header.
- **Re-read the header before re-use.** A query written for a different universe silently
  answers a different question.
- **Cite the file.** A publication's methodology section names it and the appendix lists
  it: that is the reproduction path the reader is promised. A newsletter or carousel
  citing a DB figure names the slug in its source list.
