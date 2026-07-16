-- APPROVED fixed query for issue type: credit-plan-lifecycle (quota-cycle-renewal group)
-- Approved: 2026-07-16
--
-- Eligibility: active users on a real monthly quota (monthly_quota > 0) who are 25
-- or more days into their current quota cycle (quota_cycle_start), i.e. renewal is
-- coming up soon.
--
-- This is the ONLY query this skill may run for this group. Never edit ad hoc;
-- edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  split_part(u.full_name, ' ', 1) AS first_name,
  u.subscription_tier AS plan_tier,
  u.credits AS credits_remaining,
  u.monthly_quota,
  u.quota_cycle_start
FROM api_user u
WHERE u.is_active = true
  AND u.monthly_quota > 0
  AND u.quota_cycle_start IS NOT NULL
  AND u.quota_cycle_start <= now() - interval '25 days'
ORDER BY u.quota_cycle_start ASC
LIMIT 50;
