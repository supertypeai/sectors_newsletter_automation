# Supabase access, read before the first query of a session

This skill's only path to user-account data is the `supabase` MCP connector. It is
project-scoped to one Supabase project and started with `--read-only`, so a write
attempt fails at the transport level, that's a deliberate second layer under the rule
below, not the only one.

## The fixed-query rule

Every issue type has exactly one pre-approved query, and it lives in exactly one
place: `scripts/approved-queries/<issue-type-slug>.sql`. That folder, not
`scripts/fixed-queries.sql`, is what this skill is ever allowed to run a query from.

- **`scripts/approved-queries/` is the only run source.** Before running anything for
  an issue type, check `scripts/approved-queries/<slug>.sql` exists. If it does, copy
  its SQL text verbatim and pass it to the Supabase MCP query tool unmodified. Don't
  add a `LIMIT`, don't change a filter, don't rewrite a join "to be safe", don't add a
  column you think would help the draft. If the approved query doesn't return
  something the draft needs, that's a signal the query needs a new approval pass, not
  a license to improvise one inline.
- **No file in `approved-queries/` means stop, not guess.** If this issue type (or
  sub-variant, e.g. `credit-plan-lifecycle-credits-expiring` vs.
  `credit-plan-lifecycle-quota-cycle-renewal`) has no approved file yet, don't assemble
  something plausible from the schema browser. Draft the candidate query in
  `scripts/fixed-queries.sql` (the staging area), test it read-only for a sane match
  count, show the exact SQL to the user, and get their explicit sign-off, one query at
  a time, before it earns a file in `approved-queries/`. Only after that sign-off does
  the query get written into `approved-queries/<slug>.sql` and become runnable.
- **`fixed-queries.sql` is staging only, never a run source.** It's where a new or
  edited query gets drafted and reviewed. Nothing gets executed straight out of it. A
  query that's still only in `fixed-queries.sql` is, by definition, not approved yet.
- **Editing an approved query re-triggers the same gate.** A change to eligibility
  logic, thresholds, or columns for an already-approved query goes back through
  staging and a fresh explicit approval before the file in `approved-queries/` is
  overwritten, same as a brand-new query.
- **No exploratory SQL against production tables.** Listing tables/schema via the MCP
  connector's introspection tools (if offered) is fine for understanding shape while
  drafting a candidate query. A hand-written `SELECT` run for any other reason,
  "just to check something," a one-off count outside the staging/approval flow, is
  not, even read-only, even for one row. If you need to see what an approved query
  returns, run the approved query itself.

## PII handling

Every row this skill fetches is a real person's account data (email, name, holdings,
billing state). Treat it accordingly:

- **Fetch only what the fixed query returns.** Don't broaden a query's column list to
  "grab context" for the draft.
- **One real worked example per run, not a full render.** Draft the template with
  `{{merge_tag}}` placeholders, then fill it once against a single real sample row to
  prove the pipeline and the voice, not against every row the query returned.
- **`sample-rows.csv`** (see SKILL.md Delivery) is the one place real rows land on
  disk. It stays local, it's never copied into the skills repo, never pasted into a
  shared doc, never committed. Say this to the user explicitly when a run produces one.
- **Scrub before sharing.** If a worked example or a screenshot of this session needs
  to leave this machine (a Slack message, a design review), replace any real email,
  name, or account-identifying number with an obviously fake placeholder first, unless
  the user explicitly asks to keep it real for their own internal review.

## Connector contract

- Configured at user scope (`claude mcp add supabase -s user ...`), not project scope,
  so the access token never lands in a file inside this (or any) git repo.
- `--read-only` is load-bearing: it's what makes a fixed-query mistake non-destructive.
  Don't ask the user to drop that flag to "make this easier."
- If `claude mcp list` doesn't show `supabase` connected, stop and get it reconnected
  before continuing, don't fall back to asking the user to paste data manually as a
  workaround, that defeats the fixed-query discipline (a pasted table has no query
  behind it to audit).
