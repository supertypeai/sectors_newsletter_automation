# Onboarding nudge, workflow

Re-engage a user who has never started onboarding at all: zero rows in both
`onboarding_progress` and `onboarding_claims`. Read `../newsletter-format.md`'s
onboarding-nudge skeleton and `../supabase-access.md` before drafting.

For a user who *started* onboarding but hasn't claimed the completion reward, that's
a different issue type, `onboarding-unclaimed-reward.md`, not this one.

## 1. Confirm the approved query

Check `../../scripts/approved-queries/onboarding-nudge.sql` exists (it does: approved
2026-07-16). It returns active, non-staff, non-superuser users with no
`onboarding_progress` rows and no `onboarding_claims` rows, i.e. haven't touched
onboarding at all. If this file is ever missing or the eligibility logic needs to
change, that goes back through the staging/approval flow in `../supabase-access.md`,
never a guessed or ad-hoc query.

## 2. Run it

Via the Supabase MCP connector, execute the exact query text from
`../../scripts/approved-queries/onboarding-nudge.sql`, unmodified. This returns every
currently-eligible row, not just one, that's the audience the sending system will use,
this skill only needs one or two rows to draft and prove the template against.

## 3. The one concrete gap is fixed by eligibility

Every row this query returns hasn't started onboarding at all, so the gap is the same
for everyone: "you haven't started setting up your account yet." No need to
differentiate per row, the eligibility filter already narrowed it to one concrete,
specific ask: start onboarding.

## 4. Draft

Follow `../newsletter-format.md`'s onboarding-nudge skeleton: greeting + the one
concrete gap, why it matters (tie to something the row shows they've already done, if
the query exposes that), one CTA. Short, `{{merge_tag}}`s for every per-recipient
field, worked example rendered against one real row (scrub PII per
`../supabase-access.md` before this file is shared outside the session).

## 5. Self-review before delivery

- Does the CTA point at the one specific gap named in the lead, not a generic "log in"?
- Is there exactly one CTA, not stacked with unrelated secondary asks?
- Every `{{merge_tag}}` in the body maps to a real column the fixed query returns?
- Is the worked example rendered against a real row, with any real email/name/ID
  scrubbed per `../supabase-access.md`?
- Does the disclaimer + unsubscribe footer appear, unmodified
  (`../newsletter-format.md`)?
- No investment-adjacent framing snuck in (this issue type is product engagement, not
  market content, but the same house voice/no-hype rules still apply,
  `../compliance.md`)?
