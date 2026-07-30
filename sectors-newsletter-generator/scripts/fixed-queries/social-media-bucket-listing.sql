-- Fixed query: list candidate social-card filenames in the carousel pipeline's
-- Supabase storage bucket, for weekly-insights-v2's block 4 visuals.
--
-- Why this exists: workflows/weekly-insights-v2.md's card-selection recipe needs the
-- bucket's file list to apply its own eligibility rules (date-window match on the
-- filename's own YYYYMMDD, drop story-only prefixes, pick what illustrates a finding
-- already derived from the API). The bucket's public read endpoint only resolves an
-- exactly-known filename and cannot be listed: `POST /storage/v1/object/list/<bucket>`
-- returns `headers must have required property 'authorization'` (confirmed 2026-07-20).
--
-- Supabase Storage keeps every object's metadata in the ordinary Postgres table
-- `storage.objects` (bucket_id, name, created_at, ...), present on every Supabase
-- project as part of the Storage service's own schema. Since this skill already holds
-- a read-only Supabase MCP connector for the foreign-flow fixed query
-- (fixed-queries/foreign-flow-range.sql), that same connector can list this bucket too
-- with no new credential: querying Postgres system tables for object metadata, not
-- calling the Storage REST API that requires its own auth header.
--
-- Run this BEFORE generating a chart with charts.mjs, not after. Block 4 visuals
-- default to a real card when this query succeeds; chart generation is the fallback
-- for when the Supabase MCP connector isn't available in the runner (see SKILL.md's
-- unattended-defaults table and this workflow doc's own "Auto-selecting cards,
-- unattended" section).
--
-- Params: none required. Optionally narrow `created_at` to roughly the last month
-- if the bucket is large; this is only to bound the result set, NOT the eligibility
-- filter. The authoritative filter is still the filename's own YYYYMMDD against the
-- issue's Mon-Fri window, exactly as workflows/weekly-insights-v2.md's "How to pick
-- which images to use" section already specifies — apply that after this query
-- returns, don't skip straight to whatever's newest by created_at.

select
  name,       -- the object key, e.g. 'insider_cluster_cuan_20260710_2.jpg'
  created_at  -- generation time; a loose recency bound only, not the eligibility date
from storage.objects
where bucket_id = 'social_media_generation'
order by created_at desc
limit 500;

-- Build the public URL for any eligible name (from the "How to pick" criteria) as:
--   https://rfiycxgjbnkefczvbosm.supabase.co/storage/v1/object/public/social_media_generation/<name>
-- These reads are public and unauthenticated (no signed-URL expiry), so the URL
-- built here is exactly what goes in <img src> — reference it directly, never
-- re-host or re-upload it. This is a real, already-public asset, unlike a
-- charts.mjs-generated chart, which is local-only until rasterized and uploaded.
--
-- If this query fails (connector not configured, bucket renamed, table missing),
-- that failure is the unattended-path trigger: fall back to generating a chart with
-- charts.mjs for that finding, exactly as workflows/weekly-insights-v2.md documents.
