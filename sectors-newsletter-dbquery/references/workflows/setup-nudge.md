# Setup nudge, workflow

The non-INSIDER counterpart to `insider-nudge.md`. Watchlist, workflow, and
screener are gated to the INSIDER tier, so a non-INSIDER user with real spendable
credits can't be nudged toward those, they have no access at all. Credits are spendable
on API calls regardless of tier, so for this audience the unused-value story is
different: real credits sitting there, and the user has never made a single API call.
Read `../newsletter-format.md`'s insider-nudge skeleton (this type follows
the same shape, greeting + unused value + one CTA) and `../supabase-access.md` before
drafting.

For a user who has already made an API call, that's a different signal (they've found
the value, this isn't the right nudge), out of scope for this issue type, don't loosen
the eligibility filter to include them.

## 1. Confirm the approved query

Check `../../scripts/approved-queries/setup-nudge.sql` exists (it does: approved
2026-08-03, renamed from api-usage-nudge.sql and had its `LIMIT` dropped plus a
`subscription_cancellation = false` filter added 2026-08-05 for the recurring monthly
automation). It returns active, non-staff, non-INSIDER-tier, non-cancelling users with
`credits > 0` and zero rows in `api_apiresponsetime` (one row per real API call, keyed on
`user_id`): `user_id`, `email`, `credits`. If the eligibility logic ever
needs to change, that goes back through the staging/approval flow in
`../supabase-access.md`, never a guessed or ad-hoc query.

## 2. Run it

Via the Supabase MCP connector, execute the exact query text from
`../../scripts/approved-queries/setup-nudge.sql`, unmodified.

## 3. The gap is the unused credits, not a generic "try our API"

The hook is concrete and real: they have `{{credits}}` credits sitting there and have
never made a single call. Name the real number, don't generalize it into "explore what
Sectors can do."

## 4. Draft

Follow `../newsletter-format.md`'s insider-nudge skeleton (this type shares
it, there's no separate setup-nudge skeleton): a static "Hi there," greeting (not a
merge tag, same decision as insider-nudge), the unused credits as the
hook, why making an API call puts them to work, one CTA (API docs or quickstart, not
the watchlist/workflow link, this audience can't access those). Short,
`{{merge_tag}}`s for every per-recipient field actually used (`credits`, and the
computed `{{unused_value}}`), worked
example rendered against one real row (scrub PII per `../supabase-access.md` before
this file is shared outside the session).

## 5. Self-review before delivery

- Does the lead name the real unused credits (`{{credits}}`), not a generic engagement
  line?
- Is there exactly one CTA, not stacked with unrelated secondary asks, and does it
  point somewhere this audience can actually access (not watchlist/workflow, which are
  INSIDER-only)?
- Every `{{merge_tag}}` in the body maps to a real column the approved query returns
  (`user_id`, `email`, `credits`) or is documented as computed (`{{unused_value}}`)?
- Is the worked example rendered against a real row, with any real email/name/ID
  scrubbed per `../supabase-access.md`?
- Does the disclaimer + unsubscribe footer appear, unmodified
  (`../newsletter-format.md`)?
- No investment-adjacent framing snuck in (this issue type is product engagement, not
  market content, but the same house voice/no-hype rules still apply,
  `../compliance.md`)?
