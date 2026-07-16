# Credit/plan lifecycle, workflow

Credit-expiry or quota-cycle-renewal reminder, timed off a real billing/usage trigger.
Two approved sub-queries live under this family, run and drafted **separately, one
issue per run**, never merged into one email:

- `credit-plan-lifecycle-credits-expiring` — a user's credit balance expires within
  14 days.
- `credit-plan-lifecycle-quota-cycle-renewal` — a user on a real monthly quota
  (`monthly_quota > 0`) is 25+ days into their current cycle (`quota_cycle_start`).

Read `../newsletter-format.md`'s credit-plan-lifecycle skeleton and
`../supabase-access.md` before drafting. If the user asks for a lifecycle email
without naming which trigger, ask which of the two (don't guess, they read
differently: one is "your credits expire," the other is "your cycle is about to
renew").

## 1. Confirm the approved query

Check `../../scripts/approved-queries/credit-plan-lifecycle-credits-expiring.sql` or
`../../scripts/approved-queries/credit-plan-lifecycle-quota-cycle-renewal.sql`,
whichever matches this run (both approved 2026-07-16). Neither filters on `is_staff`,
only `is_active` (dropped on approval). If a new trigger variant is ever needed, that
goes through the staging/approval flow in `../supabase-access.md` as its own new
sub-query file, never bolted onto an existing approved one.

## 2. Run it

Via the Supabase MCP connector, execute the exact query text from the approved file,
unmodified. Read back the real numbers: credits remaining and `credits_expire_at` for
the credits-expiring query, or `monthly_quota`/`quota_cycle_start` for the
quota-cycle-renewal query, the copy has to match the real state, not a template
written for the worst case.

## 3. State the real number first, no manufactured urgency

The trigger data (a real credit count, a real date) already carries whatever urgency
exists. Don't add invented scarcity ("only a few spots left," "act now before it's too
late") on top of a plain fact like "3 credits, expiring July 18." State the number and
date plainly and let them speak for themselves.

## 4. Draft

Follow `../newsletter-format.md`'s credit-plan-lifecycle skeleton: the real number
first, what happens next (factual, not scare-framed), one CTA (renew/upgrade/top up).
`{{merge_tag}}`s for every per-recipient field, worked example against one real row,
scrubbed per `../supabase-access.md`.

## 5. Self-review before delivery

- Is the headline number/date real and taken directly from the query result, not
  rounded or softened for effect?
- Does "what happens next" state the real consequence (feature X stops working, price
  changes to Y) rather than a vague warning?
- Is urgency language proportionate to the real date/number, no invented scarcity?
- Exactly one CTA, matching the real trigger (an upgrade prompt CTAs to upgrade, not to
  a generic "manage account" page)?
- Every `{{merge_tag}}` maps to a real column in the approved query?
- Worked example rendered against a real row, PII scrubbed per `../supabase-access.md`?
- Disclaimer + unsubscribe footer present, unmodified?
- No investment advice snuck into billing copy (still governed by `../compliance.md`'s
  house rules even though this issue type isn't market content)?
