-- name:         onboarding-unclaimed-reward
-- returns:      one row per eligible user: user_id, email, first_name
-- eligibility:  active, non-staff users with at least one onboarding_progress row and no onboarding_claims rows (started but never claimed the reward)
-- exclusions:   staff, users who never started onboarding, users who already claimed
-- approved:     2026-07-16, approver not recorded (carried over from sectors_newsletter_automation)
-- used by:      manual drafting of unclaimed-reward emails (not scheduled)
--
-- APPROVED fixed query for issue type: onboarding-unclaimed-reward
-- Approved: 2026-07-16
--
-- Eligibility: active, non-staff users who have started onboarding (at least one
-- onboarding_progress row) but have not claimed any onboarding reward
-- (zero onboarding_claims rows), i.e. mid-quest with an unclaimed 500-credit reward
-- sitting there.
--
-- This is the ONLY query this skill may run for onboarding-unclaimed-reward. Never
-- edit ad hoc; edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  split_part(u.full_name, ' ', 1) AS first_name
FROM api_user u
WHERE u.is_active = true
  AND u.is_staff = false
  AND EXISTS (SELECT 1 FROM onboarding_progress op WHERE op.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM onboarding_claims oc WHERE oc.user_id = u.id)
ORDER BY u.id
LIMIT 50;
