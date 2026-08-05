# Insider nudge, workflow

**INSIDER tier only** (corrected 2026-08-03). Watchlist, workflow, and screener are
gated to the INSIDER tier — a Free/Standard user has no access to those features at
all, so nudging them to "set up a watchlist" is broken advice, they'd click through
and hit a paywall. A non-INSIDER user with unused credits gets a different nudge
instead, see `setup-nudge.md`.

A user has real spendable value sitting unused: credits or a monthly quota, but zero
watchlists and zero workflows/alerts, i.e. never set up anything that value could
actually power. Read `../newsletter-format.md`'s insider-nudge skeleton and
`../supabase-access.md` before drafting.

For a user with no credits/quota and no watchlist/workflow, that's a different signal
(no value to lose), out of scope for this issue type, don't loosen the eligibility
filter to include them.

## 1. Confirm the approved query

Check `../../scripts/approved-queries/insider-nudge.sql` exists (it does:
approved 2026-07-16, corrected 2026-08-03 to add the INSIDER-tier filter, renamed from
notification-setup-nudge.sql and had its `LIMIT` dropped plus a
`subscription_cancellation = false` filter added 2026-08-05 for the recurring monthly
automation — see the file's own header for why). It returns active, non-staff,
INSIDER-tier, non-cancelling users with zero `user_watchlist` rows and zero
`user_workflow` rows, but `credits > 0` or `monthly_quota > 0`: `user_id`, `email`,
`credits`, `monthly_quota`. If the eligibility logic ever needs to change again, that
goes back through the staging/approval flow in `../supabase-access.md`, never a guessed
or ad-hoc query.

## 2. Run it

Via the Supabase MCP connector, execute the exact query text from
`../../scripts/approved-queries/insider-nudge.sql`, unmodified.

## 3. The gap is the unused value, not a generic "set up alerts"

The hook is concrete and real: they have credits or quota sitting there
(`{{credits}}` or `{{monthly_quota}}`, whichever is nonzero for that row) and nothing
set up to spend it on. Name the real number, don't generalize it into "get more from
Sectors."

## 4. Draft

Follow `../newsletter-format.md`'s insider-nudge skeleton: a static "Hi there," greeting
(not a merge tag — most rows have no usable name, see the format doc for why), the
unused value as the hook, why setting up a watchlist or workflow/alert puts it to work,
one CTA. Short, `{{merge_tag}}`s for every per-recipient field actually used
(`credits`, `monthly_quota`, and the computed `{{unused_value}}`), worked example
rendered against one real row (scrub PII per `../supabase-access.md` before this file is
shared outside the session).

## 5. Self-review before delivery

- Does the lead name the real unused value (`credits` or `monthly_quota`, whichever
  the row actually has), not a generic engagement line?
- Is there exactly one CTA, not stacked with unrelated secondary asks?
- Every `{{merge_tag}}` in the body maps to a real column the approved query returns
  (`user_id`, `email`, `credits`, `monthly_quota`) or is documented as computed
  (`{{unused_value}}`)?
- Is the worked example rendered against a real row, with any real email/name/ID
  scrubbed per `../supabase-access.md`?
- Does the disclaimer + unsubscribe footer appear, unmodified
  (`../newsletter-format.md`)?
- No investment-adjacent framing snuck in (this issue type is product engagement, not
  market content, but the same house voice/no-hype rules still apply,
  `../compliance.md`)?
