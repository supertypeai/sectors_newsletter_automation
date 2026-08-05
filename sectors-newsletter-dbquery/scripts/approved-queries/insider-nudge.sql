-- APPROVED fixed query for issue type: insider-nudge
-- Approved: 2026-07-16. Corrected: 2026-08-03 (see below).
-- Renamed from notification-setup-nudge.sql: 2026-08-05 (content/slug rename only,
-- no eligibility change from the rename itself).
--
-- Eligibility: active, non-staff, INSIDER-tier, non-cancelling users with zero rows
-- in BOTH user_watchlist and user_workflow (never set up a watchlist or a
-- workflow/alert), but who have real spendable value sitting unused
-- (credits > 0 OR monthly_quota > 0).
--
-- 2026-08-03 correction: added "AND u.subscription_tier = 'INSIDER'". The
-- original approved version had no tier filter at all, and would nudge any
-- eligible user toward watchlist/workflow setup regardless of tier. Confirmed
-- (by the user, product knowledge, not inferred from schema): watchlist,
-- workflow, and screener are gated to the INSIDER tier, so a Free/Standard
-- user receiving this nudge would click through and hit a paywall — the
-- original query was eligible to send objectively broken advice. Live count
-- against this window: 39 matches (was unfiltered before). Non-INSIDER users
-- with unused credits get a different nudge instead, see setup-nudge.sql.
--
-- 2026-08-05 changes, for the recurring monthly GitHub Actions automation
-- (this query previously only ran for one-off manual drafting):
--   - Dropped "LIMIT 50". A hard cap made sense for a one-off draft sample, but
--     baked into a monthly automated enrollment run it would silently skip
--     everyone past the 50th eligible row (by id) every month. The automation
--     script paginates/chunks downstream, so nothing needs a capped result set.
--   - Dropped "split_part(u.full_name, ' ', 1) AS first_name". The email
--     template's greeting became a static "Hi there," (most rows have no usable
--     name), so first_name is no longer referenced by the content at all —
--     confirmed by grep, only in explanatory comments now, not a live merge tag.
--   - Added "AND u.subscription_cancellation = false" (confirmed via
--     information_schema.columns: boolean, NOT NULL on api_user). Never enroll a
--     user who has initiated cancellation; a user who cancels mid-sequence simply
--     stops appearing in a later run and is cancelled out by the automation's own
--     ever-enrolled/no-longer-eligible diff.
--
-- This is the ONLY query this skill may run for insider-nudge. Never edit
-- ad hoc; edits require re-approval, see ../../references/supabase-access.md.

SELECT
  u.id AS user_id,
  u.email,
  u.credits,
  u.monthly_quota
FROM api_user u
WHERE u.is_active = true
  AND u.is_staff = false
  AND u.subscription_tier = 'INSIDER'
  AND u.subscription_cancellation = false
  AND NOT EXISTS (SELECT 1 FROM user_watchlist w WHERE w.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM user_workflow wf WHERE wf.user_id = u.id)
  AND (u.credits > 0 OR u.monthly_quota > 0)
ORDER BY u.id;
