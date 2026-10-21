-- APPROVED fixed query for issue type: onboarding-nudge
-- Approved: 2026-07-16
--
-- Eligibility: active (non-staff, non-superuser) users with zero rows in BOTH
-- onboarding_progress and onboarding_claims for any track, i.e. never started
-- onboarding at all. No signup-age or reactivation-suppression filter (explicitly
-- dropped on approval: date_joined and last_reactivation_email_sent don't matter
-- for this issue).
--
-- 2026-10-21 change: credits is returned as 0 when credits_expire_at has passed
-- (NULL expiry = still valid), so expired balances are never quoted. Users are
-- not excluded, since this nudge is not about credits.
--
-- This is the ONLY query this skill may run for onboarding-nudge. Never edit ad hoc;
-- edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  split_part(u.full_name, ' ', 1) AS first_name,
  u.date_joined AS signup_date,
  u.last_login,
  CASE WHEN u.credits_expire_at IS NULL OR u.credits_expire_at > now() THEN u.credits ELSE 0 END AS credits
FROM api_user u
WHERE u.is_active = true
  AND u.is_staff = false
  AND u.is_superuser = false
  AND NOT EXISTS (SELECT 1 FROM onboarding_progress op WHERE op.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM onboarding_claims oc WHERE oc.user_id = u.id)
ORDER BY u.date_joined ASC
LIMIT 50;
