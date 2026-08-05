-- APPROVED fixed query for issue type: credit-plan-lifecycle (quota-cycle-renewal group)
-- Approved: 2026-07-16
--
-- Eligibility: active users on a real monthly quota (monthly_quota > 0) who are 25
-- or more days into their current quota cycle (quota_cycle_start), i.e. renewal is
-- coming up soon.
--
-- 2026-08-06 changes, for the recurring monthly GitHub Actions lifecycle-nudge
-- automation (this query previously only ran for one-off manual drafting), mirroring
-- the same changes applied to insider-nudge.sql / setup-nudge.sql on 2026-08-05:
--   - Dropped "LIMIT 50". A hard cap made sense for a one-off draft sample, but
--     baked into a monthly automated enrollment run it would silently skip
--     everyone past the 50th eligible row (by quota_cycle_start) every month. The
--     automation script paginates/chunks downstream, so nothing needs a capped
--     result set.
--   - Added "AND u.subscription_cancellation = false" (confirmed via
--     information_schema.columns: boolean, NOT NULL on api_user). Never enroll a
--     user who has initiated cancellation into a new lifecycle email journey.
--
-- KNOWN LIMITATION, flagged 2026-08-06, deliberately not fixed yet: "ever enrolled"
-- dedup for this type is a PERMANENT per-sequence block in the automation script
-- (lifecycle-nudge.mjs), same mechanism as the other 3 lifecycle nudge types. But
-- unlike those, this eligibility condition (25+ days into the current quota cycle)
-- recurs every single month for anyone on a real recurring quota — it's not an
-- occasional event like a credit batch expiring. A permanent block means this
-- content type effectively sends ONCE PER PERSON, EVER, then never again, which
-- defeats its own purpose after month one. Explicitly deferred (not forgotten):
-- revisit lifecycle-nudge.mjs's dedup for this key specifically (e.g. "enrolled in
-- the last ~35 days" instead of "ever") when this content actually gets drafted.
--
-- Dropped "split_part(u.full_name, ' ', 1) AS first_name", 2026-08-06 (content
-- drafting pass): the greeting ended up a static "Hi there," (19/26 rows this run
-- had a null first_name, and at least one non-null value was garbage, e.g. "MCP"),
-- so first_name is not referenced by the drafted content at all — confirmed by
-- grep, only in explanatory comments, not a live merge tag. Same reasoning already
-- applied to insider-nudge.sql/setup-nudge.sql/credit-plan-lifecycle-credits-expiring.sql.
--
-- This is the ONLY query this skill may run for this group. Never edit ad hoc;
-- edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  u.subscription_tier AS plan_tier,
  u.credits AS credits_remaining,
  u.monthly_quota,
  u.quota_cycle_start
FROM api_user u
WHERE u.is_active = true
  AND u.subscription_cancellation = false
  AND u.monthly_quota > 0
  AND u.quota_cycle_start IS NOT NULL
  AND u.quota_cycle_start <= now() - interval '25 days'
ORDER BY u.quota_cycle_start ASC;
