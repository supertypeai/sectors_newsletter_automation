-- APPROVED fixed query for issue type: setup-nudge
-- Approved: 2026-08-03
-- Renamed from api-usage-nudge.sql: 2026-08-05 (content/slug rename only, no
-- eligibility change from the rename itself).
--
-- Eligibility: active, non-staff, non-INSIDER-tier, non-cancelling users with real
-- spendable credits (credits > 0) who have never made a single API call (zero rows
-- in api_apiresponsetime, one row per real call, keyed on user_id).
--
-- Why this exists, separate from insider-nudge: watchlist,
-- workflow, and screener are gated to the INSIDER tier (confirmed by the
-- user), so a non-INSIDER user with unused credits can't be nudged toward
-- those features at all. Credits are spendable on API calls regardless of
-- tier, so "never called the API" is the correct unused-value signal for
-- this audience instead.
--
-- subscription_tier can be null for a true free-tier account that never
-- upgraded, so the exclusion uses IS DISTINCT FROM rather than != — a bare
-- != silently drops NULL rows in SQL, which would wrongly exclude exactly
-- the users this query is supposed to reach.
--
-- Live count against this window: 629 matches.
--
-- 2026-08-05 changes, for the recurring monthly GitHub Actions automation
-- (this query previously only ran for one-off manual drafting):
--   - Dropped "LIMIT 50". A hard cap made sense for a one-off draft sample, but
--     baked into a monthly automated enrollment run it would silently skip
--     everyone past the 50th eligible row (by id) every month — not hypothetical
--     given the 629-match live count above. The automation script paginates/
--     chunks downstream, so nothing needs a capped result set.
--   - Dropped "split_part(u.full_name, ' ', 1) AS first_name". The email
--     template's greeting became a static "Hi there," (this run's data was 100%
--     null first_name anyway), so first_name is no longer referenced by the
--     content at all — confirmed by grep, only in explanatory comments now, not
--     a live merge tag.
--   - Added "AND u.subscription_cancellation = false" (confirmed via
--     information_schema.columns: boolean, NOT NULL on api_user). Never enroll a
--     user who has initiated cancellation; a user who cancels mid-sequence simply
--     stops appearing in a later run and is cancelled out by the automation's own
--     ever-enrolled/no-longer-eligible diff.
--
-- This is the ONLY query this skill may run for setup-nudge. Never edit
-- ad hoc; edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  u.credits
FROM api_user u
WHERE u.is_active = true
  AND u.is_staff = false
  AND u.subscription_tier IS DISTINCT FROM 'INSIDER'
  AND u.subscription_cancellation = false
  AND u.credits > 0
  AND NOT EXISTS (SELECT 1 FROM api_apiresponsetime r WHERE r.user_id = u.id)
ORDER BY u.id;
