# Compliance, read before drafting any section

This template reaches real users' inboxes and is built from real per-user account
data. It carries the sibling `sectors-newsletter-generator` skill's non-advice and
data-integrity discipline, plus rules specific to handling account data.

## The hard rules

1. **Never fabricate, estimate, or round-for-effect a number.** Every figure traces to
   a real Supabase row fetched this run via the approved query
   (`references/supabase-access.md`), or a cited source (`sourcing.md`). No
   "approximately", no derived figure presented as if returned.
2. **If a field is `null` or missing, omit the claim, don't drop the recipient.** A
   row missing one field means that one figure gets skipped from that recipient's
   rendering, not that the row is silently dropped from the audience the approved
   query defined. Flag any row you had to skip a field for.
3. **Descriptive only, never investment advice.** No built issue type is
   performance-framed today, but the house voice/no-hype/no-imperative rules
   (`references/writing/writing.md`, `brand-voice.md`) still apply to every issue:
   describe the real account state, never prescribe an action beyond the one CTA the
   workflow doc specifies.
4. **Show the date.** Every issue carries a `data_as_of` field (see
   `newsletter-format.md`), a Supabase figure (credits, cycle start) is as-of the
   query run.
5. **Raw Supabase column names never appear in body copy.** A recipient reading
   "credits_remaining: 4" instead of "you have 4 credits left" is a data-leak-shaped
   mistake as much as a voice one.
6. **One user's data never appears in another user's rendering.** The approved query
   returns many eligible rows; the template renders one recipient's fields per send.
   Never blend, aggregate across, or reference a second recipient's numbers ("you're in
   the top 10% of users this week") unless the approved query itself was written to
   compute that aggregate server-side and expose it as a column, never computed ad hoc
   from the raw rows during drafting.
7. **PII stays local.** See `supabase-access.md`'s PII section: `sample-rows.csv`
   never leaves this machine, worked examples get scrubbed before sharing outside the
   session.

## Reconciling personalization with the approved-query rule

Personalization (using a real user's real name, real numbers) is the entire point of
this skill, that's not in tension with the approved-query rule as long as every field
used came back from the one approved query for this issue type
(`scripts/approved-queries/<slug>.sql`). The tension shows up only when a draft wants
"just one more field" mid-run, don't add it by hand-editing a query result or guessing
a plausible value, go back through the staging/approval flow in `supabase-access.md`
instead.

If a future issue type reintroduces market-sourced figures, the sibling skill's
non-advice discipline for performance framing applies in full: report the fact,
benchmarked, never the imperative. Revisit this file's history for that language if
that day comes.
