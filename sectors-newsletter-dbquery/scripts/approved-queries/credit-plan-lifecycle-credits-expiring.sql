-- APPROVED fixed query for issue type: credit-plan-lifecycle (credits-expiring group)
-- Approved: 2026-07-16
--
-- Eligibility: active users (staff included, no is_staff filter) whose credit
-- balance expires within 14 days.
--
-- This is the ONLY query this skill may run for this group. Never edit ad hoc;
-- edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  split_part(u.full_name, ' ', 1) AS first_name,
  u.subscription_tier AS plan_tier,
  u.credits AS credits_remaining,
  u.credits_expire_at
FROM api_user u
WHERE u.is_active = true
  AND u.credits_expire_at IS NOT NULL
  AND u.credits_expire_at <= now() + interval '14 days'
ORDER BY u.credits_expire_at ASC
LIMIT 50;
