# Supabase access, read before the first query of a session

The `supabase` MCP connector is the only path to the database, and this skill is the only
thing allowed to use it. Three layers hold that:

1. `scripts/supabase-guard.mjs`, a `PreToolUse` hook on every `mcp__supabase__*` call,
   which denies mutating calls outright and lets `execute_sql` through only for SQL that
   matches a file in `scripts/approved-queries/`. Anything unmatched stops for the user's
   confirmation. See SKILL.md, "The guard is enforced, not just documented".
2. The connector itself, project-scoped and started `--read-only`, so a write fails at
   the transport level even if the hook were removed.
3. The rules below, which are what the first two layers exist to make unbreakable.

## The approved-query rule

Runnable SQL lives in exactly one place: `scripts/approved-queries/<slug>.sql`.

- **`scripts/approved-queries/` is the only run source.** Read the file, copy its SQL
  text verbatim, pass it to the Supabase MCP query tool unmodified. Don't add a `LIMIT`,
  don't change a filter, don't rewrite a join "to be safe", don't add a column that
  would be handy downstream. If the approved query doesn't return what the caller needs,
  that's a signal the query needs a new approval pass, not a license to improvise one
  inline.
- **No file in `approved-queries/` means stop, not guess.** Don't assemble something
  plausible from the schema browser. Draft the candidate in `scripts/fixed-queries.sql`,
  test it read-only for a sane match count, show the exact SQL to the user, get their
  explicit sign-off, one query at a time. Only after that sign-off does it earn a file
  in `approved-queries/` and become runnable.
- **`fixed-queries.sql` is staging only, never a run source.** A query that's still only
  in staging is, by definition, not approved.
- **Editing an approved query re-triggers the same gate.** Changed eligibility logic,
  thresholds, or columns go back through staging and a fresh explicit approval before
  the file is overwritten, same as a brand-new query.
- **No exploratory SQL against production tables.** Listing tables and inspecting schema
  through the connector's introspection tools is fine while drafting a candidate query.
  A hand-written `SELECT` run for any other reason, a one-off count outside the
  staging/approval flow, is not, even read-only, even for one row. To see what an
  approved query returns, run the approved query.

## Provenance

When returning rows to a calling skill or to the user, name the slug and the approval
date from the query file's header. Anything published on top of that data should be able
to point back at the exact approved query that produced it. A number with no slug behind
it doesn't get published.

## PII handling

Every row is a real person's account data: email, name, holdings, billing state.

- **Fetch only what the approved query returns.** Don't broaden a column list to "grab
  context" for whatever is being written.
- **Rows stay in the session that fetched them.** They are never copied into this skills
  repo, never committed, never pasted into a shared doc.
- **If rows must land on disk**, the calling skill writes them into its own working
  directory outside the repo, and the user gets told explicitly that the file contains
  real user PII and should not leave the machine.
- **Scrub before sharing.** If a worked example or a screenshot of this session leaves
  this machine (Slack, a design review), replace any real email, name, or
  account-identifying number with an obviously fake placeholder first, unless the user
  explicitly wants it kept real for internal review.

## Connector contract

- Configured at user scope (`claude mcp add supabase -s user ...`), not project scope,
  so the access token never lands in a file inside this or any git repo.
- `--read-only` is load-bearing: it's what makes a mistake non-destructive. Don't ask
  the user to drop that flag to "make this easier".
- If `claude mcp list` doesn't show `supabase` connected, stop and get it reconnected.
  Don't fall back to asking the user to paste data manually as a workaround, that
  defeats the whole discipline: a pasted table has no query behind it to audit.
