-- name:         scheduled-database-jobs
-- computes:     every pg_cron job registered in the database: schedule, command and
--               whether it is currently active
-- universe:     all rows of cron.job (operational metadata, not market or account data)
-- window:       not applicable, this is current state rather than a time series
-- exclusions:   none, inactive jobs are returned deliberately and flagged by `active`
-- survivorship: not applicable, no historical sampling
-- statistic:    none, raw catalog rows
-- rationale:    database-side refresh schedules are not in version control. The
--               supabase-backend migrations create the pg_cron extension but contain no
--               cron.schedule calls, and that repo's README warns migra strips them.
--               cron.job is therefore the only source of truth for these schedules.
-- caution:      `active` false means the job is registered but not running. Never report
--               a schedule from this table as a live refresh cadence without checking it.
-- approved:     2026-09-12, evelyn
-- used by:      internal knowledge base pipeline inventory
select
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  database,
  username,
  active
from cron.job
order by jobname;
