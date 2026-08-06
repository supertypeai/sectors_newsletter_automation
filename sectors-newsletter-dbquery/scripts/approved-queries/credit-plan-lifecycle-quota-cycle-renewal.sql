-- APPROVED fixed query for issue type: credit-plan-lifecycle (quota-cycle-renewal group)
-- Approved: 2026-07-16
--
-- Eligibility: active users on a real monthly quota (monthly_quota > 0) who are 25
-- or more days into their current quota cycle, i.e. renewal is coming up soon.
--
-- 2026-08-06 changes, for the recurring monthly GitHub Actions lifecycle-nudge
-- automation (this query previously only ran for one-off manual drafting), mirroring
-- the same changes applied to insider-nudge.sql / setup-nudge.sql on 2026-08-05:
--   - Added "AND u.subscription_cancellation = false" (confirmed via
--     information_schema.columns: boolean, NOT NULL on api_user). Never enroll a
--     user who has initiated cancellation into a new lifecycle email journey.
--
-- Dropped "split_part(u.full_name, ' ', 1) AS first_name": the greeting ended up a
-- static "Hi there," (19/26 rows had a null first_name, and at least one non-null
-- value was garbage, e.g. "MCP"), so first_name is not referenced by the drafted
-- content at all. Same reasoning applied to insider-nudge.sql/setup-nudge.sql/
-- credit-plan-lifecycle-credits-expiring.sql.
--
-- MAJOR REVISION, 2026-08-06: quota_cycle_start is no longer used at all (confirmed
-- unreliable by the user, not maintained correctly for this purpose). The cycle start
-- is now computed fresh, every run, from subscription_expiry's day-of-month instead:
-- take EXTRACT(DAY FROM subscription_expiry) as the recurring monthly billing day,
-- find the most recent occurrence of that day-of-month at or before now(), clamped to
-- the actual last day of any month shorter than that day (e.g. day 31 in a 30-day
-- month clamps to that month's day 30; day 29/30/31 in February clamps to Feb's real
-- last day). If this month's clamped occurrence is still in the future relative to
-- now(), falls back to last month's clamped occurrence. Verified against real data
-- and against explicit Feb/June reference dates before promotion — see session notes;
-- not just reasoned through, actually executed against Supabase for both the general
-- case and the day-29/30/31-in-a-short-month edge case.
--
-- days_into_cycle is now computed here in SQL, not in the automation script — it's
-- inherently the same value the eligibility filter itself needs, so this is a single
-- source of truth instead of the eligibility check and the display value being
-- computed two different ways from two different columns. Exposed directly as a
-- column; the automation script (lifecycle-nudge.mjs) no longer needs its own
-- extraVars hook for this type, {{days_into_cycle}} is just a raw column like
-- {{monthly_quota}}/{{plan_tier}}.
--
-- Dropped "u.credits AS credits_remaining": the drafted content only ever references
-- {{days_into_cycle}}/{{monthly_quota}}/{{plan_tier}} — credits_remaining is neither
-- shown directly nor used to compute anything. Confirmed dead by grepping the actual
-- template's merge tags against this query's columns, not assumed.
--
-- This is the ONLY query this skill may run for this group. Never edit ad hoc;
-- edits require re-approval, see ../../references/supabase-access.md.

WITH today AS (
  -- Query-wide constants, computed once (not per-row): this/last calendar
  -- month's actual length, used below to clamp a day-29/30/31 billing day
  -- that doesn't exist in a shorter month.
  SELECT
    EXTRACT(DAY FROM (date_trunc('month', now()) + interval '1 month - 1 day'))::int AS this_month_len,
    EXTRACT(DAY FROM (date_trunc('month', now() - interval '1 month') + interval '1 month - 1 day'))::int AS last_month_len
),
cycle AS (
  SELECT
    u.id,
    u.email,
    u.subscription_tier AS plan_tier,
    u.monthly_quota,
    EXTRACT(DAY FROM u.subscription_expiry)::int AS expiry_day
  FROM api_user u
  WHERE u.is_active = true
    AND u.subscription_cancellation = false
    AND u.monthly_quota > 0
    AND u.subscription_expiry IS NOT NULL
),
candidates AS (
  SELECT
    cycle.*,
    date_trunc('month', now()) + (LEAST(expiry_day, today.this_month_len) - 1) * interval '1 day' AS this_month_candidate,
    date_trunc('month', now() - interval '1 month') + (LEAST(expiry_day, today.last_month_len) - 1) * interval '1 day' AS last_month_candidate
  FROM cycle CROSS JOIN today
),
resolved AS (
  SELECT
    id AS user_id,
    email,
    plan_tier,
    monthly_quota,
    CASE WHEN this_month_candidate <= now() THEN this_month_candidate ELSE last_month_candidate END AS cycle_start
  FROM candidates
)
SELECT
  user_id,
  email,
  plan_tier,
  monthly_quota,
  EXTRACT(DAY FROM now() - cycle_start)::int AS days_into_cycle
FROM resolved
WHERE now() - cycle_start >= interval '25 days'
ORDER BY cycle_start ASC;
