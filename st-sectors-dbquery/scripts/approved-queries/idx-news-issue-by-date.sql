-- name:         idx-news-issue-by-date
-- computes:     the full stored IDX daily news issue for one date: lead, sections, flash, what_to_watch jsonb as stored
-- universe:     news_issue rows with market_type = 'idx'
-- window:       single issue_date, {{issue_date}}
-- exclusions:   none; row returned as stored
-- approved:     2026-10-13, Evelyn
-- used by:      indonesia/news redesign mockup
SELECT issue_date::text AS issue_date, lead, sections, flash, what_to_watch
FROM news_issue
WHERE market_type = 'idx'
  AND issue_date = '{{issue_date}}'
