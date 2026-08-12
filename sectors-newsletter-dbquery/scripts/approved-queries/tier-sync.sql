-- APPROVED fixed query for: tier-sync
-- Approved: 2026-08 (Week 2 calendar automation) — no live Supabase match count
-- available at approval time: no interactive Supabase MCP connector was attached to
-- that session, and query-supabase.mjs correctly refuses to execute anything from
-- fixed-queries.sql (staging only). Approved anyway on the user's explicit call,
-- since every filter here already exists verbatim in insider-nudge.sql/setup-nudge.sql
-- (is_active/is_staff/subscription_cancellation, already live-verified there) and the
-- only new element — subscription_tier IN ('STANDARD','INSIDER') — filters on values
-- the user directly confirmed are literal, not inferred from schema. The first real
-- dry-run of sync-tier-tags.mjs (which does have Supabase access via
-- SUPABASE_ACCESS_TOKEN) is the actual live check, deferred to then rather than done
-- at approval time.
--
-- Feeds sync-tier-tags.mjs, which keeps mailroom's STANDARD/INSIDER segments
-- (Contact.tags-filtered, confirmed tier-only) in sync with the real Sectors
-- subscription tier — those segments drive audience targeting for the
-- three-stock-story / single-company-deep-dive Week 2 sends.
--
-- Deliberately narrowed to STANDARD/INSIDER only, not every active user. The sync
-- script never needs to write a literal "FREE" tag: a real FREE user just needs to
-- not be stuck with a stale STANDARD/INSIDER tag (e.g. after downgrading), which the
-- script detects by that email's absence from this result — not by a FREE row here.
-- See sync-tier-tags.mjs's own header for the full diff design.
--
-- This is the ONLY query this skill may run for tier-sync. Never edit ad hoc; edits
-- require re-approval, see ../../references/supabase-access.md.

SELECT
  id AS user_id,
  email,
  subscription_tier
FROM api_user
WHERE is_active = true
  AND is_staff = false
  AND subscription_cancellation = false
  AND subscription_tier IN ('STANDARD', 'INSIDER')
ORDER BY id;
