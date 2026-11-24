-- name:         idx-news-issue-stories-by-date-range
-- computes:     one row per section story across published IDX daily issues in a range: issue_date, section key, headline, tickers, first article's source host and id, supporting article count (flash and lead excluded)
-- universe:     news_issue rows with market_type = 'idx'
-- window:       parameterised, issue_date >= {{start_date}} and < {{end_date}} (end exclusive)
-- exclusions:   lead and flash are not returned; blurbs and thumbnails are not returned
-- approved:     2026-10-13, Evelyn
-- used by:      indonesia/news redesign mockup (weekly view grouped by topic)
select i.issue_date::text as issue_date,
       s.key as section,
       st.ord as position,
       st.value->>'headline' as headline,
       st.value->'tickers' as tickers,
       substring(st.value->'supporting_news'->0->>'source' from '://(?:www\.)?([^/]+)') as source_host,
       st.value->'supporting_news'->0->>'id' as first_article_id,
       jsonb_array_length(st.value->'supporting_news') as article_count
from news_issue i,
     jsonb_each(i.sections) s,
     jsonb_array_elements(s.value) with ordinality as st(value, ord)
where i.market_type = 'idx'
  and i.issue_date >= '{{start_date}}'
  and i.issue_date < '{{end_date}}'
order by i.issue_date asc, s.key asc, st.ord asc
