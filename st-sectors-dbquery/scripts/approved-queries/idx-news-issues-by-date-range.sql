-- name:         idx-news-issues-by-date-range
-- computes:     one row per published IDX daily news issue in a range: issue_date, lead headline and blurb, story count across sections, flash count
-- universe:     news_issue rows with market_type = 'idx'
-- window:       parameterised, issue_date between {{start_date}} and {{end_date}}
-- exclusions:   none; every stored issue in the window is returned
-- approved:     2026-10-13, Evelyn
-- used by:      indonesia/news redesign mockup
SELECT issue_date::text AS issue_date,
       lead->>'headline' AS lead_headline,
       lead->>'blurb' AS lead_blurb,
       (SELECT count(*) FROM jsonb_each(sections) s, jsonb_array_elements(s.value)) AS section_story_count,
       jsonb_array_length(flash) AS flash_count
FROM news_issue
WHERE market_type = 'idx'
  AND issue_date BETWEEN '{{start_date}}' AND '{{end_date}}'
ORDER BY issue_date ASC
