# Onboarding unclaimed reward, workflow

A user has started onboarding (has at least one `onboarding_progress` row) but has
never claimed the completion reward (zero `onboarding_claims` rows). Nudge them to
finish the quest and claim the free 500 credits sitting there. Read
`../newsletter-format.md`'s onboarding-unclaimed-reward skeleton and
`../supabase-access.md` before drafting.

For a user who never started onboarding at all, that's `onboarding-nudge.md`, not this
one.

## 1. Confirm the approved query

Check `../../scripts/approved-queries/onboarding-unclaimed-reward.sql` exists (it
does: approved 2026-07-16). It returns active, non-staff users who have at least one
`onboarding_progress` row and zero `onboarding_claims` rows: `user_id`, `email`,
`first_name`. It deliberately does not track which specific track or task each user is
mid-way through, "already in progress, not yet claimed" is eligibility enough, don't
invent a per-track breakdown that isn't in the query result. If the eligibility logic
ever needs to change, that goes back through the staging/approval flow in
`../supabase-access.md`, never a guessed or ad-hoc query.

## 2. Run it

Via the Supabase MCP connector, execute the exact query text from
`../../scripts/approved-queries/onboarding-unclaimed-reward.sql`, unmodified.

## 3. The reward is the concrete gap

Every row this query returns is mid-onboarding with a real reward waiting: the
onboarding-claim mechanic grants credits (500 by default per
`onboarding_claims.credits`) once a track is finished. The email states that plainly:
they're partway through, finishing unlocks a concrete, real reward, not a vague
"complete your profile" nudge. Don't state an exact credit figure unless the fixed
query itself returns it for that row, if it doesn't, say "a credit reward" rather than
inventing a number (`../compliance.md`'s no-fabrication rule).

## 4. Draft

Follow `../newsletter-format.md`'s onboarding-unclaimed-reward skeleton: greeting +
the unclaimed reward as the hook, why finishing is worth the last step, one CTA back
into onboarding. Short, `{{merge_tag}}`s for every per-recipient field (`first_name`
only, this query has no other per-recipient personalization field), worked example
rendered against one real row (scrub PII per `../supabase-access.md` before this file
is shared outside the session).

## 5. Self-review before delivery

- Does the CTA point back into onboarding specifically, not a generic "log in"?
- Is there exactly one CTA, not stacked with unrelated secondary asks?
- Every `{{merge_tag}}` in the body maps to a real column the approved query returns
  (`user_id`, `email`, `first_name` only)?
- Is any credit figure mentioned either sourced from the query result or phrased
  generically ("a credit reward"), never an invented number?
- Is the worked example rendered against a real row, with any real email/name/ID
  scrubbed per `../supabase-access.md`?
- Does the disclaimer + unsubscribe footer appear, unmodified
  (`../newsletter-format.md`)?
- No investment-adjacent framing snuck in (this issue type is product engagement, not
  market content, but the same house voice/no-hype rules still apply,
  `../compliance.md`)?
