-- APPROVED fixed query for issue type: credit-plan-lifecycle (credits-expiring group)
-- Approved: 2026-07-16
--
-- Eligibility: active users (staff included, no is_staff filter) whose credit
-- balance expires within 14 days.
--
-- 2026-08-06 changes, for the recurring monthly GitHub Actions lifecycle-nudge
-- automation (this query previously only ran for one-off manual drafting), mirroring
-- the same changes applied to insider-nudge.sql / setup-nudge.sql on 2026-08-05:
--   - Dropped "LIMIT 50". A hard cap made sense for a one-off draft sample, but
--     baked into a monthly automated enrollment run it would silently skip
--     everyone past the 50th eligible row (by credits_expire_at) every month. The
--     automation script paginates/chunks downstream, so nothing needs a capped
--     result set.
--   - Added "AND u.subscription_cancellation = false" (confirmed via
--     information_schema.columns: boolean, NOT NULL on api_user). Never enroll a
--     user who has initiated cancellation into a new lifecycle email journey.
--
-- BUG FIX, 2026-08-06: added "AND u.credits_expire_at >= now()". The original
-- 2026-07-16 approval had no lower bound, so "<= now() + 14 days" matched ANY past
-- date too, not just the next 14 days. Live-verified before this fix: of 798 total
-- matches, 766 (96%) were already-expired credits, some over 18 months in the past
-- — dropping LIMIT 50 just made this visible, the bug predates this session's
-- changes. Only 32 rows were genuinely upcoming. Fixed to the query's clearly
-- intended behavior (an upcoming-expiry nudge, not a past-expiry one).
--
-- Note: "ever enrolled" dedup for this type is a permanent per-sequence block in
-- the automation script, same mechanism as insider-nudge/setup-nudge, even though
-- a credit-expiry event can legitimately recur for the same person months later
-- (a new credit batch, a new expiry). Accepted v1 tradeoff: a missed second nudge
-- later, not a duplicate-send risk. Revisit only if it turns out to matter.
--
-- Dropped "split_part(u.full_name, ' ', 1) AS first_name", 2026-08-06 (content
-- drafting pass): the greeting ended up a static "Hi there," (32/32 rows this run
-- had a null first_name), so first_name is not referenced by the drafted content at
-- all — confirmed by grep, only in explanatory comments, not a live merge tag. Same
-- reasoning already applied to insider-nudge.sql/setup-nudge.sql.
--
-- This is the ONLY query this skill may run for this group. Never edit ad hoc;
-- edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  u.subscription_tier AS plan_tier,
  u.credits AS credits_remaining,
  u.credits_expire_at
FROM api_user u
WHERE u.is_active = true
  AND u.subscription_cancellation = false
  AND u.credits_expire_at IS NOT NULL
  AND u.credits_expire_at >= now()
  AND u.credits_expire_at <= now() + interval '14 days'
ORDER BY u.credits_expire_at ASC;
