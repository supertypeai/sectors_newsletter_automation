-- APPROVED fixed query for issue type: notification-setup-nudge
-- Approved: 2026-07-16
--
-- Eligibility: active, non-staff users with zero rows in BOTH user_watchlist and
-- user_workflow (never set up a watchlist or a workflow/alert), but who have real
-- spendable value sitting unused (credits > 0 OR monthly_quota > 0).
--
-- This is the ONLY query this skill may run for notification-setup-nudge. Never edit
-- ad hoc; edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  split_part(u.full_name, ' ', 1) AS first_name,
  u.credits,
  u.monthly_quota
FROM api_user u
WHERE u.is_active = true
  AND u.is_staff = false
  AND NOT EXISTS (SELECT 1 FROM user_watchlist w WHERE w.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM user_workflow wf WHERE wf.user_id = u.id)
  AND (u.credits > 0 OR u.monthly_quota > 0)
ORDER BY u.id
LIMIT 50;
